import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { ReadingSession } from '../types/book';
import { SessionDraft, computeFrontier, recapRangeFor } from '../services/readingSessionLogic';
import { extractPdfTextRange } from '../services/pdfTextExtractor';
import { extractEpubTextRange } from '../services/epubTextExtractor';
import { isTransientRecapError, requestSessionRecap, RecapErrorCode } from '../services/geminiRecapService';
import { getBookSignedUrl } from '../services/bookService';
import { BookFormat } from '../types/book';

const LOCAL_STORAGE_KEY = 'kin_reading_sessions_cache';

const REMOTE_COLUMNS =
  'id,user_id,book_id,started_at,ended_at,start_page,end_page,duration_seconds,pages_read,is_meaningful,recap,recap_generated_at,recap_viewed_at,created_at,updated_at';

export interface RecapBookSource {
  filePath: string;
  title: string;
  author?: string;
  format: BookFormat;
}

export type RecapOutcome = 'ready' | 'skipped' | 'failed';

interface ReadingSessionState {
  sessionsByBookId: Record<string, ReadingSession[]>;
  generatingIds: Record<string, boolean>;

  fetchSessions: (bookId: string) => Promise<ReadingSession[]>;
  getFrontier: (bookId: string) => number;
  /** Records a finished session. Local persistence is synchronous; the remote write follows. */
  saveFinishedSession: (draft: SessionDraft) => ReadingSession;
  /** Manual correction. Clamped to [1, maxPage]; a changed range invalidates the recap. */
  updateSessionBoundaries: (sessionId: string, startPage: number, endPage: number, maxPage: number) => Promise<ReadingSession | null>;
  generateRecap: (sessionId: string, book: RecapBookSource, options?: { force?: boolean }) => Promise<RecapOutcome>;
  markRecapViewed: (sessionId: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
}

function loadLocalSessions(): Record<string, ReadingSession[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalSessions(data: Record<string, ReadingSession[]>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not persist reading sessions to localStorage:', err);
  }
}

function isLiveUser(): boolean {
  if (isSupabaseDemoMode) return false;
  const user = useAuthStore.getState().user;
  return Boolean(user && !user.id.startsWith('demo-'));
}

const byEndedDesc = (a: ReadingSession, b: ReadingSession) => Date.parse(b.ended_at) - Date.parse(a.ended_at);

function toRemoteRow(s: ReadingSession, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    book_id: s.book_id,
    started_at: s.started_at,
    ended_at: s.ended_at,
    start_page: s.start_page,
    end_page: s.end_page,
    duration_seconds: s.duration_seconds,
    pages_read: s.pages_read,
    is_meaningful: s.is_meaningful,
    recap: s.recap,
    recap_generated_at: s.recap_generated_at,
    recap_viewed_at: s.recap_viewed_at,
    updated_at: s.updated_at,
  };
}

export const useReadingSessionStore = create<ReadingSessionState>((set, get) => {
  const find = (sessionId: string): ReadingSession | undefined => {
    for (const list of Object.values(get().sessionsByBookId)) {
      const found = list.find((s) => s.id === sessionId);
      if (found) return found;
    }
    return undefined;
  };

  const writeList = (bookId: string, list: ReadingSession[]) => {
    const next = { ...get().sessionsByBookId, [bookId]: list.slice().sort(byEndedDesc) };
    set({ sessionsByBookId: next });
    saveLocalSessions(next);
  };

  const patch = (sessionId: string, changes: Partial<ReadingSession>): ReadingSession | null => {
    const current = find(sessionId);
    if (!current) return null;
    const updated = { ...current, ...changes };
    writeList(
      current.book_id,
      (get().sessionsByBookId[current.book_id] ?? []).map((s) => (s.id === sessionId ? updated : s))
    );
    return updated;
  };

  const setGenerating = (sessionId: string, on: boolean) => {
    const next = { ...get().generatingIds };
    if (on) next[sessionId] = true;
    else delete next[sessionId];
    set({ generatingIds: next });
  };

  const syncSession = async (sessionId: string): Promise<boolean> => {
    const session = find(sessionId);
    if (!session || !isLiveUser()) return false;
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) return false;
      const { error } = await supabase.from('reading_sessions').upsert(toRemoteRow(session, userId));
      if (error) {
        console.warn('Reading session not synced yet (will retry):', error.message);
        return false;
      }
      patch(sessionId, { sync_pending: false });
      return true;
    } catch {
      return false;
    }
  };

  return {
    sessionsByBookId: loadLocalSessions(),
    generatingIds: {},

    fetchSessions: async (bookId) => {
      const local = get().sessionsByBookId[bookId] ?? [];
      if (!isLiveUser()) return local;

      try {
        const { data, error } = await supabase
          .from('reading_sessions')
          .select(REMOTE_COLUMNS)
          .eq('book_id', bookId)
          .order('ended_at', { ascending: false });
        if (error || !data) {
          if (error) console.warn('Could not fetch reading sessions, using local copy:', error.message);
          return local;
        }

        const localById = new Map(local.map((s) => [s.id, s]));
        const serverIds = new Set<string>();
        const merged: ReadingSession[] = (data as ReadingSession[]).map((row) => {
          serverIds.add(row.id);
          const mine = localById.get(row.id);
          const sameRange = mine && mine.start_page === row.start_page && mine.end_page === row.end_page;
          return {
            ...row,
            // Keep local knowledge the server may not have received yet.
            recap: row.recap ?? (sameRange ? mine.recap : null),
            recap_generated_at: row.recap_generated_at ?? (sameRange ? mine.recap_generated_at : null),
            recap_viewed_at: row.recap_viewed_at ?? mine?.recap_viewed_at ?? null,
            recap_error: sameRange ? mine.recap_error ?? null : null,
            recap_error_code: sameRange ? mine.recap_error_code ?? null : null,
            sync_pending: false,
          };
        });
        const unsynced = local.filter((s) => s.sync_pending && !serverIds.has(s.id));
        writeList(bookId, [...merged, ...unsynced]);
        unsynced.forEach((s) => void syncSession(s.id));
        return get().sessionsByBookId[bookId] ?? [];
      } catch {
        return local;
      }
    },

    getFrontier: (bookId) => computeFrontier(get().sessionsByBookId[bookId] ?? []),

    saveFinishedSession: (draft) => {
      const now = new Date().toISOString();
      const live = isLiveUser();
      const existing = find(draft.id);
      const rangeUnchanged = existing && existing.start_page === draft.startPage && existing.end_page === draft.endPage;

      const session: ReadingSession = {
        id: draft.id,
        user_id: useAuthStore.getState().user?.id ?? 'demo-artist-01',
        book_id: draft.bookId,
        started_at: draft.startedAt,
        ended_at: draft.endedAt,
        start_page: draft.startPage,
        end_page: draft.endPage,
        duration_seconds: draft.activeSeconds,
        pages_read: draft.pagesCovered,
        is_meaningful: draft.isMeaningful,
        recap: rangeUnchanged ? existing.recap : null,
        recap_generated_at: rangeUnchanged ? existing.recap_generated_at : null,
        recap_viewed_at: rangeUnchanged ? existing.recap_viewed_at : null,
        recap_error: null,
        recap_error_code: null,
        created_at: existing?.created_at ?? now,
        updated_at: now,
        sync_pending: live,
      };

      const others = (get().sessionsByBookId[draft.bookId] ?? []).filter((s) => s.id !== draft.id);
      writeList(draft.bookId, [session, ...others]);
      if (live) void syncSession(session.id);
      return session;
    },

    updateSessionBoundaries: async (sessionId, startPage, endPage, maxPage) => {
      const current = find(sessionId);
      if (!current) return null;
      const start = Math.max(1, Math.floor(startPage));
      const end = Math.min(Math.floor(maxPage), Math.floor(endPage));
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return null;
      if (start === current.start_page && end === current.end_page) return current;

      const now = new Date().toISOString();
      const updated = patch(sessionId, {
        start_page: start,
        end_page: end,
        pages_read: end - start + 1,
        // An explicit correction means the reader wants a recap for these pages.
        is_meaningful: true,
        recap: null,
        recap_generated_at: null,
        recap_viewed_at: null,
        recap_error: null,
        recap_error_code: null,
        updated_at: now,
      });
      if (!updated || !isLiveUser()) return updated;

      if (updated.sync_pending) {
        await syncSession(sessionId);
      } else {
        const { error } = await supabase
          .from('reading_sessions')
          .update({
            start_page: start,
            end_page: end,
            pages_read: end - start + 1,
            is_meaningful: true,
            recap: null,
            recap_generated_at: null,
            recap_viewed_at: null,
            updated_at: now,
          })
          .eq('id', sessionId);
        if (error) patch(sessionId, { sync_pending: true });
      }
      return find(sessionId) ?? updated;
    },

    generateRecap: async (sessionId, book, options = {}) => {
      const session = find(sessionId);
      if (!session || !session.is_meaningful) return 'skipped';
      if (session.recap) return 'ready';
      if (get().generatingIds[sessionId]) return 'skipped';
      const priorCode = session.recap_error_code as RecapErrorCode | 'extraction_failed' | 'unsupported' | null | undefined;
      if (!options.force && priorCode && !isTransientRecapError(priorCode as RecapErrorCode)) return 'failed';

      const live = isLiveUser();
      const { start_page, end_page } = session;
      const stillSameRange = () => {
        const current = find(sessionId);
        return Boolean(current && current.start_page === start_page && current.end_page === end_page);
      };
      const fail = (code: string, message: string): RecapOutcome => {
        // Without an account the endpoint can never authorise; don't retry on every open.
        const effectiveCode = !live && code === 'unauthenticated' ? 'unsupported' : code;
        if (stillSameRange()) patch(sessionId, { recap_error: message, recap_error_code: effectiveCode });
        return 'failed';
      };

      setGenerating(sessionId, true);
      try {
        let accessToken: string | undefined;
        if (live) {
          if (session.sync_pending && !(await syncSession(sessionId))) {
            return fail('network', 'This session has not reached the server yet.');
          }
          accessToken = (await supabase.auth.getSession()).data.session?.access_token;
          if (!accessToken) return fail('unauthenticated', 'Sign in again to see recaps.');
        }

        const range = recapRangeFor(start_page, end_page);
        const fileUrl = await getBookSignedUrl(book.filePath);
        if (!fileUrl) return fail('network', "Couldn't reach this book's file.");
        let extraction;
        try {
          extraction = book.format === 'epub'
            ? await extractEpubTextRange(fileUrl, range.startPage, range.endPage)
            : await extractPdfTextRange(fileUrl, range.startPage, range.endPage);
        } finally {
          if (fileUrl.startsWith('blob:') && fileUrl !== book.filePath) URL.revokeObjectURL(fileUrl);
        }
        // No text means no recap — never a guess.
        if (!extraction.success) return fail('extraction_failed', extraction.error ?? 'No readable text on these pages.');
        if (!stillSameRange()) return 'skipped';

        const result = await requestSessionRecap(
          {
            sessionId,
            bookTitle: book.title,
            author: book.author,
            startPage: range.startPage,
            endPage: range.endPage,
            pages: extraction.pages,
          },
          accessToken
        );
        if (!result.success || !result.recap) {
          return fail(result.code ?? 'unavailable', result.error ?? 'The recap is unavailable right now.');
        }
        // The reader may have corrected the pages while this was running.
        if (!stillSameRange()) return 'skipped';

        const generatedAt = result.generatedAt ?? new Date().toISOString();
        patch(sessionId, {
          recap: result.recap,
          recap_generated_at: generatedAt,
          recap_error: null,
          recap_error_code: null,
          updated_at: generatedAt,
        });
        if (live && !result.stored) {
          await supabase
            .from('reading_sessions')
            .update({ recap: result.recap, recap_generated_at: generatedAt, updated_at: generatedAt })
            .eq('id', sessionId)
            .eq('start_page', start_page)
            .eq('end_page', end_page);
        }
        return 'ready';
      } catch (err) {
        console.warn('Recap generation failed:', err);
        return fail('unavailable', 'The recap is unavailable right now.');
      } finally {
        setGenerating(sessionId, false);
      }
    },

    markRecapViewed: (sessionId) => {
      const now = new Date().toISOString();
      const updated = patch(sessionId, { recap_viewed_at: now });
      if (!updated || !isLiveUser() || updated.sync_pending) return;
      void supabase
        .from('reading_sessions')
        .update({ recap_viewed_at: now })
        .eq('id', sessionId)
        .then(({ error }) => {
          if (error) patch(sessionId, { sync_pending: true });
        });
    },

    deleteSession: async (sessionId) => {
      const current = find(sessionId);
      if (!current) return;
      writeList(
        current.book_id,
        (get().sessionsByBookId[current.book_id] ?? []).filter((s) => s.id !== sessionId)
      );
      if (!isLiveUser()) return;
      const { error } = await supabase.from('reading_sessions').delete().eq('id', sessionId);
      if (error) console.warn('Failed to delete reading session remotely:', error.message);
    },
  };
});
