import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { ReadingSession } from '../types/book';
import { extractPdfTextRange } from '../services/pdfTextExtractor';
import { generateSessionRecap } from '../services/geminiRecapService';

const LOCAL_STORAGE_KEY = 'kin_reading_sessions_cache';

interface ReadingSessionState {
  sessionsByBookId: Record<string, ReadingSession[]>;
  activeSession: ReadingSession | null;
  isGeneratingRecap: boolean;
  generatingSessionId: string | null;
  lastActiveTimestamp: number;
  activeDwellSeconds: number;
  visitedPagesInSession: Set<number>;

  // Actions
  fetchSessions: (bookId: string) => Promise<ReadingSession[]>;
  getLatestMeaningfulSession: (bookId: string) => ReadingSession | undefined;
  getLatestUnviewedMeaningfulSession: (bookId: string) => ReadingSession | undefined;
  
  startSession: (bookId: string, initialPage: number) => void;
  recordPageActivity: (pageNumber: number, bookFilePath?: string, bookTitle?: string, author?: string) => void;
  recordUserInteraction: () => void;
  incrementActiveDwellTime: (seconds?: number) => void;

  finalizeActiveSession: (
    bookFilePath?: string,
    bookTitle?: string,
    author?: string
  ) => Promise<ReadingSession | null>;

  updateSessionBoundaries: (
    sessionId: string,
    startPage: number,
    endPage: number,
    bookFilePath?: string,
    bookTitle?: string,
    author?: string
  ) => Promise<ReadingSession | null>;

  generateRecapForSession: (
    sessionId: string,
    bookFilePath: string,
    bookTitle: string,
    author?: string
  ) => Promise<boolean>;

  markRecapViewed: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

function loadLocalSessions(): Record<string, ReadingSession[]> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalSessions(data: Record<string, ReadingSession[]>) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not persist reading sessions to localStorage:', err);
  }
}

function isDemoUser(): boolean {
  if (isSupabaseDemoMode) return true;
  const user = useAuthStore.getState().user;
  return !user || user.id.startsWith('demo-');
}

/**
 * Deterministic Meaningful Session Evaluator (Req 6)
 * No ML classifier, no extra AI calls.
 * Evaluates movement, pages covered, active reading dwell time.
 */
export function evaluateSessionMeaningfulness(
  startPage: number,
  endPage: number,
  durationSeconds: number,
  pagesCount: number
): boolean {
  const span = Math.abs(endPage - startPage) + 1;

  // Case 1: Covered 3 or more pages with at least 35 seconds of reading activity
  if (span >= 3 && durationSeconds >= 35) {
    return true;
  }

  // Case 2: Covered 2 pages with at least 75 seconds of active reading
  if (span >= 2 && durationSeconds >= 75) {
    return true;
  }

  // Case 3: Deep study on 1-2 pages for at least 150 seconds (2.5 minutes)
  if (durationSeconds >= 150 && pagesCount >= 1) {
    return true;
  }

  // Case 4: Substantial reading progress (e.g. 4+ pages read even in fast reading mode)
  if (span >= 4 && durationSeconds >= 30) {
    return true;
  }

  return false;
}

export const useReadingSessionStore = create<ReadingSessionState>((set, get) => ({
  sessionsByBookId: loadLocalSessions(),
  activeSession: null,
  isGeneratingRecap: false,
  generatingSessionId: null,
  lastActiveTimestamp: Date.now(),
  activeDwellSeconds: 0,
  visitedPagesInSession: new Set<number>(),

  fetchSessions: async (bookId: string) => {
    if (isDemoUser()) {
      const local = get().sessionsByBookId[bookId] || [];
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('book_id', bookId)
        .order('ended_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch reading sessions from Supabase, using local:', error.message);
        return get().sessionsByBookId[bookId] || [];
      }

      if (data) {
        const nextMap = {
          ...get().sessionsByBookId,
          [bookId]: data,
        };
        set({ sessionsByBookId: nextMap });
        saveLocalSessions(nextMap);
        return data;
      }

      return get().sessionsByBookId[bookId] || [];
    } catch {
      return get().sessionsByBookId[bookId] || [];
    }
  },

  getLatestMeaningfulSession: (bookId: string) => {
    const list = (get().sessionsByBookId[bookId] || []).slice().sort(
      (a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime()
    );
    return list.find((s) => s.is_meaningful);
  },

  getLatestUnviewedMeaningfulSession: (bookId: string) => {
    const list = (get().sessionsByBookId[bookId] || []).slice().sort(
      (a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime()
    );
    return list.find((s) => s.is_meaningful && !s.recap_viewed_at);
  },

  startSession: (bookId: string, initialPage: number) => {
    const current = get().activeSession;
    if (current) {
      if (current.book_id === bookId) {
        // If the session was initiated on default page before saved progress loaded (0 dwell, <= 1 page),
        // re-anchor it to the true starting page!
        if (current.duration_seconds === 0 && current.pages_read <= 1 && current.start_page !== initialPage) {
          set({
            activeSession: {
              ...current,
              start_page: initialPage,
              end_page: initialPage,
            },
            visitedPagesInSession: new Set([initialPage]),
            lastActiveTimestamp: Date.now(),
          });
        }
        return;
      } else {
        // Switching to a different book: finalize previous book's session first!
        get().finalizeActiveSession();
      }
    }

    const now = new Date().toISOString();
    const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'session-' + Date.now();

    const user = useAuthStore.getState().user;
    const userId = user?.id || 'demo-artist-01';

    const newSession: ReadingSession = {
      id: sessionId,
      user_id: userId,
      book_id: bookId,
      started_at: now,
      ended_at: now,
      start_page: initialPage,
      end_page: initialPage,
      duration_seconds: 0,
      pages_read: 1,
      is_meaningful: false,
      recap: null,
      recap_error: null,
      recap_generated_at: null,
      recap_viewed_at: null,
      created_at: now,
      updated_at: now,
    };

    set({
      activeSession: newSession,
      activeDwellSeconds: 0,
      lastActiveTimestamp: Date.now(),
      visitedPagesInSession: new Set([initialPage]),
    });
  },

  recordPageActivity: (pageNumber: number, bookFilePath?: string, bookTitle?: string, author?: string) => {
    let active = get().activeSession;
    if (!active) return;

    // Detect non-contiguous navigation jump (> 3 pages away)
    const lastPage = active.end_page;
    const isJump = Math.abs(pageNumber - lastPage) > 3;

    if (isJump) {
      const visited = get().visitedPagesInSession;
      const duration = get().activeDwellSeconds;
      const wasMeaningful = evaluateSessionMeaningfulness(
        active.start_page,
        active.end_page,
        duration,
        visited.size
      );

      // If prior reading was meaningful or substantial, finalize it into its own session
      if (wasMeaningful || (duration >= 30 && visited.size >= 2)) {
        get().finalizeActiveSession(bookFilePath, bookTitle, author);
        get().startSession(active.book_id, pageNumber);
        return;
      } else {
        // Trivial glance before jumping: re-anchor to new page
        set({
          activeSession: {
            ...active,
            start_page: pageNumber,
            end_page: pageNumber,
            pages_read: 1,
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          visitedPagesInSession: new Set([pageNumber]),
          lastActiveTimestamp: Date.now(),
        });
        return;
      }
    }

    const visited = new Set(get().visitedPagesInSession);
    visited.add(pageNumber);

    // Keep contiguous bounds for sequential reading
    const newStart = Math.min(active.start_page, pageNumber);
    const newEnd = Math.max(active.end_page, pageNumber);
    const count = visited.size;

    const updated: ReadingSession = {
      ...active,
      start_page: newStart,
      end_page: newEnd,
      pages_read: count,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set({
      activeSession: updated,
      visitedPagesInSession: visited,
      lastActiveTimestamp: Date.now(),
    });
  },

  recordUserInteraction: () => {
    set({ lastActiveTimestamp: Date.now() });
  },

  incrementActiveDwellTime: (seconds = 1) => {
    const active = get().activeSession;
    if (!active) return;

    // Check inactivity: if reader has not interacted for > 3 minutes (180s), pause dwell increments
    const idleMs = Date.now() - get().lastActiveTimestamp;
    if (idleMs > 180000) {
      return;
    }

    const currentDwell = get().activeDwellSeconds + seconds;
    const updated: ReadingSession = {
      ...active,
      duration_seconds: currentDwell,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set({
      activeDwellSeconds: currentDwell,
      activeSession: updated,
    });
  },

  finalizeActiveSession: async (bookFilePath, bookTitle, author) => {
    const active = get().activeSession;
    if (!active) return null;

    const duration = get().activeDwellSeconds;
    const visited = get().visitedPagesInSession;
    const pagesCount = visited.size;

    // Discard completely trivial interactions (less than 10 seconds and 0 page turn)
    if (duration < 10 && pagesCount <= 1) {
      set({ activeSession: null, activeDwellSeconds: 0, visitedPagesInSession: new Set() });
      return null;
    }

    const isMeaningful = evaluateSessionMeaningfulness(
      active.start_page,
      active.end_page,
      duration,
      pagesCount
    );

    const now = new Date().toISOString();
    const finalSession: ReadingSession = {
      ...active,
      duration_seconds: duration,
      pages_read: pagesCount,
      is_meaningful: isMeaningful,
      ended_at: now,
      updated_at: now,
    };

    // Save into store immediately
    const bookId = finalSession.book_id;
    const currentList = get().sessionsByBookId[bookId] || [];
    const nextList = [finalSession, ...currentList.filter((s) => s.id !== finalSession.id)];

    const nextMap = {
      ...get().sessionsByBookId,
      [bookId]: nextList,
    };

    set({
      sessionsByBookId: nextMap,
      activeSession: null,
      activeDwellSeconds: 0,
      visitedPagesInSession: new Set(),
    });
    saveLocalSessions(nextMap);

    // Persist to Supabase if live
    if (!isDemoUser()) {
      try {
        await supabase.from('reading_sessions').upsert({
          id: finalSession.id,
          user_id: finalSession.user_id,
          book_id: finalSession.book_id,
          started_at: finalSession.started_at,
          ended_at: finalSession.ended_at,
          start_page: finalSession.start_page,
          end_page: finalSession.end_page,
          start_position: finalSession.start_position || 0,
          end_position: finalSession.end_position || 0,
          duration_seconds: finalSession.duration_seconds,
          pages_read: finalSession.pages_read,
          is_meaningful: finalSession.is_meaningful,
          recap: finalSession.recap,
          recap_generated_at: finalSession.recap_generated_at,
          recap_viewed_at: finalSession.recap_viewed_at,
        });
      } catch (err) {
        console.warn('Failed to upsert reading session in Supabase:', err);
      }
    }

    // If meaningful and book path provided, trigger background AI recap generation
    if (isMeaningful && bookFilePath && bookTitle && !finalSession.recap) {
      get().generateRecapForSession(finalSession.id, bookFilePath, bookTitle, author);
    }

    return finalSession;
  },

  updateSessionBoundaries: async (sessionId, startPage, endPage, bookFilePath, bookTitle, author) => {
    let targetBookId = '';
    let targetSession: ReadingSession | null = null;

    // Locate session in store
    for (const [bId, list] of Object.entries(get().sessionsByBookId)) {
      const found = list.find((s) => s.id === sessionId);
      if (found) {
        targetBookId = bId;
        targetSession = found;
        break;
      }
    }

    if (!targetSession || !targetBookId) return null;

    const normStart = Math.min(startPage, endPage);
    const normEnd = Math.max(startPage, endPage);
    const now = new Date().toISOString();

    const isMeaningful = evaluateSessionMeaningfulness(
      normStart,
      normEnd,
      targetSession.duration_seconds,
      normEnd - normStart + 1
    );

    // Invalidate recap since boundaries changed (Req 8, Req 17)
    const updated: ReadingSession = {
      ...targetSession,
      start_page: normStart,
      end_page: normEnd,
      pages_read: normEnd - normStart + 1,
      is_meaningful: isMeaningful,
      recap: null,
      recap_error: null,
      recap_generated_at: null,
      recap_viewed_at: null,
      updated_at: now,
    };

    const bookList = get().sessionsByBookId[targetBookId] || [];
    const nextList = bookList.map((s) => (s.id === sessionId ? updated : s));
    const nextMap = {
      ...get().sessionsByBookId,
      [targetBookId]: nextList,
    };

    set({ sessionsByBookId: nextMap });
    saveLocalSessions(nextMap);

    if (!isDemoUser()) {
      try {
        await supabase.from('reading_sessions').update({
          start_page: normStart,
          end_page: normEnd,
          pages_read: normEnd - normStart + 1,
          is_meaningful: isMeaningful,
          recap: null,
          recap_generated_at: null,
          recap_viewed_at: null,
          updated_at: now,
        }).eq('id', sessionId);
      } catch (err) {
        console.warn('Failed to update session boundaries in Supabase:', err);
      }
    }

    // Automatically regenerate recap for the corrected boundaries if file is available
    if (bookFilePath && bookTitle && isMeaningful) {
      get().generateRecapForSession(sessionId, bookFilePath, bookTitle, author);
    }

    return updated;
  },

  generateRecapForSession: async (sessionId, bookFilePath, bookTitle, author) => {
    let targetBookId = '';
    let targetSession: ReadingSession | null = null;

    for (const [bId, list] of Object.entries(get().sessionsByBookId)) {
      const found = list.find((s) => s.id === sessionId);
      if (found) {
        targetBookId = bId;
        targetSession = found;
        break;
      }
    }

    if (!targetSession || !targetBookId) return false;

    set({ isGeneratingRecap: true, generatingSessionId: sessionId });

    try {
      // 1. Extract exact text for this session's page range (Req 10)
      const extraction = await extractPdfTextRange(
        bookFilePath,
        targetSession.start_page,
        targetSession.end_page,
        { title: bookTitle, author }
      );

      if (!extraction.success || !extraction.combinedText) {
        const errorMsg = extraction.error || 'Text extraction failed for this page range.';
        console.warn('Text extraction did not yield text for recap:', errorMsg);
        
        const now = new Date().toISOString();
        const updatedSession: ReadingSession = {
          ...targetSession,
          recap_error: errorMsg,
          updated_at: now,
        };
        const bookList = get().sessionsByBookId[targetBookId] || [];
        const nextList = bookList.map((s) => (s.id === sessionId ? updatedSession : s));
        const nextMap = {
          ...get().sessionsByBookId,
          [targetBookId]: nextList,
        };

        set({
          sessionsByBookId: nextMap,
          isGeneratingRecap: false,
          generatingSessionId: null,
        });
        saveLocalSessions(nextMap);
        return false;
      }

      // 2. Call Gemini Flash API for memory bridge
      const aiResult = await generateSessionRecap({
        bookTitle,
        author,
        startPage: targetSession.start_page,
        endPage: targetSession.end_page,
        sessionText: extraction.combinedText,
      });

      if (!aiResult.success || !aiResult.recap) {
        const errorMsg = aiResult.error || 'Unable to generate AI reading recap.';
        console.warn('Gemini recap generation was unsuccessful:', errorMsg);

        const now = new Date().toISOString();
        const updatedSession: ReadingSession = {
          ...targetSession,
          recap_error: errorMsg,
          updated_at: now,
        };
        const bookList = get().sessionsByBookId[targetBookId] || [];
        const nextList = bookList.map((s) => (s.id === sessionId ? updatedSession : s));
        const nextMap = {
          ...get().sessionsByBookId,
          [targetBookId]: nextList,
        };

        set({
          sessionsByBookId: nextMap,
          isGeneratingRecap: false,
          generatingSessionId: null,
        });
        saveLocalSessions(nextMap);
        return false;
      }

      // 3. Save recap with generation timestamp (Req 17)
      const now = new Date().toISOString();
      const updatedSession: ReadingSession = {
        ...targetSession,
        recap: aiResult.recap,
        recap_error: null,
        recap_generated_at: now,
        updated_at: now,
      };

      const bookList = get().sessionsByBookId[targetBookId] || [];
      const nextList = bookList.map((s) => (s.id === sessionId ? updatedSession : s));
      const nextMap = {
        ...get().sessionsByBookId,
        [targetBookId]: nextList,
      };

      set({
        sessionsByBookId: nextMap,
        isGeneratingRecap: false,
        generatingSessionId: null,
      });
      saveLocalSessions(nextMap);

      if (!isDemoUser()) {
        try {
          await supabase.from('reading_sessions').update({
            recap: aiResult.recap,
            recap_generated_at: now,
            updated_at: now,
          }).eq('id', sessionId);
        } catch (err) {
          console.warn('Failed to persist generated recap to Supabase:', err);
        }
      }

      return true;
    } catch (err: any) {
      console.error('Unexpected error generating recap:', err);
      const errorMsg = err?.message || 'Unexpected error occurred during recap generation.';
      const now = new Date().toISOString();
      const updatedSession: ReadingSession = {
        ...targetSession,
        recap_error: errorMsg,
        updated_at: now,
      };
      const bookList = get().sessionsByBookId[targetBookId] || [];
      const nextMap = {
        ...get().sessionsByBookId,
        [targetBookId]: bookList.map((s) => (s.id === sessionId ? updatedSession : s)),
      };
      set({ sessionsByBookId: nextMap, isGeneratingRecap: false, generatingSessionId: null });
      saveLocalSessions(nextMap);
      return false;
    }
  },

  markRecapViewed: async (sessionId: string) => {
    let targetBookId = '';
    let targetSession: ReadingSession | null = null;

    for (const [bId, list] of Object.entries(get().sessionsByBookId)) {
      const found = list.find((s) => s.id === sessionId);
      if (found) {
        targetBookId = bId;
        targetSession = found;
        break;
      }
    }

    if (!targetSession || !targetBookId) return;

    const now = new Date().toISOString();
    const updated: ReadingSession = {
      ...targetSession,
      recap_viewed_at: now,
      updated_at: now,
    };

    const bookList = get().sessionsByBookId[targetBookId] || [];
    const nextList = bookList.map((s) => (s.id === sessionId ? updated : s));
    const nextMap = {
      ...get().sessionsByBookId,
      [targetBookId]: nextList,
    };

    set({ sessionsByBookId: nextMap });
    saveLocalSessions(nextMap);

    if (!isDemoUser()) {
      try {
        await supabase
          .from('reading_sessions')
          .update({ recap_viewed_at: now, updated_at: now })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('Failed to mark recap viewed in Supabase:', err);
      }
    }
  },

  deleteSession: async (sessionId: string) => {
    let targetBookId = '';

    for (const [bId, list] of Object.entries(get().sessionsByBookId)) {
      if (list.some((s) => s.id === sessionId)) {
        targetBookId = bId;
        break;
      }
    }

    if (!targetBookId) return;

    const bookList = get().sessionsByBookId[targetBookId] || [];
    const nextList = bookList.filter((s) => s.id !== sessionId);
    const nextMap = {
      ...get().sessionsByBookId,
      [targetBookId]: nextList,
    };

    set({ sessionsByBookId: nextMap });
    saveLocalSessions(nextMap);

    if (!isDemoUser()) {
      try {
        await supabase.from('reading_sessions').delete().eq('id', sessionId);
      } catch (err) {
        console.warn('Failed to delete session in Supabase:', err);
      }
    }
  },
}));
