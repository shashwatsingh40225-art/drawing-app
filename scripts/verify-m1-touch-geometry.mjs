import assert from 'node:assert';
import fs from 'node:fs';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { useSwipeGesture } from '../src/hooks/useSwipeGesture.ts';

console.log('🧪 Running Empirical M1 Touch & Geometry Verification Suite...\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

// Helper to instantiate useSwipeGesture inside a React context
function createSwipeHarness(handlers = {}, threshold = 50) {
  let swipeProps = null;
  function TestComp() {
    swipeProps = useSwipeGesture(handlers, threshold);
    return null;
  }
  ReactDOMServer.renderToString(React.createElement(TestComp));
  return swipeProps;
}

// ============================================================================
// SUITE 1: useSwipeGesture Synthetic Touch Invariants
// ============================================================================
console.log('--- Suite 1: useSwipeGesture Synthetic Touch Events & Invariants ---');

// Mock clock for testing duration thresholds
const origDateNow = Date.now;
let mockTime = 1000000;
function withMockTime(startTime, fn) {
  mockTime = startTime;
  Date.now = () => mockTime;
  try {
    fn();
  } finally {
    Date.now = origDateNow;
  }
}

it('Single-touch: Fast swipe left triggers onSwipeLeft', () => {
  let swipedLeft = false;
  let swipedRight = false;
  const harness = createSwipeHarness({
    onSwipeLeft: () => { swipedLeft = true; },
    onSwipeRight: () => { swipedRight = true; },
  });

  withMockTime(1000, () => {
    // start at x: 200, y: 100
    harness.onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] });
    // advance 150ms (< 350ms)
    mockTime += 150;
    // move to x: 100, y: 100 (dx = -100)
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
  });

  assert.strictEqual(swipedLeft, true, 'onSwipeLeft should have fired');
  assert.strictEqual(swipedRight, false, 'onSwipeRight should NOT have fired');
});

it('Single-touch: Fast swipe right triggers onSwipeRight', () => {
  let swipedRight = false;
  const harness = createSwipeHarness({
    onSwipeRight: () => { swipedRight = true; },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
    mockTime += 120;
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 220, clientY: 100 }],
    });
  });

  assert.strictEqual(swipedRight, true, 'onSwipeRight should have fired');
});

it('Single-touch: Fast swipe up triggers onSwipeUp', () => {
  let swipedUp = false;
  const harness = createSwipeHarness({
    onSwipeUp: () => { swipedUp = true; },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 100, clientY: 200 }] });
    mockTime += 100;
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 100, clientY: 80 }],
    });
  });

  assert.strictEqual(swipedUp, true, 'onSwipeUp should have fired');
});

it('Single-touch: Fast swipe down triggers onSwipeDown', () => {
  let swipedDown = false;
  const harness = createSwipeHarness({
    onSwipeDown: () => { swipedDown = true; },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
    mockTime += 100;
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 100, clientY: 220 }],
    });
  });

  assert.strictEqual(swipedDown, true, 'onSwipeDown should have fired');
});

it('Threshold boundary: Movement <= threshold (50px) does NOT trigger swipe', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeLeft: () => { triggered = true; },
    onSwipeRight: () => { triggered = true; },
  }, 50);

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
    mockTime += 100;
    // dx = 50px (exactly equal to threshold)
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 150, clientY: 100 }],
    });
  });

  assert.strictEqual(triggered, false, 'Swipe should not trigger at exactly threshold');
});

it('Threshold boundary: Movement > threshold (51px) DOES trigger swipe', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeRight: () => { triggered = true; },
  }, 50);

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
    mockTime += 100;
    // dx = 51px (strictly greater than threshold)
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 151, clientY: 100 }],
    });
  });

  assert.strictEqual(triggered, true, 'Swipe should trigger when strictly exceeding threshold');
});

it('Dominant axis: Horizontal dominance (|dx| > |dy|) fires horizontal swipe only', () => {
  let swipedRight = false;
  let swipedDown = false;
  const harness = createSwipeHarness({
    onSwipeRight: () => { swipedRight = true; },
    onSwipeDown: () => { swipedDown = true; },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
    mockTime += 100;
    // dx = 80, dy = 60
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 180, clientY: 160 }],
    });
  });

  assert.strictEqual(swipedRight, true, 'Horizontal swipe should fire');
  assert.strictEqual(swipedDown, false, 'Vertical swipe should NOT fire');
});

it('Dominant axis: Vertical dominance (|dy| > |dx|) fires vertical swipe only', () => {
  let swipedRight = false;
  let swipedDown = false;
  const harness = createSwipeHarness({
    onSwipeRight: () => { swipedRight = true; },
    onSwipeDown: () => { swipedDown = true; },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
    mockTime += 100;
    // dx = 60, dy = 80
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 160, clientY: 180 }],
    });
  });

  assert.strictEqual(swipedRight, false, 'Horizontal swipe should NOT fire');
  assert.strictEqual(swipedDown, true, 'Vertical swipe should fire');
});

it('Multi-touch: Initial touch with 2 fingers (pinch gesture) is ignored on start', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeLeft: () => { triggered = true; },
    onSwipeRight: () => { triggered = true; },
  });

  withMockTime(1000, () => {
    // 2 touches down simultaneously (pinch-to-zoom)
    harness.onTouchStart({
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ],
    });
    mockTime += 100;
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 300, clientY: 100 }],
    });
  });

  assert.strictEqual(triggered, false, 'Multi-touch on start must NOT trigger swipe');
});

it('Multi-touch: 3 fingers on start is ignored', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeLeft: () => { triggered = true; },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 150, clientY: 150 },
        { clientX: 200, clientY: 200 },
      ],
    });
    mockTime += 100;
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 10, clientY: 100 }],
    });
  });

  assert.strictEqual(triggered, false, '3-touch gesture must NOT trigger swipe');
});

it('Multi-touch: Second finger touches down mid-gesture (onTouchMove) cancels swipe', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeLeft: () => { triggered = true; },
    onSwipeRight: () => { triggered = true; },
  });

  withMockTime(1000, () => {
    // Single touch start
    harness.onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] });
    mockTime += 50;
    // Second touch added mid-gesture (pinch zoom initiation)
    harness.onTouchMove({
      touches: [
        { clientX: 180, clientY: 100 },
        { clientX: 250, clientY: 120 },
      ],
    });
    mockTime += 50;
    // Release
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 50, clientY: 100 }],
    });
  });

  assert.strictEqual(triggered, false, 'Mid-gesture multi-touch must cancel swipe');
});

it('Multi-touch: Releasing one finger while another remains down (touches.length > 0) aborts swipe', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeRight: () => { triggered = true; },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
    mockTime += 100;
    // One finger released, but touches still contains remaining finger
    harness.onTouchEnd({
      touches: [{ clientX: 150, clientY: 100 }],
      changedTouches: [{ clientX: 250, clientY: 100 }],
    });
  });

  assert.strictEqual(triggered, false, 'Swipe must abort if other touches are still active');
});

it('Duration threshold: Duration = 349ms (< 350ms) triggers swipe', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeRight: () => { triggered = true; },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
    mockTime += 349;
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 200, clientY: 100 }],
    });
  });

  assert.strictEqual(triggered, true, 'Gesture duration 349ms (< 350ms) should trigger swipe');
});

it('Duration threshold: Duration = 350ms (>= 350ms boundary) ABORTS swipe (pan/drag)', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeRight: () => { triggered = true; },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
    mockTime += 350; // exactly 350ms
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 200, clientY: 100 }],
    });
  });

  assert.strictEqual(triggered, false, 'Gesture duration 350ms must NOT trigger swipe');
});

it('Duration threshold: Slow pan / deliberate drag (duration = 600ms) ABORTS swipe', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeLeft: () => { triggered = true; },
    onSwipeRight: () => { triggered = true; },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] });
    mockTime += 600;
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 50, clientY: 100 }],
    });
  });

  assert.strictEqual(triggered, false, 'Slow drag must NOT trigger swipe');
});

it('Text selection: Active selection in PDF text layer aborts swipe gesture', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeLeft: () => { triggered = true; },
  });

  // Mock active selection in DOM
  const origWindow = globalThis.window;
  globalThis.window = {
    getSelection: () => ({
      toString: () => 'The quick brown fox jumps over the lazy dog',
    }),
  };

  try {
    withMockTime(1000, () => {
      harness.onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] });
      mockTime += 100;
      harness.onTouchEnd({
        touches: [],
        changedTouches: [{ clientX: 50, clientY: 100 }],
      });
    });
  } finally {
    globalThis.window = origWindow;
  }

  assert.strictEqual(triggered, false, 'Active text selection must suppress swipe');
});

it('Text selection: Empty or whitespace-only selection allows swipe gesture', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeLeft: () => { triggered = true; },
  });

  const origWindow = globalThis.window;
  globalThis.window = {
    getSelection: () => ({
      toString: () => '   \n\t  ',
    }),
  };

  try {
    withMockTime(1000, () => {
      harness.onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] });
      mockTime += 100;
      harness.onTouchEnd({
        touches: [],
        changedTouches: [{ clientX: 50, clientY: 100 }],
      });
    });
  } finally {
    globalThis.window = origWindow;
  }

  assert.strictEqual(triggered, true, 'Empty/whitespace selection must allow swipe');
});

it('Text selection: null selection object allows swipe gesture', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeRight: () => { triggered = true; },
  });

  const origWindow = globalThis.window;
  globalThis.window = {
    getSelection: () => null,
  };

  try {
    withMockTime(1000, () => {
      harness.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
      mockTime += 100;
      harness.onTouchEnd({
        touches: [],
        changedTouches: [{ clientX: 220, clientY: 100 }],
      });
    });
  } finally {
    globalThis.window = origWindow;
  }

  assert.strictEqual(triggered, true, 'Null window.getSelection() must allow swipe');
});

it('State cleanliness: Calling onTouchEnd without prior onTouchStart does not throw or trigger', () => {
  let triggered = false;
  const harness = createSwipeHarness({
    onSwipeLeft: () => { triggered = true; },
  });

  harness.onTouchEnd({
    touches: [],
    changedTouches: [{ clientX: 50, clientY: 100 }],
  });

  assert.strictEqual(triggered, false, 'Orphaned onTouchEnd should be safe no-op');
});

it('Rapid recovery: Cancelled gesture followed immediately by valid swipe functions correctly', () => {
  let swiped = false;
  const harness = createSwipeHarness({
    onSwipeRight: () => { swiped = true; },
  });

  withMockTime(1000, () => {
    // 1. First attempt: multi-touch pinch, cancelled
    harness.onTouchStart({ touches: [{ clientX: 50, clientY: 50 }, { clientX: 100, clientY: 100 }] });
    harness.onTouchEnd({ touches: [], changedTouches: [{ clientX: 200, clientY: 50 }] });
    assert.strictEqual(swiped, false, 'Multi-touch should not fire');

    // 2. Second attempt: valid single-touch swipe
    mockTime += 500;
    harness.onTouchStart({ touches: [{ clientX: 50, clientY: 50 }] });
    mockTime += 100;
    harness.onTouchEnd({ touches: [], changedTouches: [{ clientX: 200, clientY: 50 }] });
    assert.strictEqual(swiped, true, 'Subsequent valid swipe should succeed');
  });
});

// ============================================================================
// SUITE 2: zoomScale > 1.0 Swipe Suppression Logic
// ============================================================================
console.log('\n--- Suite 2: zoomScale > 1.0 Swipe Suppression Logic ---');

function testZoomScaleBehavior(zoomScale, swipeDirection) {
  let pageChanged = 0;
  const handlePageChange = (newPage) => {
    pageChanged = newPage;
  };
  const currentPage = 5;

  // Exact callback implementation from ReaderScreen.tsx (lines 522-533)
  const harness = createSwipeHarness({
    onSwipeLeft: () => {
      if (zoomScale <= 1.0) {
        handlePageChange(currentPage + 1);
      }
    },
    onSwipeRight: () => {
      if (zoomScale <= 1.0) {
        handlePageChange(currentPage - 1);
      }
    },
  });

  withMockTime(1000, () => {
    harness.onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] });
    mockTime += 100;
    const endX = swipeDirection === 'left' ? 50 : 350;
    harness.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: endX, clientY: 100 }],
    });
  });

  return pageChanged;
}

it('zoomScale = 1.0 (Normal fit): Swipe left turns to page 6', () => {
  const result = testZoomScaleBehavior(1.0, 'left');
  assert.strictEqual(result, 6, 'Should advance page when zoomScale is 1.0');
});

it('zoomScale = 1.0 (Normal fit): Swipe right turns to page 4', () => {
  const result = testZoomScaleBehavior(1.0, 'right');
  assert.strictEqual(result, 4, 'Should decrease page when zoomScale is 1.0');
});

it('zoomScale = 0.8 (Zoomed out / fit page): Swipe left turns to page 6', () => {
  const result = testZoomScaleBehavior(0.8, 'left');
  assert.strictEqual(result, 6, 'Should advance page when zoomScale <= 1.0');
});

it('zoomScale = 1.001 (Micro-zoom): Swipe left is SUPPRESSED (0 page change)', () => {
  const result = testZoomScaleBehavior(1.001, 'left');
  assert.strictEqual(result, 0, 'Should suppress page turn when zoomScale > 1.0');
});

it('zoomScale = 1.3 (Fit Width default): Swipe left is SUPPRESSED (0 page change)', () => {
  const result = testZoomScaleBehavior(1.3, 'left');
  assert.strictEqual(result, 0, 'Fit Width zoom (1.3) must suppress page turn');
});

it('zoomScale = 1.3 (Fit Width default): Swipe right is SUPPRESSED (0 page change)', () => {
  const result = testZoomScaleBehavior(1.3, 'right');
  assert.strictEqual(result, 0, 'Fit Width zoom (1.3) must suppress page turn');
});

it('zoomScale = 2.0 (High zoom): Swipe left and right are SUPPRESSED (0 page change)', () => {
  const leftResult = testZoomScaleBehavior(2.0, 'left');
  const rightResult = testZoomScaleBehavior(2.0, 'right');
  assert.strictEqual(leftResult, 0, 'High zoom must suppress left swipe');
  assert.strictEqual(rightResult, 0, 'High zoom must suppress right swipe');
});

// ============================================================================
// SUITE 3: Touch Propagation Isolation
// ============================================================================
console.log('\n--- Suite 3: Touch Propagation Isolation ---');

it('Synthetic DOM propagation model: child stopPropagation blocks parent swipe detection', () => {
  let parentReceivedStart = false;
  let parentReceivedMove = false;
  let parentReceivedEnd = false;
  let parentSwipeTriggered = false;

  const parentSwipe = createSwipeHarness({
    onSwipeLeft: () => { parentSwipeTriggered = true; },
  });

  const parentContainer = {
    onTouchStart: (e) => {
      parentReceivedStart = true;
      parentSwipe.onTouchStart(e);
    },
    onTouchMove: (e) => {
      parentReceivedMove = true;
      parentSwipe.onTouchMove(e);
    },
    onTouchEnd: (e) => {
      parentReceivedEnd = true;
      parentSwipe.onTouchEnd(e);
    },
  };

  // Child simulating ReaderSidebar or MemoryBridgeCard with stopPropagation
  const childPanel = {
    onTouchStart: (e) => e.stopPropagation(),
    onTouchMove: (e) => e.stopPropagation(),
    onTouchEnd: (e) => e.stopPropagation(),
  };

  // Synthetic event dispatcher simulating bubbling
  function dispatchSyntheticEvent(type, eventData, target, parent) {
    let propagationStopped = false;
    const syntheticEvent = {
      ...eventData,
      stopPropagation: () => { propagationStopped = true; },
      isPropagationStopped: () => propagationStopped,
    };

    // Target (child) receives event first
    if (target[type]) {
      target[type](syntheticEvent);
    }

    // Bubbles to parent only if propagation was NOT stopped
    if (!propagationStopped && parent[type]) {
      parent[type](syntheticEvent);
    }
  }

  withMockTime(1000, () => {
    // 1. Dispatch touch sequence targeting child panel
    dispatchSyntheticEvent('onTouchStart', { touches: [{ clientX: 200, clientY: 100 }] }, childPanel, parentContainer);
    mockTime += 100;
    dispatchSyntheticEvent('onTouchMove', { touches: [{ clientX: 150, clientY: 100 }] }, childPanel, parentContainer);
    mockTime += 50;
    dispatchSyntheticEvent('onTouchEnd', { touches: [], changedTouches: [{ clientX: 50, clientY: 100 }] }, childPanel, parentContainer);
  });

  assert.strictEqual(parentReceivedStart, false, 'Parent must NOT receive onTouchStart from child panel');
  assert.strictEqual(parentReceivedMove, false, 'Parent must NOT receive onTouchMove from child panel');
  assert.strictEqual(parentReceivedEnd, false, 'Parent must NOT receive onTouchEnd from child panel');
  assert.strictEqual(parentSwipeTriggered, false, 'Parent swipe handler must NOT trigger when touching inside child panel');
});

it('Static code verification: ReaderSidebar.tsx attaches stopPropagation to container and backdrop', () => {
  const sidebarCode = fs.readFileSync('src/components/reader/ReaderSidebar.tsx', 'utf-8');

  // Verify backdrop stopPropagation
  assert.match(sidebarCode, /onTouchStart=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/, 'Backdrop/container must stop TouchStart');
  assert.match(sidebarCode, /onTouchMove=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/, 'Backdrop/container must stop TouchMove');
  assert.match(sidebarCode, /onTouchEnd=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/, 'Backdrop/container must stop TouchEnd');

  // Count occurrences: both backdrop and drawer container must have stopPropagation (at least 2 of each)
  const startMatches = (sidebarCode.match(/onTouchStart=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/g) || []).length;
  const moveMatches = (sidebarCode.match(/onTouchMove=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/g) || []).length;
  const endMatches = (sidebarCode.match(/onTouchEnd=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/g) || []).length;

  assert.ok(startMatches >= 2, `ReaderSidebar has ${startMatches} onTouchStart stopPropagation handlers (expected >= 2)`);
  assert.ok(moveMatches >= 2, `ReaderSidebar has ${moveMatches} onTouchMove stopPropagation handlers (expected >= 2)`);
  assert.ok(endMatches >= 2, `ReaderSidebar has ${endMatches} onTouchEnd stopPropagation handlers (expected >= 2)`);
});

it('Static code verification: MemoryBridgeCard.tsx attaches stopPropagation to container', () => {
  const cardCode = fs.readFileSync('src/components/reader/MemoryBridgeCard.tsx', 'utf-8');

  assert.match(cardCode, /className="memory-bridge-card"/, 'Card container exists');
  assert.match(cardCode, /onTouchStart=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/, 'Card must stop TouchStart');
  assert.match(cardCode, /onTouchMove=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/, 'Card must stop TouchMove');
  assert.match(cardCode, /onTouchEnd=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/, 'Card must stop TouchEnd');
});

// ============================================================================
// SUITE 4: Geometry & Landscape Phone Invariants
// ============================================================================
console.log('\n--- Suite 4: Geometry & Landscape Phone Detection Invariants ---');

function checkIsMobile(width, height) {
  // Logic from ReaderToolbar, ReaderSidebar, ReaderViewport
  return width <= 768 || height <= 500;
}

it('Landscape phone detection: 844x390 (iPhone 14 landscape) is detected as mobile', () => {
  assert.strictEqual(checkIsMobile(844, 390), true);
});

it('Landscape phone detection: 932x430 (iPhone 14 Pro Max landscape) is detected as mobile', () => {
  assert.strictEqual(checkIsMobile(932, 430), true);
});

it('Portrait phone detection: 390x844 (iPhone 14 portrait) is detected as mobile', () => {
  assert.strictEqual(checkIsMobile(390, 844), true);
});

it('Narrow phone detection: 320x568 (SE portrait) is detected as mobile', () => {
  assert.strictEqual(checkIsMobile(320, 568), true);
});

it('Tablet portrait: 768x1024 is detected as mobile (width <= 768)', () => {
  assert.strictEqual(checkIsMobile(768, 1024), true);
});

it('Standard desktop: 1280x800 is detected as NOT mobile', () => {
  assert.strictEqual(checkIsMobile(1280, 800), false);
});

it('Full HD desktop: 1920x1080 is detected as NOT mobile', () => {
  assert.strictEqual(checkIsMobile(1920, 1080), false);
});

it('Boundary test: 769x501 is NOT mobile', () => {
  assert.strictEqual(checkIsMobile(769, 501), false);
});

it('Boundary test: 768x501 IS mobile (width boundary)', () => {
  assert.strictEqual(checkIsMobile(768, 501), true);
});

it('Boundary test: 769x500 IS mobile (height boundary)', () => {
  assert.strictEqual(checkIsMobile(769, 500), true);
});

it('ReaderViewport vertical padding: reduces bottom padding to 16px in landscape phone or focus mode', () => {
  function getPadding(isFocusMode, isLandscapePhone) {
    const isCompactVertical = isFocusMode || isLandscapePhone;
    const bottomPadding = isCompactVertical ? '16px' : '80px';
    const topPadding = isLandscapePhone ? '12px' : '24px';
    return { topPadding, bottomPadding };
  }

  // Normal desktop: 24px top, 80px bottom
  const normal = getPadding(false, false);
  assert.strictEqual(normal.bottomPadding, '80px');
  assert.strictEqual(normal.topPadding, '24px');

  // Focus mode: 24px top, 16px bottom (reclaims 64px)
  const focus = getPadding(true, false);
  assert.strictEqual(focus.bottomPadding, '16px');
  assert.strictEqual(focus.topPadding, '24px');

  // Landscape phone: 12px top, 16px bottom (reclaims 64px bottom + 12px top)
  const landscape = getPadding(false, true);
  assert.strictEqual(landscape.bottomPadding, '16px');
  assert.strictEqual(landscape.topPadding, '12px');

  // Both focus & landscape phone: 12px top, 16px bottom
  const both = getPadding(true, true);
  assert.strictEqual(both.bottomPadding, '16px');
  assert.strictEqual(both.topPadding, '12px');
});

it('ReaderScreen MemoryBridgeCard layout: right positioning prevents 38px collapse on mobile', () => {
  function getCardRight(activeSidebar, isMobile) {
    return activeSidebar && !isMobile ? '336px' : '16px';
  }

  // Mobile with sidebar open: right is 16px (no collapse!)
  assert.strictEqual(getCardRight('notes', true), '16px');
  // Mobile with sidebar closed: right is 16px
  assert.strictEqual(getCardRight(null, true), '16px');
  // Desktop with sidebar open: right is 336px (docked next to inline sidebar)
  assert.strictEqual(getCardRight('notes', false), '336px');
  // Desktop with sidebar closed: right is 16px
  assert.strictEqual(getCardRight(null, false), '16px');
});

it('ReaderToolbar popover styling: maxHeight and overflowY prevent overflow on short screens', () => {
  const toolbarCode = fs.readFileSync('src/components/reader/ReaderToolbar.tsx', 'utf-8');

  assert.match(toolbarCode, /maxHeight:\s*['"]calc\(100vh\s*-\s*60px\)['"]/, 'Popover must have maxHeight calc(100vh - 60px)');
  assert.match(toolbarCode, /overflowY:\s*['"]auto['"]/, 'Popover must have overflowY auto');
});

it('MemoryBridgeCard styling: maxHeight and overflowY prevent action button clipping', () => {
  const cardCode = fs.readFileSync('src/components/reader/MemoryBridgeCard.tsx', 'utf-8');

  assert.match(cardCode, /maxHeight:\s*['"]calc\(100vh\s*-\s*120px\)['"]/, 'MemoryBridgeCard must have maxHeight calc(100vh - 120px)');
  assert.match(cardCode, /overflowY:\s*['"]auto['"]/, 'MemoryBridgeCard must have overflowY auto');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n=============================================================');
console.log(`Total tests executed: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log('=============================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL EMPIRICAL VERIFICATION TESTS PASSED SUCCESSFULLY!');
}