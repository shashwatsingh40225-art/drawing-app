/**
 * Reading-session detection — pure, deterministic, framework-free (unit-tested in scripts/).
 *
 * A session is the stretch of the book the reader actually read, described by a page range.
 * Signals: active time (visible + recent touch/scroll/key input), dwell per page, page moves,
 * backgrounding. No AI and no heuristics beyond the constants below.
 *
 * - A page counts as read only after PAGE_READ_DWELL_MS of active time on it, so flipping or
 *   jumping past pages does not mark them read. Staying on one page for a long time still counts.
 * - Moving more than JUMP_PAGES beyond the pages read so far ends the session and starts another.
 * - A break of SESSION_BREAK_MS (backgrounded, or idle in the foreground) ends the session.
 * - Ranges are incremental: pages at or before the furthest page covered by earlier meaningful
 *   sessions (the "frontier") are rereads and never count as new content.
 */

export const SESSION_RULES = {
  /** Active time on a page before it counts as read. */
  PAGE_READ_DWELL_MS: 4_000,
  /** Without any input, active time stops accruing after this (generous: dense pages take a while). */
  IDLE_CAP_MS: 5 * 60_000,
  /** Largest slice of time a single tick may credit (guards against timers frozen by the OS). */
  MAX_TICK_MS: 15_000,
  /** A break this long ends the session. */
  SESSION_BREAK_MS: 30 * 60_000,
  /** Navigating further than this outside the pages read in this session is a jump. */
  JUMP_PAGES: 4,
  /** Sessions with less active time than this are not kept at all. */
  MIN_RECORDED_ACTIVE_MS: 15_000,
  /** Meaningful: at least this many new pages with at least MEANINGFUL_MIN_ACTIVE_MS of reading… */
  MEANINGFUL_MIN_PAGES: 3,
  MEANINGFUL_MIN_ACTIVE_MS: 2 * 60_000,
  /** …or this much reading regardless of page count (a dense page or two). */
  DEEP_READ_MIN_ACTIVE_MS: 6 * 60_000,
  /** A recap covers at most this many trailing pages of a very long session. */
  MAX_RECAP_PAGES: 150,
} as const;

/**
 * Minimum gap since the last activity on a book before "Previously…" proactively surfaces.
 * Deliberately decoupled from SESSION_BREAK_MS (ADR 0002): ending a session is a technical
 * signal ("did activity stop"), while surfacing a recap is a product judgment ("has enough time
 * passed that a reminder is actually useful"). A short reading break should never trigger it.
 */
export const MEMORY_BRIDGE_MIN_GAP_MS = 60 * 60_000;

export interface TrackerState {
  v: 1;
  sessionId: string;
  bookId: string;
  startedAt: number;
  lastTickAt: number;
  lastInteractionAt: number;
  /** Last moment active reading time was credited — the honest session end. */
  lastActiveAt: number;
  activeMs: number;
  currentPage: number;
  pageDwellMs: number;
  /** Lowest / highest page confirmed read in this session (null until the first confirmation). */
  readStart: number | null;
  readEnd: number | null;
}

export interface SessionDraft {
  id: string;
  bookId: string;
  startedAt: string;
  endedAt: string;
  startPage: number;
  endPage: number;
  activeSeconds: number;
  pagesCovered: number;
  isMeaningful: boolean;
  isReread: boolean;
}

export type IdFactory = () => string;

export function createTracker(sessionId: string, bookId: string, page: number, now: number): TrackerState {
  return {
    v: 1,
    sessionId,
    bookId,
    startedAt: now,
    lastTickAt: now,
    lastInteractionAt: now,
    lastActiveAt: now,
    activeMs: 0,
    currentPage: page,
    pageDwellMs: 0,
    readStart: null,
    readEnd: null,
  };
}

export function recordInteraction(s: TrackerState, now: number): TrackerState {
  return { ...s, lastInteractionAt: now };
}

/** Credit the time since the last tick if the reader is plausibly reading. */
export function tick(s: TrackerState, now: number, visible: boolean): TrackerState {
  const elapsed = Math.max(0, Math.min(now - s.lastTickAt, SESSION_RULES.MAX_TICK_MS));
  const idleFor = now - s.lastInteractionAt;
  if (!visible || elapsed === 0 || idleFor > SESSION_RULES.IDLE_CAP_MS) {
    return { ...s, lastTickAt: now };
  }

  const pageDwellMs = s.pageDwellMs + elapsed;
  let { readStart, readEnd } = s;
  if (pageDwellMs >= SESSION_RULES.PAGE_READ_DWELL_MS) {
    readStart = readStart === null ? s.currentPage : Math.min(readStart, s.currentPage);
    readEnd = readEnd === null ? s.currentPage : Math.max(readEnd, s.currentPage);
  }

  return {
    ...s,
    lastTickAt: now,
    lastActiveAt: now,
    activeMs: s.activeMs + elapsed,
    pageDwellMs,
    readStart,
    readEnd,
  };
}

/**
 * Move to another page. A jump away from the pages read so far closes the current session
 * (returned as `closed`) and starts a new one at the destination.
 */
export function changePage(
  s: TrackerState,
  page: number,
  now: number,
  newId: IdFactory
): { state: TrackerState; closed: TrackerState | null } {
  if (page === s.currentPage) return { state: s, closed: null };

  if (s.readStart === null || s.readEnd === null) {
    // Nothing read yet: a long move discards the glancing time rather than attributing it.
    if (Math.abs(page - s.currentPage) > SESSION_RULES.JUMP_PAGES) {
      return { state: createTracker(s.sessionId, s.bookId, page, now), closed: null };
    }
    return { state: { ...s, currentPage: page, pageDwellMs: 0, lastInteractionAt: now }, closed: null };
  }

  const isJump = page > s.readEnd + SESSION_RULES.JUMP_PAGES || page < s.readStart - SESSION_RULES.JUMP_PAGES;
  if (isJump) {
    return { state: createTracker(newId(), s.bookId, page, now), closed: s };
  }
  return { state: { ...s, currentPage: page, pageDwellMs: 0, lastInteractionAt: now }, closed: null };
}

/** End the session if the reader has been idle in the foreground for a full break. */
export function checkIdleBreak(
  s: TrackerState,
  now: number,
  newId: IdFactory
): { state: TrackerState; closed: TrackerState | null } {
  if (now - s.lastInteractionAt < SESSION_RULES.SESSION_BREAK_MS || s.readStart === null) {
    return { state: s, closed: null };
  }
  // The fresh session keeps the stale interaction time so it does not accrue until input resumes.
  const fresh = { ...createTracker(newId(), s.bookId, s.currentPage, now), lastInteractionAt: s.lastInteractionAt };
  return { state: fresh, closed: s };
}

/** Coming back to the foreground: a long absence ends the session, a short one continues it. */
export function resumeAfterHidden(
  s: TrackerState,
  hiddenAt: number,
  now: number,
  newId: IdFactory
): { state: TrackerState; closed: TrackerState | null } {
  if (now - hiddenAt >= SESSION_RULES.SESSION_BREAK_MS) {
    return { state: createTracker(newId(), s.bookId, s.currentPage, now), closed: s.readStart === null ? null : s };
  }
  return { state: { ...s, lastTickAt: now, lastInteractionAt: now }, closed: null };
}

/** Turn a finished tracker into a session record, or null if nothing worth keeping happened. */
export function closeTracker(s: TrackerState, frontier: number): SessionDraft | null {
  if (s.readStart === null || s.readEnd === null) return null;
  if (s.activeMs < SESSION_RULES.MIN_RECORDED_ACTIVE_MS) return null;

  const isReread = frontier > 0 && s.readEnd <= frontier;
  // Incremental: a session that continues past the frontier starts at the frontier page
  // (the page the previous session stopped on), never earlier.
  const startPage = isReread ? s.readStart : Math.max(s.readStart, frontier);
  const endPage = s.readEnd;
  const pagesCovered = endPage - startPage + 1;

  const isMeaningful =
    !isReread &&
    ((pagesCovered >= SESSION_RULES.MEANINGFUL_MIN_PAGES && s.activeMs >= SESSION_RULES.MEANINGFUL_MIN_ACTIVE_MS) ||
      s.activeMs >= SESSION_RULES.DEEP_READ_MIN_ACTIVE_MS);

  return {
    id: s.sessionId,
    bookId: s.bookId,
    startedAt: new Date(s.startedAt).toISOString(),
    endedAt: new Date(s.lastActiveAt).toISOString(),
    startPage,
    endPage,
    activeSeconds: Math.round(s.activeMs / 1000),
    pagesCovered,
    isMeaningful,
    isReread,
  };
}

export function isTrackerState(value: unknown): value is TrackerState {
  const s = value as TrackerState;
  return (
    !!s &&
    s.v === 1 &&
    typeof s.sessionId === 'string' &&
    typeof s.bookId === 'string' &&
    typeof s.activeMs === 'number' &&
    typeof s.currentPage === 'number' &&
    typeof s.lastActiveAt === 'number'
  );
}

// ---------------------------------------------------------------------------
// Decisions over stored sessions
// ---------------------------------------------------------------------------

export interface SessionSummary {
  id: string;
  start_page: number;
  end_page: number;
  ended_at: string;
  is_meaningful: boolean;
  recap_viewed_at: string | null;
}

/** Furthest page covered by meaningful sessions — the start of the next incremental range. */
export function computeFrontier(sessions: SessionSummary[]): number {
  return sessions.reduce((max, s) => (s.is_meaningful ? Math.max(max, s.end_page) : max), 0);
}

/** Highest page a manual boundary edit may reach: nothing the reader has not already reached. */
export function maxEditablePage(sessions: SessionSummary[], progressPage: number): number {
  return sessions.reduce((max, s) => Math.max(max, s.end_page), Math.max(1, progressPage));
}

/**
 * The session to bridge from when a book is opened (or resumed), or null.
 * Only after a real break, only the latest meaningful session, and only until it has been seen.
 */
export function pickBridgeSession<T extends SessionSummary>(sessions: T[], now: number): T | null {
  if (sessions.length === 0) return null;
  const lastEnded = Math.max(...sessions.map((s) => Date.parse(s.ended_at) || 0));
  if (now - lastEnded < MEMORY_BRIDGE_MIN_GAP_MS) return null;

  let latest: T | null = null;
  for (const s of sessions) {
    if (s.is_meaningful && (!latest || Date.parse(s.ended_at) > Date.parse(latest.ended_at))) latest = s;
  }
  return latest && !latest.recap_viewed_at ? latest : null;
}

/** Pages a recap is built from: the session range, trimmed to its trailing pages if huge. */
export function recapRangeFor(startPage: number, endPage: number): { startPage: number; endPage: number } {
  return { startPage: Math.max(startPage, endPage - SESSION_RULES.MAX_RECAP_PAGES + 1), endPage };
}
