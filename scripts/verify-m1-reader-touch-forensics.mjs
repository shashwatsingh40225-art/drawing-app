import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';

console.log('🔍 Starting M1 Forensic Integrity Verification Suite...\n');

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

// ============================================================================
// Module 1: useSwipeGesture Behavior & Invariants
// ============================================================================
console.log('--- 1. Testing useSwipeGesture Pure Behavioral Logic ---');

import { useSwipeGesture } from '../src/hooks/useSwipeGesture.ts';

// Hook runner using React 19 client internals dispatcher
function runHook(fn) {
  const refs = [];
  let refIndex = 0;

  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = {
    useRef: (initialValue) => {
      if (refIndex >= refs.length) {
        refs.push({ current: initialValue });
      }
      return refs[refIndex++];
    },
    useCallback: (callback) => callback,
  };

  const result = fn();
  return result;
}

it('Single-touch horizontal left swipe within 350ms triggers onSwipeLeft', () => {
  let leftTriggered = false;
  let rightTriggered = false;

  const handlers = runHook(() =>
    useSwipeGesture({
      onSwipeLeft: () => { leftTriggered = true; },
      onSwipeRight: () => { rightTriggered = true; },
    }, 50)
  );

  // 1. Touch start: 1 finger at x=200, y=100
  handlers.onTouchStart({
    touches: [{ clientX: 200, clientY: 100 }],
  });

  // 2. Touch end: 0 active touches, changedTouches moved to x=100 (dx = -100)
  handlers.onTouchEnd({
    touches: [],
    changedTouches: [{ clientX: 100, clientY: 100 }],
  });

  assert.strictEqual(leftTriggered, true, 'onSwipeLeft should be called for dx < -50');
  assert.strictEqual(rightTriggered, false, 'onSwipeRight should NOT be called');
});

it('Single-touch horizontal right swipe within 350ms triggers onSwipeRight', () => {
  let rightTriggered = false;

  const handlers = runHook(() =>
    useSwipeGesture({
      onSwipeRight: () => { rightTriggered = true; },
    }, 50)
  );

  handlers.onTouchStart({
    touches: [{ clientX: 100, clientY: 100 }],
  });

  handlers.onTouchEnd({
    touches: [],
    changedTouches: [{ clientX: 200, clientY: 100 }],
  });

  assert.strictEqual(rightTriggered, true, 'onSwipeRight should be called for dx > 50');
});

it('Multi-touch start (pinch-to-zoom 2 fingers) is IGNORED immediately', () => {
  let leftTriggered = false;

  const handlers = runHook(() =>
    useSwipeGesture({
      onSwipeLeft: () => { leftTriggered = true; },
    }, 50)
  );

  // 2 fingers touched down simultaneously
  handlers.onTouchStart({
    touches: [
      { clientX: 100, clientY: 100 },
      { clientX: 200, clientY: 100 },
    ],
  });

  handlers.onTouchEnd({
    touches: [],
    changedTouches: [{ clientX: 20, clientY: 100 }],
  });

  assert.strictEqual(leftTriggered, false, 'Multi-touch start must NOT trigger swipe');
});

it('Second finger touching down mid-gesture aborts active swipe', () => {
  let leftTriggered = false;

  const handlers = runHook(() =>
    useSwipeGesture({
      onSwipeLeft: () => { leftTriggered = true; },
    }, 50)
  );

  // 1 finger starts
  handlers.onTouchStart({
    touches: [{ clientX: 200, clientY: 100 }],
  });

  // Second finger touches down during pan / zoom
  handlers.onTouchMove({
    touches: [
      { clientX: 150, clientY: 100 },
      { clientX: 250, clientY: 100 },
    ],
  });

  // Release
  handlers.onTouchEnd({
    touches: [],
    changedTouches: [{ clientX: 50, clientY: 100 }],
  });

  assert.strictEqual(leftTriggered, false, 'Mid-gesture multi-touch must cancel swipe');
});

it('Remaining touch active at touchEnd aborts swipe', () => {
  let leftTriggered = false;

  const handlers = runHook(() =>
    useSwipeGesture({
      onSwipeLeft: () => { leftTriggered = true; },
    }, 50)
  );

  handlers.onTouchStart({
    touches: [{ clientX: 200, clientY: 100 }],
  });

  // One finger still down
  handlers.onTouchEnd({
    touches: [{ clientX: 180, clientY: 100 }],
    changedTouches: [{ clientX: 50, clientY: 100 }],
  });

  assert.strictEqual(leftTriggered, false, 'Active remaining touches must abort swipe');
});

it('Active text selection in PDF text layer aborts swipe', () => {
  let leftTriggered = false;

  // Mock window.getSelection
  global.window = {
    getSelection: () => ({
      toString: () => 'highlighted text content in pdf layer',
    }),
  };

  const handlers = runHook(() =>
    useSwipeGesture({
      onSwipeLeft: () => { leftTriggered = true; },
    }, 50)
  );

  handlers.onTouchStart({
    touches: [{ clientX: 200, clientY: 100 }],
  });

  handlers.onTouchEnd({
    touches: [],
    changedTouches: [{ clientX: 50, clientY: 100 }],
  });

  assert.strictEqual(leftTriggered, false, 'Active text selection must abort swipe');

  delete global.window;
});

// ============================================================================
// Module 2: Static Forensic Analysis of M1 Source Files
// ============================================================================
console.log('\n--- 2. Forensic Source Code & AST Inspection ---');

const ROOT = path.resolve('.');

it('ReaderToolbar.tsx recognizes landscape phones (innerHeight <= 500) as mobile', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/components/reader/ReaderToolbar.tsx'), 'utf-8');
  assert.ok(
    content.includes('window.innerWidth <= 768 || window.innerHeight <= 500'),
    'Toolbar must check window.innerHeight <= 500'
  );
  assert.ok(
    content.includes("window.addEventListener('resize', handleResize)"),
    'Toolbar must listen to resize'
  );
  assert.ok(
    content.includes("window.addEventListener('orientationchange', handleResize)"),
    'Toolbar must listen to orientationchange'
  );
  assert.ok(
    content.includes("maxHeight: 'calc(100vh - 60px)'"),
    'Mobile overflow popover must have maxHeight'
  );
  assert.ok(
    content.includes("overflowY: 'auto'"),
    'Mobile overflow popover must have overflowY auto'
  );
});

it('ReaderSidebar.tsx implements overlay drawer and touch event isolation', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/components/reader/ReaderSidebar.tsx'), 'utf-8');
  assert.ok(
    content.includes('window.innerWidth <= 768 || window.innerHeight <= 500'),
    'Sidebar must detect landscape phone / mobile viewports'
  );
  assert.ok(
    content.includes("position: isMobile ? 'fixed' : 'relative'"),
    'Sidebar must be fixed position on mobile to prevent crushing reading canvas'
  );
  assert.ok(
    content.includes("width: isMobile ? 'min(320px, 85vw)' : '320px'"),
    'Sidebar must adapt width on mobile viewports'
  );
  assert.ok(
    content.includes('onTouchStart={(e) => e.stopPropagation()}'),
    'Sidebar must stop touchStart propagation'
  );
  assert.ok(
    content.includes('onTouchMove={(e) => e.stopPropagation()}'),
    'Sidebar must stop touchMove propagation'
  );
  assert.ok(
    content.includes('onTouchEnd={(e) => e.stopPropagation()}'),
    'Sidebar must stop touchEnd propagation'
  );
  assert.ok(
    content.includes('onClick={onClose}'),
    'Sidebar backdrop must close sidebar when clicked'
  );
});

it('MemoryBridgeCard.tsx implements touch isolation and vertical scrolling', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/components/reader/MemoryBridgeCard.tsx'), 'utf-8');
  assert.ok(
    content.includes('onTouchStart={(e) => e.stopPropagation()}'),
    'MemoryBridgeCard must stop touchStart propagation'
  );
  assert.ok(
    content.includes('onTouchMove={(e) => e.stopPropagation()}'),
    'MemoryBridgeCard must stop touchMove propagation'
  );
  assert.ok(
    content.includes('onTouchEnd={(e) => e.stopPropagation()}'),
    'MemoryBridgeCard must stop touchEnd propagation'
  );
  assert.ok(
    content.includes("maxHeight: 'calc(100vh - 120px)'"),
    'MemoryBridgeCard must constrain maxHeight'
  );
  assert.ok(
    content.includes("overflowY: 'auto'"),
    'MemoryBridgeCard must allow vertical scrolling'
  );
});

it('ReaderViewport.tsx reduces vertical padding in landscape phone & focus mode', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/components/reader/ReaderViewport.tsx'), 'utf-8');
  assert.ok(
    content.includes('isCompactVertical = isFocusMode || isLandscapePhone'),
    'ReaderViewport must compute compact vertical mode'
  );
  assert.ok(
    content.includes("bottomPadding = isCompactVertical ? '16px' : '80px'"),
    'ReaderViewport must reduce bottom padding from 80px to 16px'
  );
  assert.ok(
    content.includes("topPadding = isLandscapePhone ? '12px' : '24px'"),
    'ReaderViewport must reduce top padding in landscape phone mode'
  );
});

it('ReaderScreen.tsx disables swipe gestures when zoomed in (zoomScale > 1.0)', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/screens/ReaderScreen.tsx'), 'utf-8');
  assert.ok(
    content.includes('if (zoomScale <= 1.0)'),
    'ReaderScreen must check zoomScale <= 1.0 before changing page on swipe'
  );
  assert.ok(
    content.includes("right: activeSidebar && !isMobile ? '336px' : '16px'"),
    'ReaderScreen must not offset right by 336px when isMobile is true'
  );
  assert.ok(
    content.includes('isFocusMode={isFocusMode}'),
    'ReaderScreen must pass isFocusMode to ReaderViewport'
  );
});

it('Zero facade/mock bypasses or hardcoded test returns in modified files', () => {
  const files = [
    'src/components/reader/ReaderToolbar.tsx',
    'src/components/reader/ReaderSidebar.tsx',
    'src/components/reader/MemoryBridgeCard.tsx',
    'src/components/reader/ReaderViewport.tsx',
    'src/hooks/useSwipeGesture.ts',
    'src/screens/ReaderScreen.tsx',
  ];

  const bannedPatterns = [
    /return\s+(true|false)\s*;\s*\/\/\s*mock/i,
    /__test_mock__/i,
    /process\.env\.NODE_ENV\s*===\s*['"]test['"]\s*\?\s*true/i,
    /\/\*\s*bypass\s*\*\//i,
    /eval\(/i,
  ];

  for (const file of files) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf-8');
    for (const pattern of bannedPatterns) {
      assert.ok(!pattern.test(code), `Banned pattern ${pattern} found in ${file}`);
    }
  }
});

// Run async tests
(async () => {
  await itAsync('Gestures lasting >= 350ms (deliberate drag/pan) are ABORTED', async () => {
    let leftTriggered = false;

    const handlers = runHook(() =>
      useSwipeGesture({
        onSwipeLeft: () => { leftTriggered = true; },
      }, 50)
    );

    handlers.onTouchStart({
      touches: [{ clientX: 200, clientY: 100 }],
    });

    // Wait 360ms to exceed duration threshold
    await new Promise((resolve) => setTimeout(resolve, 360));

    handlers.onTouchEnd({
      touches: [],
      changedTouches: [{ clientX: 50, clientY: 100 }],
    });

    assert.strictEqual(leftTriggered, false, 'Gestures >= 350ms must be aborted');
  });

  console.log('\n=============================================');
  console.log(`M1 Forensic Verification Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('=============================================');

  if (testsFailed > 0) {
    console.error('❌ INTEGRITY VIOLATION DETECTED');
    process.exit(1);
  } else {
    console.log('🎉 ALL FORENSIC CHECKS PASSED: VERDICT CLEAN');
    process.exit(0);
  }
})();
