/**
 * POST /api/recap — "Previously…" memory-bridge generation.
 * Runs as a Vercel Function in production; vite.config.ts mounts the same handler in dev.
 *
 * The browser extracts the text of exactly the pages of one reading session and posts it here.
 * This endpoint:
 *   1. authenticates the reader with their Supabase access token,
 *   2. loads the session under RLS (so it must be theirs) and checks its book is theirs,
 *   3. rejects any page outside the stored session range — the spoiler guard does not rely on
 *      the prompt alone,
 *   4. calls Gemini Flash with a key that never reaches the client, falling back to NVIDIA NIM
 *      (a different provider, so a different quota pool) if Gemini is unconfigured, rate-limited,
 *      or unreachable,
 *   5. stores the recap on the session, guarded by the same range so a session whose boundaries
 *      were edited meanwhile is never overwritten with a recap of its old pages.
 */

type Env = Record<string, string | undefined>;

export interface RecapPage {
  pageNumber: number;
  text: string;
}

export interface RecapPayload {
  sessionId: string;
  bookTitle: string;
  author: string;
  startPage: number;
  endPage: number;
  format: 'pdf' | 'epub';
  startCfi?: string | null;
  endCfi?: string | null;
  pages: RecapPage[];
}

export interface RecapHandlerOptions {
  env: Env;
  /** Dev server only: accept requests without a Supabase session (local demo accounts). */
  allowAnonymous?: boolean;
  fetchImpl?: typeof fetch;
}

export type RecapErrorCode =
  | 'invalid_request'
  | 'unauthenticated'
  | 'not_found'
  | 'not_configured'
  | 'quota'
  | 'blocked'
  | 'insufficient_content'
  | 'unavailable';

// Current stable Flash models. Provider/model overrides remain available through environment vars.
export const DEFAULT_GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];
export const DEFAULT_NVIDIA_MODELS = ['nvidia/nemotron-3-super-120b-a12b', 'openai/gpt-oss-20b'];
export const INSUFFICIENT_CONTENT = 'INSUFFICIENT_CONTENT';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const GEMINI_TIMEOUT_MS = 10_000;
const NVIDIA_TIMEOUT_MS = 15_000;
const MAX_SESSION_PAGES = 150;
const MAX_PAGE_CHARS = 8_000;
const MAX_EXCERPT_CHARS = 30_000;
const MIN_EXCERPT_CHARS = 80;
const MAX_RECAP_WORDS = 160;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SYSTEM_INSTRUCTION = [
  'You write the "Previously…" note a reader sees when they come back to a book they are part-way through.',
  'Its only job is to help them remember what they need from their last reading session so they can carry on from where they stopped.',
  '',
  'Grounding',
  '- Use only the excerpt you are given. It is exactly what the reader read last time, and it ends where they stopped.',
  '- Ignore anything you may know about this book or its author. Never predict, foreshadow or hint at anything after the excerpt.',
  `- If the excerpt has too little readable content to recap (for example a table of contents, an index, or garbled text), reply with exactly ${INSUFFICIENT_CONTENT}.`,
  '',
  'What to keep',
  '- Be selective. Keep what changed and what matters for continuity; drop incidental detail. One major revelation outweighs many minor events.',
  '- Fiction: key events, character developments, relationships, conflicts, revelations, and where the story stands at the end.',
  '- Nonfiction: the main arguments, concepts and conclusions, and the examples that carry them.',
  '- Technical or textbook material: the concepts, definitions and mechanisms, and how they connect.',
  '- Finish with where things stand at the point the reader stopped.',
  '',
  'Form',
  '- About 30 seconds to read: roughly 50 to 110 words. A light session needs about three short sentences; a dense one up to six or seven short sentences. Never more than 140 words.',
  '- Plain prose in one or two short paragraphs. No title, heading, bullet points or markdown, and no preamble such as "In this session".',
  "- Match the book's register (tone, formality, vocabulary) so the note feels native to it, but do not imitate the author's distinctive voice and do not quote more than a few words.",
].join('\n');

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested)
// ---------------------------------------------------------------------------

export function parsePayload(body: unknown): { ok: true; value: RecapPayload } | { ok: false; error: string } {
  const b = body as Partial<RecapPayload> | null;
  if (!b || typeof b !== 'object') return { ok: false, error: 'Expected a JSON object.' };
  if (typeof b.sessionId !== 'string' || !UUID_RE.test(b.sessionId)) return { ok: false, error: 'Invalid session id.' };
  if (!Number.isInteger(b.startPage) || !Number.isInteger(b.endPage)) return { ok: false, error: 'Invalid page range.' };
  if (b.format !== undefined && b.format !== 'pdf' && b.format !== 'epub') return { ok: false, error: 'Invalid book format.' };
  const startPage = b.startPage as number;
  const endPage = b.endPage as number;
  if (startPage < 1 || endPage < startPage || endPage - startPage + 1 > MAX_SESSION_PAGES) {
    return { ok: false, error: 'Invalid page range.' };
  }
  if (!Array.isArray(b.pages) || b.pages.length === 0 || b.pages.length > MAX_SESSION_PAGES) {
    return { ok: false, error: 'Missing page text.' };
  }
  if ((b.startCfi != null && (typeof b.startCfi !== 'string' || b.startCfi.length > 2048)) ||
      (b.endCfi != null && (typeof b.endCfi !== 'string' || b.endCfi.length > 2048))) {
    return { ok: false, error: 'Invalid reading position.' };
  }
  if (b.format === 'epub' && !b.endCfi) {
    return { ok: false, error: 'An EPUB recap needs a precise stopping place.' };
  }

  const seen = new Set<number>();
  const pages: RecapPage[] = [];
  for (const raw of b.pages as unknown[]) {
    const p = raw as Partial<RecapPage>;
    if (!p || !Number.isInteger(p.pageNumber) || typeof p.text !== 'string') {
      return { ok: false, error: 'Invalid page entry.' };
    }
    const pageNumber = p.pageNumber as number;
    // Spoiler guard: nothing outside the declared session range is accepted.
    if (pageNumber < startPage || pageNumber > endPage) {
      return { ok: false, error: 'Page text outside the session range.' };
    }
    if (seen.has(pageNumber)) continue;
    seen.add(pageNumber);
    pages.push({ pageNumber, text: p.text.slice(0, MAX_PAGE_CHARS) });
  }
  pages.sort((a, c) => a.pageNumber - c.pageNumber);

  return {
    ok: true,
    value: {
      sessionId: b.sessionId,
      bookTitle: typeof b.bookTitle === 'string' ? b.bookTitle.slice(0, 300) : '',
      author: typeof b.author === 'string' ? b.author.slice(0, 200) : '',
      startPage,
      endPage,
      format: b.format ?? 'pdf',
      startCfi: b.startCfi ?? null,
      endCfi: b.endCfi ?? null,
      pages,
    },
  };
}

/** Joins page texts in order; over budget, trims each page (keeping the last pages fuller). */
export function buildExcerpt(pages: RecapPage[], budget = MAX_EXCERPT_CHARS, format: 'pdf' | 'epub' = 'pdf'): string {
  const label = format === 'epub' ? 'section' : 'p.';
  const usable = pages
    .map((p) => ({ pageNumber: p.pageNumber, text: p.text.trim() }))
    .filter((p) => p.text.length > 0)
    .sort((a, b) => a.pageNumber - b.pageNumber);
  if (usable.length === 0) return '';

  const total = usable.reduce((n, p) => n + p.text.length, 0);
  if (total <= budget) {
    return usable.map((p) => `[${label} ${p.pageNumber}]\n${p.text}`).join('\n\n');
  }

  // Where the reader stopped matters most for continuity, so the final pages get double weight.
  const weights = usable.map((_, i) => (i >= usable.length - 2 ? 2 : 1));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  return usable
    .map((p, i) => {
      const allowance = Math.max(200, Math.floor((budget * weights[i]) / weightSum));
      const body =
        p.text.length <= allowance
          ? p.text
          : `${p.text.slice(0, Math.floor(allowance * 0.6))} … ${p.text.slice(p.text.length - Math.floor(allowance * 0.4))}`;
      return `[${label} ${p.pageNumber}]\n${body}`;
    })
    .join('\n\n');
}

export function buildUserPrompt(payload: RecapPayload, excerpt: string): string {
  const byline = payload.author ? ` by ${payload.author}` : '';
  const unit = payload.format === 'epub' ? 'sections' : 'pages';
  const boundary = payload.format === 'epub'
    ? 'and it ends where they stopped'
    : 'and it ends on the last page they read';
  return [
    `Book: "${payload.bookTitle || 'Untitled'}"${byline}`,
    `The reader's last session covered ${unit} ${payload.startPage}–${payload.endPage}. The excerpt below is the text they saw in those ${unit}, in order, ${boundary}.`,
    '',
    '<excerpt>',
    excerpt,
    '</excerpt>',
    '',
    'Write the "Previously…" note.',
  ].join('\n');
}

/** Normalises model output into short plain prose, or null if there is no usable recap. */
export function cleanRecapText(raw: string, truncated = false): string | null {
  let text = raw.replace(/\r/g, '').trim();
  if (!text || text.includes(INSUFFICIENT_CONTENT)) return null;

  text = text
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, '')
    .replace(/^\s*previously\s*(?:…|\.\.\.|[:,])\s*/i, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const words = text.split(/\s+/);
  if (truncated || words.length > MAX_RECAP_WORDS) {
    const clipped = words.slice(0, MAX_RECAP_WORDS).join(' ');
    const lastSentenceEnd = Math.max(
      ...['.', '!', '?', '."', '.”', '!”', '?”'].map((stop) => {
        const at = clipped.lastIndexOf(stop);
        return at < 0 ? -1 : at + stop.length;
      })
    );
    text = lastSentenceEnd > 0 ? clipped.slice(0, lastSentenceEnd) : clipped;
  }

  return text.length >= 20 ? text : null;
}

export function readCandidate(data: unknown): { text: string; finishReason?: string; blocked: boolean } {
  const d = data as {
    candidates?: { content?: { parts?: { text?: unknown; thought?: boolean }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  } | null;
  const candidate = d?.candidates?.[0];
  if (!candidate) return { text: '', blocked: Boolean(d?.promptFeedback?.blockReason) };
  const text = (candidate.content?.parts ?? [])
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text as string)
    .join('');
  const finishReason = candidate.finishReason;
  const blocked = finishReason === 'SAFETY' || finishReason === 'RECITATION' || finishReason === 'PROHIBITED_CONTENT';
  return { text, finishReason, blocked };
}

// ---------------------------------------------------------------------------
// I/O
// ---------------------------------------------------------------------------

type Failure = { ok: false; status: number; code: RecapErrorCode; message: string };
type Generation = { ok: true; text: string; truncated: boolean; model: string; provider: 'gemini' | 'nvidia' };

/** Gemini rejected/unreachable/rate-limited: worth handing to a different provider with its own quota. */
function isFallbackWorthy(f: Failure): boolean {
  return f.code === 'quota' || f.code === 'not_configured' || f.code === 'unavailable';
}

async function callGemini(
  env: Env,
  apiKey: string,
  userPrompt: string,
  fetchImpl: typeof fetch
): Promise<Generation | Failure> {
  const models = env.GEMINI_MODEL
    ? env.GEMINI_MODEL.split(',').map((m) => m.trim()).filter(Boolean)
    : DEFAULT_GEMINI_MODELS;
  const baseUrl = (env.GEMINI_API_BASE || GEMINI_BASE_URL).replace(/\/$/, '');
  let failure: Failure = { ok: false, status: 502, code: 'unavailable', message: 'The recap service is unavailable right now.' };

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetchImpl(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
        signal: controller.signal,
      });
    } catch (err) {
      const timedOut = (err as Error)?.name === 'AbortError';
      return { ok: false, status: 504, code: 'unavailable', message: timedOut ? 'The recap took too long.' : 'Could not reach the recap service.' };
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 429) {
      return { ok: false, status: 429, code: 'quota', message: 'Recap limit reached for now. Try again later.' };
    }
    if (res.status === 401 || res.status === 403) {
      const detail = await res.text().catch(() => '');
      console.warn(`[recap] Gemini rejected the API key (HTTP ${res.status}): ${detail.slice(0, 200)}`);
      return { ok: false, status: 503, code: 'not_configured', message: 'The recap service is not available right now.' };
    }
    if (!res.ok) {
      // 404: model not available to this key — try the next one. 5xx: transient — try the next one.
      failure = { ok: false, status: 502, code: 'unavailable', message: 'The recap service is unavailable right now.' };
      if (res.status === 404 || res.status >= 500) continue;
      return failure;
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      continue;
    }
    const candidate = readCandidate(data);
    if (candidate.blocked) {
      return { ok: false, status: 422, code: 'blocked', message: 'A recap could not be written for these pages.' };
    }
    if (!candidate.text.trim()) continue;
    return { ok: true, text: candidate.text, truncated: candidate.finishReason === 'MAX_TOKENS', model, provider: 'gemini' };
  }
  return failure;
}

/** NVIDIA NIM's OpenAI-compatible chat-completions API — a separate provider with its own quota. */
async function callNvidia(
  env: Env,
  apiKey: string,
  userPrompt: string,
  fetchImpl: typeof fetch
): Promise<Generation | Failure> {
  const models = env.NVIDIA_MODEL
    ? env.NVIDIA_MODEL.split(',').map((m) => m.trim()).filter(Boolean)
    : DEFAULT_NVIDIA_MODELS;
  const baseUrl = (env.NVIDIA_BASE_URL || NVIDIA_BASE_URL).replace(/\/$/, '');
  let failure: Failure = { ok: false, status: 502, code: 'unavailable', message: 'The recap service is unavailable right now.' };

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NVIDIA_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: model === DEFAULT_NVIDIA_MODELS[0] ? 512 : 768,
          ...(model === DEFAULT_NVIDIA_MODELS[0] ? { reasoning_effort: 'none' } :
            model === DEFAULT_NVIDIA_MODELS[1] ? { reasoning_effort: 'low' } : {}),
        }),
        signal: controller.signal,
      });
    } catch (err) {
      const timedOut = (err as Error)?.name === 'AbortError';
      return { ok: false, status: 504, code: 'unavailable', message: timedOut ? 'The recap took too long.' : 'Could not reach the recap service.' };
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 429) {
      return { ok: false, status: 429, code: 'quota', message: 'Recap limit reached for now. Try again later.' };
    }
    if (res.status === 401 || res.status === 403) {
      const detail = await res.text().catch(() => '');
      console.warn(`[recap] NVIDIA rejected the API key (HTTP ${res.status}): ${detail.slice(0, 200)}`);
      return { ok: false, status: 503, code: 'not_configured', message: 'The recap service is not available right now.' };
    }
    if (!res.ok) {
      // 404: model not available to this key — try the next one. 5xx: transient — try the next one.
      failure = { ok: false, status: 502, code: 'unavailable', message: 'The recap service is unavailable right now.' };
      if (res.status === 404 || res.status >= 500) continue;
      return failure;
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      continue;
    }
    const choice = (data as { choices?: { message?: { content?: unknown }; finish_reason?: string }[] } | null)?.choices?.[0];
    const text = typeof choice?.message?.content === 'string' ? choice.message.content : '';
    if (!text.trim()) continue;
    return { ok: true, text, truncated: choice?.finish_reason === 'length', model, provider: 'nvidia' };
  }
  return failure;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function supabaseConfig(env: Env): SupabaseConfig | null {
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';
  return url && anonKey ? { url, anonKey } : null;
}

function supabaseRequest(cfg: SupabaseConfig, token: string, path: string, fetchImpl: typeof fetch, init: RequestInit = {}) {
  return fetchImpl(`${cfg.url}${path}`, {
    ...init,
    headers: { apikey: cfg.anonKey, Authorization: `Bearer ${token}`, ...(init.headers as Record<string, string>) },
  });
}

interface SessionRow {
  id: string;
  user_id: string;
  book_id: string;
  start_page: number;
  end_page: number;
  start_cfi?: string | null;
  end_cfi?: string | null;
}

async function loadOwnedSession(
  cfg: SupabaseConfig,
  token: string,
  sessionId: string,
  fetchImpl: typeof fetch
): Promise<{ ok: true; row: SessionRow } | Failure> {
  const notFound: Failure = { ok: false, status: 404, code: 'not_found', message: 'Reading session not found.' };

  const userRes = await supabaseRequest(cfg, token, '/auth/v1/user', fetchImpl);
  const user = userRes.ok ? ((await userRes.json().catch(() => null)) as { id?: string } | null) : null;
  if (!user?.id) return { ok: false, status: 401, code: 'unauthenticated', message: 'Please sign in again.' };

  // RLS limits both queries to the caller's rows; the explicit user_id checks are belt and braces.
  const sessionRes = await supabaseRequest(
    cfg,
    token,
    `/rest/v1/reading_sessions?id=eq.${sessionId}&select=id,user_id,book_id,start_page,end_page,start_cfi,end_cfi`,
    fetchImpl
  );
  if (!sessionRes.ok) return notFound;
  const rows = (await sessionRes.json().catch(() => [])) as SessionRow[];
  const row = rows[0];
  if (!row || row.user_id !== user.id) return notFound;

  const bookRes = await supabaseRequest(
    cfg,
    token,
    `/rest/v1/books?id=eq.${encodeURIComponent(row.book_id)}&user_id=eq.${encodeURIComponent(user.id)}&select=id`,
    fetchImpl
  );
  const books = bookRes.ok ? ((await bookRes.json().catch(() => [])) as unknown[]) : [];
  if (books.length !== 1) return notFound;

  return { ok: true, row };
}

async function storeRecap(
  cfg: SupabaseConfig,
  token: string,
  row: SessionRow,
  recap: string,
  generatedAt: string,
  fetchImpl: typeof fetch
): Promise<boolean> {
  try {
    const res = await supabaseRequest(
      cfg,
      token,
      `/rest/v1/reading_sessions?id=eq.${row.id}&start_page=eq.${row.start_page}&end_page=eq.${row.end_page}&start_cfi=${row.start_cfi ? `eq.${encodeURIComponent(row.start_cfi)}` : 'is.null'}&end_cfi=${row.end_cfi ? `eq.${encodeURIComponent(row.end_cfi)}` : 'is.null'}&select=id`,
      fetchImpl,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ recap, recap_generated_at: generatedAt, updated_at: generatedAt }),
      }
    );
    if (!res.ok) return false;
    const rows = (await res.json().catch(() => [])) as { id?: string }[];
    return rows.length === 1 && rows[0]?.id === row.id;
  } catch {
    return false;
  }
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function fail(f: Failure): Response {
  return json(f.status, { code: f.code, error: f.message });
}

export async function handleRecapRequest(request: Request, opts: RecapHandlerOptions): Promise<Response> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  if (request.method !== 'POST') {
    return json(405, { code: 'invalid_request', error: 'Method not allowed.' });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { code: 'invalid_request', error: 'Expected a JSON body.' });
  }
  const parsed = parsePayload(body);
  if (!parsed.ok) return json(400, { code: 'invalid_request', error: parsed.error });
  const payload = parsed.value;

  const geminiKey = opts.env.GEMINI_API_KEY || opts.env.VITE_GEMINI_API_KEY;
  const nvidiaKey = opts.env.NVIDIA_API_KEY || opts.env.NVIDIA_NIM_API_KEY;
  if (!geminiKey && !nvidiaKey) {
    return json(503, { code: 'not_configured', error: 'The recap service is not configured.' });
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  let owned: { cfg: SupabaseConfig; row: SessionRow } | null = null;

  if (token) {
    const cfg = supabaseConfig(opts.env);
    if (!cfg) return json(503, { code: 'not_configured', error: 'The recap service is not configured.' });
    const result = await loadOwnedSession(cfg, token, payload.sessionId, fetchImpl);
    if (!result.ok) return fail(result);
    if (payload.startPage < result.row.start_page || payload.endPage > result.row.end_page) {
      return json(400, { code: 'invalid_request', error: 'Pages outside the reading session.' });
    }
    if ((result.row.start_cfi ?? null) !== (payload.startCfi ?? null) ||
        (result.row.end_cfi ?? null) !== (payload.endCfi ?? null)) {
      return json(400, { code: 'invalid_request', error: 'Reading position changed. Try the recap again.' });
    }
    owned = { cfg, row: result.row };
  } else if (!opts.allowAnonymous) {
    return json(401, { code: 'unauthenticated', error: 'Sign in to see recaps.' });
  }

  const excerpt = buildExcerpt(payload.pages, MAX_EXCERPT_CHARS, payload.format);
  if (excerpt.length < MIN_EXCERPT_CHARS) {
    return json(422, { code: 'insufficient_content', error: 'Not enough readable text on these pages for a recap.' });
  }

  const userPrompt = buildUserPrompt(payload, excerpt);
  let generation: Generation | Failure = geminiKey
    ? await callGemini(opts.env, geminiKey, userPrompt, fetchImpl)
    : { ok: false, status: 503, code: 'not_configured', message: 'The recap service is not available right now.' };
  if (!generation.ok && nvidiaKey && isFallbackWorthy(generation)) {
    generation = await callNvidia(opts.env, nvidiaKey, userPrompt, fetchImpl);
  }
  if (!generation.ok) return fail(generation);

  const recap = cleanRecapText(generation.text, generation.truncated);
  if (!recap) {
    return json(422, { code: 'insufficient_content', error: 'Not enough readable text on these pages for a recap.' });
  }

  const generatedAt = new Date().toISOString();
  const stored = owned ? await storeRecap(owned.cfg, token, owned.row, recap, generatedAt, fetchImpl) : false;
  return json(200, { recap, generatedAt, stored, model: generation.model, provider: generation.provider });
}

export function POST(request: Request): Promise<Response> {
  const env = ((globalThis as { process?: { env?: Env } }).process?.env ?? {}) as Env;
  return handleRecapRequest(request, { env });
}
