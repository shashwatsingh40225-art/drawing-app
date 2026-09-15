/**
 * Client for the memory-bridge recap endpoint (api/recap.ts).
 * The Gemini key lives only on the server; the browser sends the extracted session text
 * together with the reader's Supabase access token.
 */

export interface RecapRequest {
  sessionId: string;
  bookTitle: string;
  author?: string;
  startPage: number;
  endPage: number;
  pages: { pageNumber: number; text: string }[];
}

export type RecapErrorCode =
  | 'invalid_request'
  | 'unauthenticated'
  | 'not_found'
  | 'not_configured'
  | 'quota'
  | 'blocked'
  | 'insufficient_content'
  | 'unavailable'
  | 'network';

export interface RecapResult {
  success: boolean;
  recap?: string;
  generatedAt?: string;
  /** True when the server already saved the recap on the session row. */
  stored?: boolean;
  code?: RecapErrorCode;
  error?: string;
}

const REQUEST_TIMEOUT_MS = 35_000;

export async function requestSessionRecap(request: RecapRequest, accessToken?: string): Promise<RecapResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch('/api/recap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    const body = (await res.json().catch(() => null)) as
      | { recap?: string; generatedAt?: string; stored?: boolean; code?: RecapErrorCode; error?: string }
      | null;

    if (res.ok && body?.recap) {
      return { success: true, recap: body.recap, generatedAt: body.generatedAt, stored: Boolean(body.stored) };
    }
    return {
      success: false,
      code: body?.code ?? 'unavailable',
      error: body?.error ?? 'The recap service is unavailable right now.',
    };
  } catch {
    return { success: false, code: 'network', error: 'You appear to be offline. The recap will be ready another time.' };
  } finally {
    clearTimeout(timer);
  }
}

/** Errors worth retrying on a later open; the rest will not change by trying again. */
export function isTransientRecapError(code: RecapErrorCode | undefined): boolean {
  return code === 'network' || code === 'quota' || code === 'unavailable' || code === 'not_configured' || code === 'unauthenticated';
}
