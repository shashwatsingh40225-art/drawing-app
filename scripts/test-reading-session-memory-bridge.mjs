import assert from 'node:assert';

// Real implementation imports directly from src/
import {
  evaluateSessionMeaningfulness,
  useReadingSessionStore,
} from '../src/stores/readingSessionStore.ts';
import {
  buildRecapPrompt,
  generateSessionRecap,
  getGeminiApiKey,
  setGeminiApiKey,
} from '../src/services/geminiRecapService.ts';
import { extractPdfTextRange } from '../src/services/pdfTextExtractor.ts';

console.log('🧪 Starting Reading Session Memory Bridge REAL Implementation Verification Suite...\n');

let testsPassed = 0;
let testsFailed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    testsFailed++;
  }
}

async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    testsFailed++;
  }
}

// -------------------------------------------------------------
// Module 1: Meaningful Session Evaluator Logic (Real import)
// -------------------------------------------------------------
console.log('--- 1. Testing Real Meaningful Session Evaluator ---');

it('Trivial 1-page glance for 10 seconds is NOT meaningful', () => {
  const result = evaluateSessionMeaningfulness(1, 1, 10, 1);
  assert.strictEqual(result, false);
});

it('Quick flip through 2 pages in 20 seconds is NOT meaningful', () => {
  const result = evaluateSessionMeaningfulness(1, 2, 20, 2);
  assert.strictEqual(result, false);
});

it('Reading 3 pages over 45 seconds IS meaningful', () => {
  const result = evaluateSessionMeaningfulness(10, 12, 45, 3);
  assert.strictEqual(result, true);
});

it('Deep study on 1 page for 180 seconds (3 mins) IS meaningful', () => {
  const result = evaluateSessionMeaningfulness(42, 42, 180, 1);
  assert.strictEqual(result, true);
});

it('Reading 2 dense pages over 90 seconds IS meaningful', () => {
  const result = evaluateSessionMeaningfulness(50, 51, 90, 2);
  assert.strictEqual(result, true);
});

it('Reading a 33-page chapter (e.g. p84 to 117) over 50 mins IS meaningful', () => {
  const result = evaluateSessionMeaningfulness(84, 117, 3000, 34);
  assert.strictEqual(result, true);
});

it('Handles reverse reading (e.g. flipping back from p30 to p25)', () => {
  const result = evaluateSessionMeaningfulness(30, 25, 60, 6);
  assert.strictEqual(result, true);
});

// -------------------------------------------------------------
// Module 2: Store Lifecycle, Progress Anchoring, and Jump Isolation
// -------------------------------------------------------------
console.log('\n--- 2. Testing Store Lifecycle, Progress Anchoring & Jumps ---');

it('Handles initial progress race condition by re-anchoring start page', () => {
  const store = useReadingSessionStore.getState();
  
  // Simulation: reader opens, starts on default page 1 with 0 dwell
  store.startSession('test-book-race', 1);
  let active = useReadingSessionStore.getState().activeSession;
  assert.ok(active);
  assert.strictEqual(active.start_page, 1);
  assert.strictEqual(active.duration_seconds, 0);

  // 30ms later, saved progress finishes loading from database at page 84
  store.startSession('test-book-race', 84);
  active = useReadingSessionStore.getState().activeSession;
  assert.ok(active);
  assert.strictEqual(active.start_page, 84, 'Must re-anchor start_page to true loaded progress');
  assert.strictEqual(active.end_page, 84);
});

it('Detects large navigation jumps and isolates previous reading session', () => {
  const store = useReadingSessionStore.getState();
  
  // Start session on page 10
  store.startSession('test-book-jump', 10);
  
  // Read pages 10, 11, 12 with active dwell time (45s total)
  store.recordUserInteraction();
  store.incrementActiveDwellTime(45);
  store.recordPageActivity(11);
  store.recordPageActivity(12);

  let active = useReadingSessionStore.getState().activeSession;
  assert.strictEqual(active.start_page, 10);
  assert.strictEqual(active.end_page, 12);
  assert.strictEqual(active.duration_seconds, 45);

  // Reader now jumps from page 12 to page 200 (> 3 pages jump)
  store.recordPageActivity(200);

  // Previous reading (p10-12) should have been finalized as its own session!
  const finalizedList = useReadingSessionStore.getState().sessionsByBookId['test-book-jump'] || [];
  assert.ok(finalizedList.length >= 1, 'Jump must finalize prior meaningful reading');
  const prior = finalizedList.find(s => s.start_page === 10);
  assert.ok(prior);
  assert.strictEqual(prior.end_page, 12);
  assert.strictEqual(prior.is_meaningful, true);

  // Active session should now start fresh at jumped page 200, NOT spanning 10..200
  const newActive = useReadingSessionStore.getState().activeSession;
  assert.ok(newActive);
  assert.strictEqual(newActive.start_page, 200);
  assert.strictEqual(newActive.end_page, 200);
});

it('Inactivity freezes active dwell time after 3 minutes without interaction', () => {
  const store = useReadingSessionStore.getState();
  store.startSession('test-book-idle', 50);

  // User interacts
  store.recordUserInteraction();
  store.incrementActiveDwellTime(5);
  let active = useReadingSessionStore.getState().activeSession;
  assert.strictEqual(active.duration_seconds, 5);

  // Simulate user leaving desk for 4 minutes (240 seconds ago)
  useReadingSessionStore.setState({ lastActiveTimestamp: Date.now() - 240000 });

  // Dwell timer ticks
  store.incrementActiveDwellTime(1);
  active = useReadingSessionStore.getState().activeSession;
  assert.strictEqual(active.duration_seconds, 5, 'Dwell time must NOT increment when reader is idle (> 180s)');

  // User moves mouse or touches screen
  store.recordUserInteraction();
  store.incrementActiveDwellTime(1);
  active = useReadingSessionStore.getState().activeSession;
  assert.strictEqual(active.duration_seconds, 6, 'Dwell time resumes after user interaction');
});

// -------------------------------------------------------------
// Module 3: Manual Boundary Correction & Invalidation
// -------------------------------------------------------------
console.log('\n--- 3. Testing Real Boundary Correction & Invalidation ---');

await itAsync('updateSessionBoundaries invalidates recap, resets viewed state, and recalculates', async () => {
  const store = useReadingSessionStore.getState();
  
  // Seed a session with an existing recap
  const testSession = {
    id: 'test-sess-boundary-' + Date.now(),
    user_id: 'demo-artist-01',
    book_id: 'test-book-boundary',
    started_at: '2026-09-15T00:00:00Z',
    ended_at: '2026-09-15T00:45:00Z',
    start_page: 84,
    end_page: 117,
    duration_seconds: 2700,
    pages_read: 34,
    is_meaningful: true,
    recap: 'Previously, the artist analyzed joint tension on page 95...',
    recap_error: null,
    recap_generated_at: '2026-09-15T00:46:00Z',
    recap_viewed_at: '2026-09-15T01:00:00Z',
    created_at: '2026-09-15T00:00:00Z',
    updated_at: '2026-09-15T00:46:00Z',
  };

  useReadingSessionStore.setState({
    sessionsByBookId: {
      'test-book-boundary': [testSession],
    },
  });

  // User manually edits reading boundaries to 82 - 119
  const updated = await store.updateSessionBoundaries(
    testSession.id,
    82,
    119
  );

  assert.ok(updated);
  assert.strictEqual(updated.start_page, 82);
  assert.strictEqual(updated.end_page, 119);
  assert.strictEqual(updated.pages_read, 38);
  assert.strictEqual(updated.recap, null, 'Old recap MUST be invalidated when boundaries change');
  assert.strictEqual(updated.recap_error, null, 'Recap error must be cleared');
  assert.strictEqual(updated.recap_generated_at, null, 'Timestamp must be cleared');
  assert.strictEqual(updated.recap_viewed_at, null, 'Viewed state must reset so corrected recap can be seen');
  assert.strictEqual(updated.is_meaningful, true);
});

// -------------------------------------------------------------
// Module 4: Return UX, Recency Sorting & Viewed State
// -------------------------------------------------------------
console.log('\n--- 4. Testing Return UX & Recency Ordering ---');

await itAsync('getLatestUnviewedMeaningfulSession sorts by ended_at DESC and skips viewed', async () => {
  const store = useReadingSessionStore.getState();
  const bookId = 'test-book-recency';
  const now = Date.now();

  const sessionOlderUnviewed = {
    id: 'sess-older-unviewed',
    user_id: 'demo-artist-01',
    book_id: bookId,
    started_at: new Date(now - 7200000).toISOString(),
    ended_at: new Date(now - 3600000).toISOString(), // 1 hr ago
    start_page: 1,
    end_page: 25,
    duration_seconds: 1800,
    pages_read: 25,
    is_meaningful: true,
    recap: 'Older recap...',
    recap_error: null,
    recap_viewed_at: null,
    created_at: new Date(now - 7200000).toISOString(),
    updated_at: new Date(now - 3600000).toISOString(),
  };

  const sessionNewerUnviewed = {
    id: 'sess-newer-unviewed',
    user_id: 'demo-artist-01',
    book_id: bookId,
    started_at: new Date(now - 1800000).toISOString(),
    ended_at: new Date(now - 60000).toISOString(), // 1 min ago
    start_page: 26,
    end_page: 55,
    duration_seconds: 1600,
    pages_read: 30,
    is_meaningful: true,
    recap: 'Newer recap...',
    recap_error: null,
    recap_viewed_at: null,
    created_at: new Date(now - 1800000).toISOString(),
    updated_at: new Date(now - 60000).toISOString(),
  };

  // Put them in unordered in store
  useReadingSessionStore.setState({
    sessionsByBookId: {
      [bookId]: [sessionOlderUnviewed, sessionNewerUnviewed],
    },
  });

  const latest = store.getLatestUnviewedMeaningfulSession(bookId);
  assert.ok(latest);
  assert.strictEqual(latest.id, 'sess-newer-unviewed', 'Must pick the newest ended_at session');

  // Mark newer as viewed
  await store.markRecapViewed(latest.id);
  const nextLatest = store.getLatestUnviewedMeaningfulSession(bookId);
  assert.ok(nextLatest);
  assert.strictEqual(nextLatest.id, 'sess-older-unviewed', 'Must fall back to previous unviewed session');
});

// -------------------------------------------------------------
// Module 5: Grounding, Strict Prompting & Anti-Spoiler
// -------------------------------------------------------------
console.log('\n--- 5. Testing Real Prompt Grounding & Anti-Spoiler Constraints ---');

it('buildRecapPrompt generates prompt adhering to grounding, bounds, and brevity', () => {
  const prompt = buildRecapPrompt({
    bookTitle: 'Anatomical Kinetic Reference',
    author: 'Studio Kin',
    startPage: 12,
    endPage: 36,
    sessionText: 'Plate 12 demonstrates muscle fiber recruitment under axial rotation...',
  });

  assert.ok(prompt.includes('Pages 12 through 36'));
  assert.ok(prompt.includes('Title: "Anatomical Kinetic Reference"'));
  assert.ok(prompt.includes('Author: "Studio Kin"'));
  assert.ok(prompt.includes('NO SPOILERS: Summarize ONLY up to Page 36'));
  assert.ok(prompt.includes('GROUNDING: Use ONLY the text provided below'));
  assert.ok(prompt.includes('Target reading time: 30 seconds'));
  assert.ok(prompt.includes('Plate 12 demonstrates muscle fiber recruitment'));
});

// -------------------------------------------------------------
// Module 6: Gemini Service Key Discovery & Error Resilience
// -------------------------------------------------------------
console.log('\n--- 6. Testing API Key Discovery & Error Resilience ---');

it('getGeminiApiKey and setGeminiApiKey support custom user keys', () => {
  // Test setting a custom key
  setGeminiApiKey('AIzaSyCustomTestKey123');
  assert.strictEqual(getGeminiApiKey(), 'AIzaSyCustomTestKey123');

  // Reset
  setGeminiApiKey('');
  assert.strictEqual(getGeminiApiKey(), '');
});

await itAsync('generateSessionRecap rejects missing API key gracefully', async () => {
  setGeminiApiKey(''); // Ensure key is empty
  const result = await generateSessionRecap({
    bookTitle: 'Test Book',
    startPage: 1,
    endPage: 5,
    sessionText: 'This is sample valid length text for reading session test.',
  });

  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('Gemini API key is not configured'));
});

await itAsync('generateSessionRecap rejects empty or insufficient text without throw', async () => {
  setGeminiApiKey('AIzaSyValidDummyKey');
  const resultEmpty = await generateSessionRecap({
    bookTitle: 'Test Book',
    startPage: 1,
    endPage: 5,
    sessionText: '',
  });

  assert.strictEqual(resultEmpty.success, false);
  assert.ok(resultEmpty.error.includes('Insufficient text'));

  const resultShort = await generateSessionRecap({
    bookTitle: 'Test Book',
    startPage: 1,
    endPage: 5,
    sessionText: 'Too short',
  });

  assert.strictEqual(resultShort.success, false);
  assert.ok(resultShort.error.includes('Insufficient text'));
  setGeminiApiKey('');
});

await itAsync('extractPdfTextRange handles image placeholder files gracefully', async () => {
  const result = await extractPdfTextRange('/artist-reference/art-08.jpeg', 1, 5, {
    title: 'Study Plate Hand',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.isPlaceholder, true);
  assert.ok(result.combinedText.includes('Visual Study Book: Study Plate Hand'));
});

// -------------------------------------------------------------
// Test Summary
// -------------------------------------------------------------
console.log('\n=============================================');
console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log('=============================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Real Implementation Memory Bridge tests passed successfully!\n');
}
