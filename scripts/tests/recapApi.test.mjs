import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const api = await import(pathToFileURL(join(process.env.KIN_TEST_BUILD, 'recap.mjs')).href);

const SESSION_ID = '11111111-2222-4333-8444-555555555555';
const ENV = { GEMINI_API_KEY: 'test-key', SUPABASE_URL: 'https://sb.test', SUPABASE_ANON_KEY: 'anon' };
const RECAP = 'Mira confirmed that Oren has been steering the Halcyon toward the Ember Reef. She kept the discovery to herself. The crew still trusts him, and the ship sails on.';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const page = (n) => ({ pageNumber: n, text: `Page ${n}. Captain Mira logs event ${n} aboard the Halcyon and studies the charts.` });
const payload = (overrides = {}) => ({
  sessionId: SESSION_ID,
  bookTitle: 'The Halcyon Voyage',
  author: 'T. Author',
  startPage: 84,
  endPage: 117,
  pages: range(84, 117).map(page),
  ...overrides,
});
const request = (body, token = 'user-token') =>
  new Request('http://localhost/api/recap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
const jsonResponse = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const gemini = (text, finishReason = 'STOP') => () => jsonResponse(200, { candidates: [{ content: { parts: [{ text }] }, finishReason }] });
const nvidia = (text, finishReason = 'stop') => () => jsonResponse(200, { choices: [{ message: { content: text }, finish_reason: finishReason }] });

function backend({
  user = { id: 'user-1' },
  row = { id: SESSION_ID, user_id: 'user-1', book_id: 'book-1', start_page: 84, end_page: 117 },
  bookOwned = true,
  geminiReplies = [gemini(RECAP)],
  nvidiaReplies = [],
} = {}) {
  const calls = [];
  const replies = [...geminiReplies];
  const nvReplies = [...nvidiaReplies];
  const fetchImpl = async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, init });
    if (u === 'https://sb.test/auth/v1/user') return user ? jsonResponse(200, user) : jsonResponse(401, {});
    if (u.startsWith('https://sb.test/rest/v1/reading_sessions') && init.method === 'PATCH') return new Response(null, { status: 204 });
    if (u.startsWith('https://sb.test/rest/v1/reading_sessions')) return jsonResponse(200, row ? [row] : []);
    if (u.startsWith('https://sb.test/rest/v1/books')) return jsonResponse(200, bookOwned ? [{ id: 'book-1' }] : []);
    if (u.includes(':generateContent')) {
      const next = replies.shift();
      if (!next) throw new Error('unexpected extra Gemini call');
      return next(u, init);
    }
    if (u.includes('/chat/completions')) {
      const next = nvReplies.shift();
      if (!next) throw new Error('unexpected extra NVIDIA call');
      return next(u, init);
    }
    throw new Error(`unexpected fetch ${u}`);
  };
  return {
    fetchImpl,
    calls,
    geminiCalls: () => calls.filter((c) => c.url.includes(':generateContent')),
    nvidiaCalls: () => calls.filter((c) => c.url.includes('/chat/completions')),
  };
}

async function call(body, { env = ENV, token, allowAnonymous = false, ...backendOptions } = {}) {
  const b = backend(backendOptions);
  const res = await api.handleRecapRequest(request(body, token === undefined ? 'user-token' : token), { env, allowAnonymous, fetchImpl: b.fetchImpl });
  return { res, body: await res.json(), ...b };
}

test('generates a grounded recap for exactly the session pages and stores it guarded by range', async () => {
  const { res, body, geminiCalls, calls } = await call(payload());
  assert.equal(res.status, 200);
  assert.equal(body.recap, RECAP);
  assert.equal(body.stored, true);

  const [g] = geminiCalls();
  assert.equal(geminiCalls().length, 1);
  assert.equal(g.init.headers['x-goog-api-key'], 'test-key');
  assert.ok(!g.url.includes('test-key'), 'API key is not sent in the URL');
  const prompt = JSON.parse(g.init.body).contents[0].parts[0].text;
  assert.ok(prompt.includes('[p. 84]') && prompt.includes('[p. 117]'));
  assert.ok(!prompt.includes('[p. 118]') && !prompt.includes('[p. 83]'));

  const patch = calls.find((c) => c.init.method === 'PATCH');
  assert.ok(patch.url.includes(`id=eq.${SESSION_ID}`) && patch.url.includes('start_page=eq.84') && patch.url.includes('end_page=eq.117'));
});

test('spoiler guard: text from a page after the session end is rejected before Gemini', async () => {
  const { res, geminiCalls } = await call(payload({ pages: [...range(84, 117).map(page), page(118)] }));
  assert.equal(res.status, 400);
  assert.equal(geminiCalls().length, 0);
});

test('spoiler guard: a range wider than the stored session is rejected', async () => {
  const { res, geminiCalls } = await call(payload({ endPage: 130, pages: range(84, 130).map(page) }));
  assert.equal(res.status, 400);
  assert.equal(geminiCalls().length, 0);
});

test("another user's session (hidden by RLS) is not found", async () => {
  const { res, body, geminiCalls } = await call(payload(), { row: null });
  assert.equal(res.status, 404);
  assert.equal(body.code, 'not_found');
  assert.equal(geminiCalls().length, 0);
});

test('a session pointing at a book the user does not own is not found', async () => {
  const { res, geminiCalls } = await call(payload(), { bookOwned: false });
  assert.equal(res.status, 404);
  assert.equal(geminiCalls().length, 0);
});

test('requests without a session are refused in production, allowed only by the dev server', async () => {
  const refused = await call(payload(), { token: '' });
  assert.equal(refused.res.status, 401);
  assert.equal(refused.calls.length, 0);

  const dev = await call(payload(), { token: '', allowAnonymous: true });
  assert.equal(dev.res.status, 200);
  assert.equal(dev.body.stored, false);
  assert.equal(dev.calls.filter((c) => c.url.startsWith('https://sb.test')).length, 0);
});

test('an expired token is unauthenticated', async () => {
  const { res, body } = await call(payload(), { user: null });
  assert.equal(res.status, 401);
  assert.equal(body.code, 'unauthenticated');
});

test('invalid payloads are rejected', async () => {
  assert.equal((await call(payload({ sessionId: 'not-a-uuid' }))).res.status, 400);
  assert.equal((await call(payload({ startPage: 20, endPage: 10 }))).res.status, 400);
  assert.equal((await call(payload({ pages: [] }))).res.status, 400);
  assert.equal((await call('{not json')).res.status, 400);
});

test('missing Gemini key reports not_configured', async () => {
  const { res, body } = await call(payload(), { env: { ...ENV, GEMINI_API_KEY: undefined } });
  assert.equal(res.status, 503);
  assert.equal(body.code, 'not_configured');
});

test('missing both provider keys reports not_configured', async () => {
  const { res, body, geminiCalls, nvidiaCalls } = await call(payload(), { env: { ...ENV, GEMINI_API_KEY: undefined } });
  assert.equal(res.status, 503);
  assert.equal(body.code, 'not_configured');
  assert.equal(geminiCalls().length, 0);
  assert.equal(nvidiaCalls().length, 0);
});

test('falls back to NVIDIA when Gemini is rate-limited', async () => {
  const env = { ...ENV, NVIDIA_API_KEY: 'nv-key' };
  const { res, body, geminiCalls, nvidiaCalls } = await call(payload(), {
    env,
    geminiReplies: [() => jsonResponse(429, {})],
    nvidiaReplies: [nvidia(RECAP)],
  });
  assert.equal(res.status, 200);
  assert.equal(body.recap, RECAP);
  assert.equal(body.provider, 'nvidia');
  assert.equal(body.model, api.DEFAULT_NVIDIA_MODELS[0]);
  assert.equal(geminiCalls().length, 1);
  const [n] = nvidiaCalls();
  assert.equal(n.init.headers.Authorization, 'Bearer nv-key');
  assert.equal(JSON.parse(n.init.body).messages[1].content, JSON.parse(geminiCalls()[0].init.body).contents[0].parts[0].text);
});

test('falls back to NVIDIA when Gemini is unconfigured or unreachable, trying its own models in order', async () => {
  const env = { ...ENV, GEMINI_API_KEY: undefined, NVIDIA_API_KEY: 'nv-key' };
  const { res, body, geminiCalls, nvidiaCalls } = await call(payload(), {
    env,
    nvidiaReplies: [() => jsonResponse(404, {}), nvidia(RECAP)],
  });
  assert.equal(res.status, 200);
  assert.equal(body.provider, 'nvidia');
  assert.equal(body.model, api.DEFAULT_NVIDIA_MODELS[1]);
  assert.equal(geminiCalls().length, 0);
  assert.equal(nvidiaCalls().length, 2);
});

test('NVIDIA quota exhaustion and a rejected NVIDIA key surface cleanly once Gemini has already failed', async () => {
  const env = { ...ENV, GEMINI_API_KEY: undefined, NVIDIA_API_KEY: 'nv-key' };
  const quota = await call(payload(), { env, nvidiaReplies: [() => jsonResponse(429, {})] });
  assert.equal(quota.res.status, 429);
  assert.equal(quota.body.code, 'quota');

  const denied = await call(payload(), { env, nvidiaReplies: [() => jsonResponse(401, {})] });
  assert.equal(denied.res.status, 503);
  assert.equal(denied.body.code, 'not_configured');
});

test('a content block from Gemini is not retried on NVIDIA', async () => {
  const env = { ...ENV, NVIDIA_API_KEY: 'nv-key' };
  const { res, body, nvidiaCalls } = await call(payload(), { env, geminiReplies: [gemini('', 'RECITATION')] });
  assert.equal(res.status, 422);
  assert.equal(body.code, 'blocked');
  assert.equal(nvidiaCalls().length, 0);
});

test('falls back to the next model when one is unavailable', async () => {
  const { res, body, geminiCalls } = await call(payload(), {
    geminiReplies: [() => jsonResponse(404, { error: { message: 'not found' } }), gemini(RECAP)],
  });
  assert.equal(res.status, 200);
  assert.equal(body.model, api.DEFAULT_GEMINI_MODELS[1]);
  assert.equal(geminiCalls().length, 2);
});

test('quota exhaustion, a rejected key, and malformed responses fail cleanly', async () => {
  const quota = await call(payload(), { geminiReplies: [() => jsonResponse(429, {})] });
  assert.equal(quota.res.status, 429);
  assert.equal(quota.body.code, 'quota');

  const denied = await call(payload(), { geminiReplies: [() => jsonResponse(403, { error: { message: 'denied' } })] });
  assert.equal(denied.res.status, 503);
  assert.equal(denied.body.code, 'not_configured');

  const malformed = await call(payload(), {
    geminiReplies: [() => new Response('<html>oops', { status: 200 }), () => jsonResponse(200, { candidates: [] })],
  });
  assert.equal(malformed.res.status, 502);
  assert.equal(malformed.body.code, 'unavailable');
  assert.equal(malformed.body.recap, undefined);
});

test('network failure and timeouts surface as unavailable', async () => {
  const offline = await call(payload(), {
    geminiReplies: [() => { throw new TypeError('fetch failed'); }],
  });
  assert.equal(offline.res.status, 504);
  assert.equal(offline.body.code, 'unavailable');
});

test('no fabricated recap when the model says the pages have no content, or blocks', async () => {
  const insufficient = await call(payload(), { geminiReplies: [gemini(api.INSUFFICIENT_CONTENT)] });
  assert.equal(insufficient.res.status, 422);
  assert.equal(insufficient.body.code, 'insufficient_content');

  const blocked = await call(payload(), { geminiReplies: [gemini('', 'RECITATION')] });
  assert.equal(blocked.res.status, 422);
  assert.equal(blocked.body.code, 'blocked');

  const empty = await call(payload({ pages: [{ pageNumber: 84, text: '   ' }] }));
  assert.equal(empty.res.status, 422);
  assert.equal(empty.geminiCalls().length, 0);
});

test('a recap cut off by the token limit ends on a complete sentence', async () => {
  const cut = 'Mira confronts Oren on the bridge. He admits nothing. The crew begins to take si';
  const { body } = await call(payload(), { geminiReplies: [gemini(cut, 'MAX_TOKENS')] });
  assert.equal(body.recap, 'Mira confronts Oren on the bridge. He admits nothing.');
});

test('cleanRecapText produces short plain prose', () => {
  assert.equal(api.cleanRecapText('## Previously\n- Mira finds the map hidden in the hold.\n- Oren lies about it.'), 'Mira finds the map hidden in the hold.\nOren lies about it.');
  assert.equal(api.cleanRecapText('Previously… Mira finds the map hidden in the hold.'), 'Mira finds the map hidden in the hold.');
  assert.equal(api.cleanRecapText('Previously, Mira found the map hidden in the hold.'), 'Previously, Mira found the map hidden in the hold.');
  assert.equal(api.cleanRecapText(api.INSUFFICIENT_CONTENT), null);
  const long = Array.from({ length: 60 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
  const cleaned = api.cleanRecapText(long);
  assert.ok(cleaned.split(/\s+/).length <= 160);
  assert.ok(cleaned.endsWith('.'));
});

test('buildExcerpt keeps page order, respects the budget, and favours the final pages', () => {
  const pages = range(1, 40).map((n) => ({ pageNumber: 41 - n, text: `p${41 - n} `.repeat(400) }));
  const excerpt = api.buildExcerpt(pages, 20_000);
  assert.ok(excerpt.length < 22_000);
  assert.ok(excerpt.indexOf('[p. 1]') < excerpt.indexOf('[p. 40]'));
  const block = (n) => excerpt.split(`[p. ${n}]\n`)[1].split('\n\n[p.')[0];
  assert.ok(block(40).length > block(10).length);
});
