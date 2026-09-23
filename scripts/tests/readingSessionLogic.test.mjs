import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const L = await import(pathToFileURL(join(process.env.KIN_TEST_BUILD, 'readingSessionLogic.mjs')).href);
const R = L.SESSION_RULES;
const T0 = Date.parse('2026-09-10T18:00:00Z');
const MIN = 60_000;

let ids = 0;
const newId = () => `session-${++ids}`;

/** A simulated reader with a clock. Each helper advances time in 5 s ticks, like the hook. */
function reader(bookId, page, now = T0) {
  const r = { now, state: L.createTracker(newId(), bookId, page, now), closed: [] };

  r.goTo = (p) => {
    const moved = L.changePage(L.tick(r.state, r.now, true), p, r.now, newId);
    if (moved.closed) r.closed.push(moved.closed);
    r.state = moved.state;
    return moved.closed;
  };
  r.stay = (seconds, { touchEverySeconds = 60 } = {}) => {
    for (let elapsed = 0; elapsed < seconds; ) {
      if (touchEverySeconds && elapsed % touchEverySeconds === 0) r.state = L.recordInteraction(r.state, r.now);
      const step = Math.min(5, seconds - elapsed);
      r.now += step * 1000;
      elapsed += step;
      r.state = L.tick(r.state, r.now, true);
    }
  };
  r.read = (from, to, secondsPerPage) => {
    for (let p = from; p <= to; p++) {
      if (p !== r.state.currentPage) {
        const closed = r.goTo(p);
        assert.equal(closed, null, `unexpected session break when turning to page ${p}`);
      }
      r.stay(secondsPerPage);
    }
  };
  r.close = (frontier = 0) => L.closeTracker(r.state, frontier);
  return r;
}

const session = (overrides) => ({
  id: newId(),
  start_page: 1,
  end_page: 10,
  ended_at: new Date(T0).toISOString(),
  is_meaningful: true,
  recap_viewed_at: null,
  ...overrides,
});

test('opening a book and leaving without reading records nothing', () => {
  const r = reader('b', 10);
  r.stay(10);
  assert.equal(r.close(), null);
});

test('Scenario A: a few pages then leaving is history, not a recap', () => {
  const r = reader('b', 10);
  r.read(10, 11, 25);
  const draft = r.close();
  assert.ok(draft, 'short reading is still recorded');
  assert.equal(draft.startPage, 10);
  assert.equal(draft.endPage, 11);
  assert.equal(draft.isMeaningful, false);
});

test('EPUB screens within one section qualify and preserve exact recap bounds', () => {
  const r = reader('epub', 4);
  for (let page = 1; page <= 3; page++) {
    r.state = L.recordEpubScreen(r.state, 4, `start-${page}`, `end-${page}`, r.now);
    r.stay(45);
  }
  const draft = r.close();
  assert.equal(draft.startPage, 4);
  assert.equal(draft.endPage, 4);
  assert.equal(draft.isMeaningful, true);
  assert.equal(draft.startCfi, 'start-1');
  assert.equal(draft.endCfi, 'end-3');
});

test('EPUB glances do not widen the recap to unread text', () => {
  const r = reader('epub', 4);
  r.state = L.recordEpubScreen(r.state, 4, 'glance-start', 'glance-end', r.now);
  r.stay(2);
  for (let page = 1; page <= 3; page++) {
    r.state = L.recordEpubScreen(r.state, 4, `read-start-${page}`, `read-end-${page}`, r.now);
    r.stay(45);
  }
  r.state = L.recordEpubScreen(r.state, 4, 'unread-start', 'unread-end', r.now);
  r.stay(2);
  const draft = r.close();
  assert.equal(draft.isMeaningful, true);
  assert.equal(draft.startCfi, 'read-start-1');
  assert.equal(draft.endCfi, 'read-end-3');
});

test('EPUB quick page flips do not count as three read screens', () => {
  const r = reader('epub', 4);
  for (let page = 1; page <= 4; page++) {
    r.state = L.recordEpubScreen(r.state, 4, `start-${page}`, `end-${page}`, r.now);
    r.stay(2);
  }
  r.stay(118);
  assert.equal(r.close().isMeaningful, false);
});

test('Scenario B: pages 1–40 is a meaningful session covering exactly 1–40', () => {
  const r = reader('b', 1);
  r.read(1, 40, 45);
  const draft = r.close();
  assert.equal(draft.startPage, 1);
  assert.equal(draft.endPage, 40);
  assert.equal(draft.isMeaningful, true);
  assert.equal(draft.activeSeconds, 40 * 45);
  assert.equal(draft.endedAt, new Date(r.now).toISOString());
});

test('Scenario C: consecutive sessions produce incremental ranges 1–40, 40–80, 80–120', () => {
  const s1 = reader('b', 1);
  s1.read(1, 40, 30);
  const d1 = s1.close(0);

  const s2 = reader('b', 40, s1.now + 24 * 60 * MIN);
  s2.read(40, 80, 30);
  const d2 = s2.close(L.computeFrontier([session({ end_page: d1.endPage, is_meaningful: d1.isMeaningful })]));

  const s3 = reader('b', 80, s2.now + 24 * 60 * MIN);
  s3.read(80, 120, 30);
  const d3 = s3.close(80);

  assert.deepEqual([d1.startPage, d1.endPage], [1, 40]);
  assert.deepEqual([d2.startPage, d2.endPage], [40, 80]);
  assert.deepEqual([d3.startPage, d3.endPage], [80, 120]);
  assert.ok(d1.isMeaningful && d2.isMeaningful && d3.isMeaningful);
});

test('rereading a few earlier pages before continuing does not widen the new range', () => {
  const r = reader('b', 36);
  r.read(36, 80, 30);
  const draft = r.close(40);
  assert.deepEqual([draft.startPage, draft.endPage], [40, 80]);
  assert.equal(draft.isReread, false);
});

test('a reread of already-covered pages is recorded but never meaningful', () => {
  const r = reader('b', 30);
  r.read(30, 45, 60);
  const draft = r.close(60);
  assert.equal(draft.isReread, true);
  assert.equal(draft.isMeaningful, false);
  assert.deepEqual([draft.startPage, draft.endPage], [30, 45]);
});

test('a long time on a single dense page still counts as reading', () => {
  const r = reader('b', 12);
  r.stay(7 * 60, { touchEverySeconds: 180 });
  const draft = r.close();
  assert.deepEqual([draft.startPage, draft.endPage], [12, 12]);
  assert.equal(draft.isMeaningful, true);
});

test('with no input at all, active time stops accruing after the idle cap', () => {
  const r = reader('b', 12);
  r.stay(12 * 60, { touchEverySeconds: 0 });
  assert.ok(r.state.activeMs <= R.IDLE_CAP_MS + 5000, `activeMs ${r.state.activeMs}`);
  assert.equal(r.close().isMeaningful, false);
});

test('jumping forward ends the session; skipped pages belong to no session', () => {
  const r = reader('b', 40);
  r.read(40, 45, 30);
  const closed = r.goTo(90);
  assert.ok(closed, 'jump closes the previous session');
  const first = L.closeTracker(closed, 0);
  assert.deepEqual([first.startPage, first.endPage], [40, 45]);

  r.read(90, 95, 30);
  const second = r.close(45);
  assert.deepEqual([second.startPage, second.endPage], [90, 95]);
  assert.notEqual(first.id, second.id);
});

test('flipping quickly through pages is not reading them', () => {
  const r = reader('b', 40);
  r.stay(30);
  let closed = null;
  for (let p = 41; p <= 45 && !closed; p++) {
    r.stay(1);
    closed = r.goTo(p);
  }
  assert.ok(closed, 'skimming past JUMP_PAGES unread pages counts as a jump');
  assert.equal(closed.readEnd, 40);
});

test('glancing around before settling does not anchor the session', () => {
  const r = reader('b', 1);
  r.stay(2);
  assert.equal(r.goTo(117), null);
  r.read(117, 130, 30);
  const draft = r.close();
  assert.deepEqual([draft.startPage, draft.endPage], [117, 130]);
  assert.equal(draft.activeSeconds, 14 * 30);
});

test('moving back a little keeps the session; moving far back ends it', () => {
  const r = reader('b', 50);
  r.read(50, 60, 20);
  assert.equal(r.goTo(57), null);
  r.stay(20);
  assert.deepEqual([r.state.readStart, r.state.readEnd], [50, 60]);
  const closed = r.goTo(30);
  assert.ok(closed);
  assert.deepEqual([closed.readStart, closed.readEnd], [50, 60]);
});

test('Scenario E: a short trip to the background continues the same session', () => {
  const r = reader('b', 1);
  r.read(1, 10, 30);
  const before = r.state;
  const hiddenAt = r.now;
  r.now += 5 * MIN;
  const resumed = L.resumeAfterHidden(before, hiddenAt, r.now, newId);
  assert.equal(resumed.closed, null);
  assert.equal(resumed.state.sessionId, before.sessionId);
  assert.equal(resumed.state.activeMs, before.activeMs, 'background time is not reading time');
  r.state = resumed.state;
  r.read(11, 20, 30);
  assert.deepEqual([r.close().startPage, r.close().endPage], [1, 20]);
});

test('a long absence ends the session at the last moment of reading', () => {
  const r = reader('b', 1);
  r.read(1, 10, 30);
  const lastActive = r.state.lastActiveAt;
  const hiddenAt = r.now;
  const resumed = L.resumeAfterHidden(r.state, hiddenAt, hiddenAt + 45 * MIN, newId);
  assert.ok(resumed.closed);
  const draft = L.closeTracker(resumed.closed, 0);
  assert.equal(draft.endedAt, new Date(lastActive).toISOString());
  assert.notEqual(resumed.state.sessionId, r.state.sessionId);
});

test('idling in the foreground for a full break ends the session', () => {
  const r = reader('b', 1);
  r.read(1, 5, 30);
  let result = { closed: null };
  for (let t = 0; t < 40 * 60 && !result.closed; t += 5) {
    r.now += 5000;
    result = L.checkIdleBreak(r.state, r.now, newId);
    r.state = result.closed ? result.state : L.tick(r.state, r.now, true);
  }
  assert.ok(result.closed, 'session closed after the break');
  assert.ok(r.now - result.closed.lastInteractionAt >= R.SESSION_BREAK_MS);
  // The fresh session does not accrue until the reader touches the screen again.
  r.now += 60_000;
  assert.equal(L.tick(result.state, r.now, true).activeMs, 0);
});

test('a frozen timer never credits more than one tick slice', () => {
  const r = reader('b', 1);
  r.state = L.recordInteraction(r.state, r.now);
  const later = L.tick(r.state, r.now + 10 * MIN, true);
  assert.ok(later.activeMs <= R.MAX_TICK_MS);
});

test('a killed app leaves a checkpoint that still closes into the same session', () => {
  const r = reader('b', 5);
  r.read(5, 20, 30);
  const restored = JSON.parse(JSON.stringify(r.state));
  assert.equal(L.isTrackerState(restored), true);
  assert.deepEqual(L.closeTracker(restored, 0), r.close(0));
  assert.equal(L.isTrackerState({ v: 2 }), false);
});

test('"Previously…" appears only after a break, for the latest meaningful unseen session', () => {
  const now = T0 + 10 * 60 * MIN;
  const older = session({ start_page: 1, end_page: 40, ended_at: new Date(now - 3 * 24 * 60 * MIN).toISOString() });
  const latest = session({ start_page: 40, end_page: 80, ended_at: new Date(now - 2 * 60 * MIN).toISOString() });

  assert.equal(L.pickBridgeSession([older, latest], now).id, latest.id);
  assert.equal(L.pickBridgeSession([latest], latest.ended_at && Date.parse(latest.ended_at) + 10 * MIN), null, 'immediate return');
  assert.equal(L.pickBridgeSession([older, { ...latest, recap_viewed_at: 'x' }], now), null, 'seen: no fallback to older sessions');

  const brief = session({ start_page: 80, end_page: 81, is_meaningful: false, ended_at: new Date(now - 5 * MIN).toISOString() });
  assert.equal(L.pickBridgeSession([latest, brief], now), null, 'reading minutes ago resets the gap');
  const briefEarlier = { ...brief, ended_at: new Date(now - 90 * MIN).toISOString() };
  assert.equal(L.pickBridgeSession([latest, briefEarlier], now).id, latest.id);
  assert.equal(L.pickBridgeSession([], now), null);
});

test('boundary edits cannot reach unread pages; huge sessions recap their trailing pages', () => {
  const sessions = [session({ end_page: 40 }), session({ end_page: 117, is_meaningful: false })];
  assert.equal(L.maxEditablePage(sessions, 90), 117);
  assert.equal(L.maxEditablePage([], 12), 12);
  assert.equal(L.computeFrontier(sessions), 40);
  assert.deepEqual(L.recapRangeFor(84, 117), { startPage: 84, endPage: 117 });
  assert.deepEqual(L.recapRangeFor(1, 400), { startPage: 400 - R.MAX_RECAP_PAGES + 1, endPage: 400 });
});
