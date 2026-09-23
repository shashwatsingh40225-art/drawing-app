import { useCallback, useEffect, useRef } from 'react';
import {
  SessionDraft,
  TrackerState,
  SESSION_RULES,
  changePage,
  checkIdleBreak,
  closeTracker,
  createTracker,
  isTrackerState,
  resumeAfterHidden,
  recordEpubScreen,
  tick,
} from '../services/readingSessionLogic';

export type SessionCloseReason = 'exit' | 'jump' | 'break' | 'recovered';

interface Options {
  bookId: string | undefined;
  currentPage: number;
  /** Track only while the document is actually on screen. */
  enabled: boolean;
  /** Furthest page covered by this book's earlier meaningful sessions. */
  getFrontier: (bookId: string, endPage?: number | null, endCfi?: string | null) => number;
  /** Must persist the draft synchronously (e.g. localStorage) before returning. */
  onSessionClosed: (draft: SessionDraft, reason: SessionCloseReason) => void;
  onHidden?: () => void;
}

const CHECKPOINT_KEY = 'kin_reading_checkpoint_v1';
const TICK_MS = 5_000;
const CHECKPOINT_EVERY_MS = 15_000;
const SCROLL_THROTTLE_MS = 1_000;

export function newSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function readCheckpoint(): TrackerState | null {
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return isTrackerState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCheckpoint(state: TrackerState): void {
  try {
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: tracking continues in memory.
  }
}

function clearCheckpoint(): void {
  try {
    localStorage.removeItem(CHECKPOINT_KEY);
  } catch {
    // ignore
  }
}

const isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible';

/**
 * Infers reading sessions from reader activity. All tracking state lives in a ref and a
 * localStorage checkpoint — nothing here causes React re-renders while the user reads.
 *
 * The checkpoint survives the app being killed or crashing: the next time the reader opens,
 * an unfinished session is either resumed (short gap, same book) or closed and recorded.
 */
export function useReadingSessionTracker({ bookId, currentPage, enabled, getFrontier, onSessionClosed, onHidden }: Options) {
  const stateRef = useRef<TrackerState | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const lastCheckpointRef = useRef(0);
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;
  const callbacksRef = useRef({ getFrontier, onSessionClosed, onHidden });
  callbacksRef.current = { getFrontier, onSessionClosed, onHidden };

  useEffect(() => {
    if (!enabled || !bookId) return;

    const finish = (state: TrackerState, reason: SessionCloseReason) => {
      const draft = closeTracker(state, callbacksRef.current.getFrontier(state.bookId, state.readEnd, state.epubEndCfi));
      if (draft) callbacksRef.current.onSessionClosed(draft, reason);
    };
    const checkpoint = (state: TrackerState, now: number) => {
      writeCheckpoint(state);
      lastCheckpointRef.current = now;
    };

    const start = Date.now();
    const recovered = readCheckpoint();
    if (recovered) {
      if (recovered.bookId === bookId && start - recovered.lastActiveAt < SESSION_RULES.SESSION_BREAK_MS) {
        // Reload or quick relaunch into the same book: carry on with the same session.
        stateRef.current = { ...recovered, lastTickAt: start, lastInteractionAt: start };
      } else {
        finish(recovered, 'recovered');
        clearCheckpoint();
      }
    }
    if (!stateRef.current) {
      stateRef.current = createTracker(newSessionId(), bookId, pageRef.current, start);
    }
    // Align with the page on screen (e.g. saved progress restored while the checkpoint was older).
    if (stateRef.current.currentPage !== pageRef.current) {
      const moved = changePage(stateRef.current, pageRef.current, start, newSessionId);
      if (moved.closed) finish(moved.closed, 'jump');
      stateRef.current = moved.state;
    }
    checkpoint(stateRef.current, start);

    const onTick = () => {
      const s = stateRef.current;
      if (!s || !isVisible()) return;
      const now = Date.now();
      const idle = checkIdleBreak(s, now, newSessionId);
      if (idle.closed) {
        finish(idle.closed, 'break');
        stateRef.current = idle.state;
        checkpoint(idle.state, now);
        return;
      }
      const next = tick(s, now, true);
      stateRef.current = next;
      if (now - lastCheckpointRef.current >= CHECKPOINT_EVERY_MS) checkpoint(next, now);
    };

    let lastScrollAt = 0;
    const onInteract = (event: Event) => {
      const s = stateRef.current;
      if (!s) return;
      const now = Date.now();
      if (event.type === 'scroll') {
        if (now - lastScrollAt < SCROLL_THROTTLE_MS) return;
        lastScrollAt = now;
      }
      stateRef.current = { ...s, lastInteractionAt: now };
    };

    const onHide = () => {
      const s = stateRef.current;
      const now = Date.now();
      if (s && hiddenAtRef.current === null) {
        const next = tick(s, now, true);
        stateRef.current = next;
        checkpoint(next, now);
      }
      if (hiddenAtRef.current === null) hiddenAtRef.current = now;
      callbacksRef.current.onHidden?.();
    };

    const onShow = () => {
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      const s = stateRef.current;
      if (!s || hiddenAt === null) return;
      const now = Date.now();
      const resumed = resumeAfterHidden(s, hiddenAt, now, newSessionId);
      if (resumed.closed) finish(resumed.closed, 'break');
      stateRef.current = resumed.state;
      checkpoint(resumed.state, now);
    };

    const onVisibilityChange = () => (document.visibilityState === 'hidden' ? onHide() : onShow());

    const interactionEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    interactionEvents.forEach((type) => window.addEventListener(type, onInteract, { passive: true }));
    // Scroll does not bubble; capture it so scrolling inside the page viewport counts.
    document.addEventListener('scroll', onInteract, { capture: true, passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', onShow);
    const interval = window.setInterval(onTick, TICK_MS);

    return () => {
      window.clearInterval(interval);
      interactionEvents.forEach((type) => window.removeEventListener(type, onInteract));
      document.removeEventListener('scroll', onInteract, { capture: true });
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('pageshow', onShow);

      const s = stateRef.current;
      stateRef.current = null;
      hiddenAtRef.current = null;
      if (s) {
        finish(tick(s, Date.now(), isVisible()), 'exit');
      }
      clearCheckpoint();
    };
  }, [bookId, enabled]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s || s.currentPage === currentPage) return;
    const now = Date.now();
    const moved = changePage(tick(s, now, isVisible()), currentPage, now, newSessionId);
    if (moved.closed) {
      const draft = closeTracker(moved.closed, callbacksRef.current.getFrontier(moved.closed.bookId, moved.closed.readEnd, moved.closed.epubEndCfi));
      if (draft) callbacksRef.current.onSessionClosed(draft, 'jump');
    }
    stateRef.current = moved.state;
    writeCheckpoint(moved.state);
    lastCheckpointRef.current = now;
  }, [currentPage]);

  const onEpubLocation = useCallback((section: number, startCfi: string, endCfi: string) => {
    const state = stateRef.current;
    if (!state) return;
    const now = Date.now();
    let next = state;
    if (section !== state.currentPage) {
      const moved = changePage(tick(state, now, isVisible()), section, now, newSessionId);
      if (moved.closed) {
        const draft = closeTracker(moved.closed, callbacksRef.current.getFrontier(moved.closed.bookId, moved.closed.readEnd, moved.closed.epubEndCfi));
        if (draft) callbacksRef.current.onSessionClosed(draft, 'jump');
      }
      next = moved.state;
    }
    stateRef.current = recordEpubScreen(next, section, startCfi, endCfi, now);
    writeCheckpoint(stateRef.current);
    lastCheckpointRef.current = now;
  }, []);

  return { onEpubLocation };
}
