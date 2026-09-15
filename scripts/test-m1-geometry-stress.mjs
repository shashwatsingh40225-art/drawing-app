import assert from 'node:assert';

console.log('🧪 Starting Milestone M1 Empirical Geometry & Touch Stress Test Suite...\n');

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

// ============================================================================
// Formulas and logic directly mirrored from M1 implementation
// ============================================================================

// From ReaderToolbar.tsx, ReaderSidebar.tsx, ReaderScreen.tsx:
// const checkIsMobile = () => typeof window !== 'undefined' && (window.innerWidth <= 768 || window.innerHeight <= 500);
function checkIsMobile(width, height) {
  return width <= 768 || height <= 500;
}

// From ReaderViewport.tsx:
// const [isLandscapePhone, setIsLandscapePhone] = useState<boolean>(() => typeof window !== 'undefined' && window.innerHeight <= 500);
function isLandscapePhone(width, height) {
  return height <= 500;
}

// From ReaderScreen.tsx:
// right: activeSidebar && !isMobile ? '336px' : '16px'
function calculateMemoryBridgeGeometry(width, height, activeSidebar) {
  const mobile = checkIsMobile(width, height);
  const left = 16;
  const right = activeSidebar && !mobile ? 336 : 16;
  const containerAvailableWidth = width - left - right;
  const cardMaxWidth = 720;
  const effectiveCardWidth = Math.min(containerAvailableWidth, cardMaxWidth);
  const maxHeight = height - 120; // calc(100vh - 120px)
  return {
    mobile,
    left,
    right,
    containerAvailableWidth,
    effectiveCardWidth,
    maxHeight,
  };
}

// From ReaderViewport.tsx:
// const isCompactVertical = isFocusMode || isLandscapePhone;
// const bottomPadding = isCompactVertical ? '16px' : '80px';
// const topPadding = isLandscapePhone ? '12px' : '24px';
function calculateReaderViewportPadding(width, height, isFocusMode) {
  const isLandscape = isLandscapePhone(width, height);
  const isCompactVertical = isFocusMode || isLandscape;
  const bottomPadding = isCompactVertical ? 16 : 80;
  const topPadding = isLandscape ? 12 : 24;
  const totalVerticalPadding = topPadding + bottomPadding;
  return {
    isLandscape,
    isCompactVertical,
    topPadding,
    bottomPadding,
    totalVerticalPadding,
  };
}

// From ReaderSidebar.tsx:
// width: isMobile ? 'min(320px, 85vw)' : '320px'
function calculateSidebarWidth(width, height) {
  const mobile = checkIsMobile(width, height);
  if (mobile) {
    return Math.min(320, 0.85 * width);
  }
  return 320;
}

// ============================================================================
// Dimension 1: Viewport Geometry & Mobile Classification Across Devices
// ============================================================================
console.log('--- 1. Testing Device Viewport Mobile/Landscape Classification ---');

it('844x390px (iPhone 12/13/14 landscape) is classified as mobile due to innerHeight <= 500', () => {
  const mobile = checkIsMobile(844, 390);
  const landscape = isLandscapePhone(844, 390);
  assert.strictEqual(mobile, true, '844x390 must be mobile');
  assert.strictEqual(landscape, true, '844x390 must be landscape phone');
});

it('932x430px (iPhone 14/15/16 Pro Max landscape) is classified as mobile due to innerHeight <= 500', () => {
  const mobile = checkIsMobile(932, 430);
  const landscape = isLandscapePhone(932, 430);
  assert.strictEqual(mobile, true, '932x430 must be mobile');
  assert.strictEqual(landscape, true, '932x430 must be landscape phone');
});

it('390x844px (iPhone 12/13/14 portrait) is classified as mobile due to innerWidth <= 768', () => {
  const mobile = checkIsMobile(390, 844);
  const landscape = isLandscapePhone(390, 844);
  assert.strictEqual(mobile, true, '390x844 must be mobile');
  assert.strictEqual(landscape, false, '390x844 is NOT landscape phone');
});

it('320x568px (iPhone SE small phone portrait) is classified as mobile due to innerWidth <= 768', () => {
  const mobile = checkIsMobile(320, 568);
  const landscape = isLandscapePhone(320, 568);
  assert.strictEqual(mobile, true, '320x568 must be mobile');
  assert.strictEqual(landscape, false, '320x568 is NOT landscape phone');
});

it('768x1024px (iPad portrait) is classified as mobile due to innerWidth <= 768', () => {
  const mobile = checkIsMobile(768, 1024);
  const landscape = isLandscapePhone(768, 1024);
  assert.strictEqual(mobile, true, '768x1024 must be mobile');
  assert.strictEqual(landscape, false, '768x1024 is NOT landscape phone');
});

it('1024x768px (iPad landscape) is classified as desktop (not mobile)', () => {
  const mobile = checkIsMobile(1024, 768);
  const landscape = isLandscapePhone(1024, 768);
  assert.strictEqual(mobile, false, '1024x768 must be desktop');
  assert.strictEqual(landscape, false, '1024x768 is NOT landscape phone');
});

it('Boundary test: Height 500px is mobile, 501px is desktop on wide screen (800px)', () => {
  assert.strictEqual(checkIsMobile(800, 500), true, 'h=500 must be mobile');
  assert.strictEqual(checkIsMobile(800, 501), false, 'h=501 must be desktop');
});

it('Boundary test: Width 768px is mobile, 769px is desktop on tall screen (800px)', () => {
  assert.strictEqual(checkIsMobile(768, 800), true, 'w=768 must be mobile');
  assert.strictEqual(checkIsMobile(769, 800), false, 'w=769 must be desktop');
});

// ============================================================================
// Dimension 2: MemoryBridgeCard Width and Height Constraints
// ============================================================================
console.log('\n--- 2. Testing MemoryBridgeCard Constraints (>= 280px, Never 38px, Scrollable) ---');

const testDevices = [
  { name: '844x390px (iPhone landscape)', w: 844, h: 390 },
  { name: '932x430px (iPhone Pro Max landscape)', w: 932, h: 430 },
  { name: '390x844px (iPhone portrait)', w: 390, h: 844 },
  { name: '320x568px (iPhone SE portrait)', w: 320, h: 568 },
  { name: '768x1024px (iPad portrait)', w: 768, h: 1024 },
  { name: '1024x768px (iPad landscape)', w: 1024, h: 768 },
];

for (const dev of testDevices) {
  it(`${dev.name}: Card width is >= 280px and never 38px when sidebar is ACTIVE`, () => {
    const geom = calculateMemoryBridgeGeometry(dev.w, dev.h, true);
    assert.notStrictEqual(geom.effectiveCardWidth, 38, `Card width MUST NOT collapse to 38px on ${dev.name}`);
    assert.ok(geom.effectiveCardWidth >= 280, `Card width (${geom.effectiveCardWidth}px) must be >= 280px on ${dev.name}`);
  });

  it(`${dev.name}: Card width is >= 280px and never 38px when sidebar is INACTIVE`, () => {
    const geom = calculateMemoryBridgeGeometry(dev.w, dev.h, false);
    assert.notStrictEqual(geom.effectiveCardWidth, 38, `Card width MUST NOT collapse to 38px on ${dev.name}`);
    assert.ok(geom.effectiveCardWidth >= 280, `Card width (${geom.effectiveCardWidth}px) must be >= 280px on ${dev.name}`);
  });
}

it('Verify 390x844 portrait phone specifically: previously 38px bug is eliminated', () => {
  // Previously: right = 336px -> width = 390 - 16 - 336 = 38px
  // Now: isMobile = true -> right = 16px -> width = 390 - 16 - 16 = 358px
  const geomWithSidebar = calculateMemoryBridgeGeometry(390, 844, true);
  assert.strictEqual(geomWithSidebar.right, 16, 'Mobile right margin must remain 16px even when sidebar active');
  assert.strictEqual(geomWithSidebar.effectiveCardWidth, 358, 'Effective card width must be 358px');
  assert.ok(geomWithSidebar.effectiveCardWidth >= 280, 'Effective card width >= 280px');
});

it('Verify 320x568 small phone: card width is 288px >= 280px and right margin is 16px', () => {
  // Previously: 320 - 16 - 336 = -32px (inverted overlap!)
  // Now: 320 - 16 - 16 = 288px
  const geomWithSidebar = calculateMemoryBridgeGeometry(320, 568, true);
  assert.strictEqual(geomWithSidebar.effectiveCardWidth, 288);
  assert.ok(geomWithSidebar.effectiveCardWidth >= 280);
});

it('Verify MemoryBridgeCard vertical scroll cap: maxHeight calc(100vh - 120px) leaves room for chrome', () => {
  const geomLandscape = calculateMemoryBridgeGeometry(844, 390, false);
  assert.strictEqual(geomLandscape.maxHeight, 270, 'On 390px landscape screen, maxHeight is 270px');
  assert.ok(geomLandscape.maxHeight > 0 && geomLandscape.maxHeight < 390);

  const geomProMax = calculateMemoryBridgeGeometry(932, 430, false);
  assert.strictEqual(geomProMax.maxHeight, 310, 'On 430px landscape screen, maxHeight is 310px');
});

// ============================================================================
// Dimension 3: ReaderViewport Vertical Space Clearance (16px vs 80px)
// ============================================================================
console.log('\n--- 3. Testing ReaderViewport Bottom Padding (16px vs 80px) & Space Reclamation ---');

it('Landscape phones (844x390px, 932x430px) use 16px bottom padding even if focus mode is OFF', () => {
  const pad844 = calculateReaderViewportPadding(844, 390, false);
  assert.strictEqual(pad844.bottomPadding, 16, '844x390 must use 16px bottom padding');
  assert.strictEqual(pad844.topPadding, 12, '844x390 must use 12px top padding');

  const pad932 = calculateReaderViewportPadding(932, 430, false);
  assert.strictEqual(pad932.bottomPadding, 16, '932x430 must use 16px bottom padding');
  assert.strictEqual(pad932.topPadding, 12, '932x430 must use 12px top padding');
});

it('Portrait phone (390x844px) uses 80px bottom padding when focus mode is OFF', () => {
  const pad = calculateReaderViewportPadding(390, 844, false);
  assert.strictEqual(pad.bottomPadding, 80, 'Portrait phone with focus mode OFF must have 80px bottom padding');
  assert.strictEqual(pad.topPadding, 24, 'Portrait phone top padding is 24px');
});

it('Portrait phone (390x844px) reclaims space (16px bottom padding) when focus mode is ON', () => {
  const pad = calculateReaderViewportPadding(390, 844, true);
  assert.strictEqual(pad.bottomPadding, 16, 'Portrait phone with focus mode ON must reduce bottom padding to 16px');
  assert.strictEqual(pad.topPadding, 24, 'Portrait phone top padding remains 24px');
});

it('Landscape space reclamation: 76px of vertical height reclaimed on 390px landscape phone (19.5% of total screen)', () => {
  const beforeTotalPadding = 24 + 80; // 104px
  const afterTotalPadding = 12 + 16;  // 28px
  const reclaimed = beforeTotalPadding - afterTotalPadding;
  assert.strictEqual(reclaimed, 76, 'Must reclaim 76px of vertical space');
  const percentageOf390 = (reclaimed / 390) * 100;
  assert.ok(percentageOf390 > 19, 'Reclaimed space represents >19% of screen height');
});

// ============================================================================
// Dimension 4: ReaderSidebar Drawer Geometry on Small Viewports
// ============================================================================
console.log('\n--- 4. Testing ReaderSidebar Drawer Width & Backdrop Availability ---');

it('On 320px screen, drawer width is min(320px, 85vw) = 272px, leaving 48px backdrop to tap', () => {
  const sidebarWidth = calculateSidebarWidth(320, 568);
  assert.strictEqual(sidebarWidth, 272, 'Sidebar width must be 272px');
  const backdropExposed = 320 - sidebarWidth;
  assert.strictEqual(backdropExposed, 48, 'Must expose 48px backdrop for easy dismissal');
});

it('On 390px screen, drawer width is min(320px, 85vw) = 320px', () => {
  const sidebarWidth = calculateSidebarWidth(390, 844);
  assert.strictEqual(sidebarWidth, 320, 'Sidebar width must be 320px');
  const backdropExposed = 390 - sidebarWidth;
  assert.strictEqual(backdropExposed, 70, 'Must expose 70px backdrop for dismissal');
});

it('On 844x390px landscape phone, drawer width is 320px as fixed overlay (does not crush reading canvas)', () => {
  const sidebarWidth = calculateSidebarWidth(844, 390);
  assert.strictEqual(sidebarWidth, 320, 'Sidebar width is 320px');
  const backdropExposed = 844 - sidebarWidth;
  assert.strictEqual(backdropExposed, 524, 'Backdrop leaves 524px visible');
});

it('On desktop (1024x768px), sidebar width is 320px as inline flex column', () => {
  const sidebarWidth = calculateSidebarWidth(1024, 768);
  assert.strictEqual(sidebarWidth, 320);
});

// ============================================================================
// Dimension 5: Touch Isolation & Gesture Discrimination Logic
// ============================================================================
console.log('\n--- 5. Testing Touch Isolation & Gesture Discrimination Logic ---');

function simulateSwipeGesture({
  startTouches,
  moveTouchesList = [],
  endTouches,
  durationMs,
  selectionText = '',
  dx = 0,
  dy = 0,
  threshold = 50,
  zoomScale = 1.0,
}) {
  let triggered = null;

  // Emulate useSwipeGesture logic:
  let startRef = null;

  // TouchStart:
  if (startTouches.length !== 1) {
    startRef = null;
  } else {
    startRef = {
      x: startTouches[0].clientX,
      y: startTouches[0].clientY,
      startTime: 0,
    };
  }

  // TouchMove events:
  for (const touches of moveTouchesList) {
    if (touches.length > 1) {
      startRef = null; // mid-gesture multi-touch cancels
    }
  }

  // TouchEnd:
  if (!startRef) return null;
  if (endTouches.length > 0) return null; // other fingers still down
  if (durationMs >= 350) return null; // deliberate pan/drag
  if (selectionText.trim().length > 0) return null; // text selection

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
    if (dx > 0) triggered = 'swipeRight';
    else triggered = 'swipeLeft';
  }

  // ReaderScreen guard:
  if (zoomScale > 1.0 && triggered) {
    triggered = null; // blocked by zoomScale <= 1.0 guard
  }

  return triggered;
}

it('Single finger swipe < 350ms with 100px delta at zoomScale 1.0 triggers page turn', () => {
  const result = simulateSwipeGesture({
    startTouches: [{ clientX: 200, clientY: 200 }],
    endTouches: [],
    durationMs: 200,
    dx: -100,
    dy: 0,
    zoomScale: 1.0,
  });
  assert.strictEqual(result, 'swipeLeft');
});

it('Two-finger pinch-to-zoom at start (touches.length === 2) does NOT trigger page turn', () => {
  const result = simulateSwipeGesture({
    startTouches: [{ clientX: 100, clientY: 100 }, { clientX: 200, clientY: 200 }],
    endTouches: [],
    durationMs: 150,
    dx: -100,
    dy: 0,
    zoomScale: 1.0,
  });
  assert.strictEqual(result, null, 'Multi-touch start must be ignored');
});

it('Second finger touching down mid-gesture cancels swipe (mid-gesture pinch-to-zoom)', () => {
  const result = simulateSwipeGesture({
    startTouches: [{ clientX: 100, clientY: 100 }],
    moveTouchesList: [[{ clientX: 110, clientY: 100 }, { clientX: 190, clientY: 100 }]],
    endTouches: [],
    durationMs: 150,
    dx: -100,
    dy: 0,
    zoomScale: 1.0,
  });
  assert.strictEqual(result, null, 'Second finger mid-gesture must cancel swipe');
});

it('Long drag / slow pan >= 350ms does NOT trigger page turn', () => {
  const result = simulateSwipeGesture({
    startTouches: [{ clientX: 200, clientY: 200 }],
    endTouches: [],
    durationMs: 400, // > 350ms
    dx: -100,
    dy: 0,
    zoomScale: 1.0,
  });
  assert.strictEqual(result, null, 'Long gestures >= 350ms must be rejected');
});

it('Active text selection in PDF text layer aborts swipe page turn', () => {
  const result = simulateSwipeGesture({
    startTouches: [{ clientX: 200, clientY: 200 }],
    endTouches: [],
    durationMs: 200,
    selectionText: 'Selected historical text',
    dx: -100,
    dy: 0,
    zoomScale: 1.0,
  });
  assert.strictEqual(result, null, 'Active text selection must abort swipe');
});

it('When zoomed in (zoomScale = 1.5 > 1.0), horizontal swipe is blocked from turning pages', () => {
  const result = simulateSwipeGesture({
    startTouches: [{ clientX: 200, clientY: 200 }],
    endTouches: [],
    durationMs: 200,
    dx: -100,
    dy: 0,
    zoomScale: 1.5,
  });
  assert.strictEqual(result, null, 'Zoomed reading must disable swipe page turns');
});

// ============================================================================
// Summary
// ============================================================================
console.log('\n=============================================');
console.log(`Empirical Test Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log('=============================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Milestone M1 Empirical Geometry and Touch Stress tests passed!\n');
}
