import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Challenger 1 Empirical Stress Test Suite (M2 Navigation & Touch Targets)...\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Reason: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// Part 1: Navigation Mutual Exclusion State Machine & Transition Stress Test
// -----------------------------------------------------------------------------
console.log('--- Part 1: Navigation Mutual Exclusion State Transitions ---');

class NavigationController {
  constructor() {
    this.menuOpen = false;
    this.avatarMenuOpen = false;
  }

  // Exact implementation from Navigation.tsx lines 36-54
  toggleMenu() {
    // setMenuOpen((prev) => { const next = !prev; if (next) setAvatarMenuOpen(false); return next; })
    const next = !this.menuOpen;
    if (next) {
      this.avatarMenuOpen = false;
    }
    this.menuOpen = next;
  }

  toggleAvatarMenu() {
    // setAvatarMenuOpen((prev) => { const next = !prev; if (next) setMenuOpen(false); return next; })
    const next = !this.avatarMenuOpen;
    if (next) {
      this.menuOpen = false;
    }
    this.avatarMenuOpen = next;
  }

  handleClickOutside() {
    this.avatarMenuOpen = false;
  }

  handleRouteChange() {
    this.menuOpen = false;
    this.avatarMenuOpen = false;
  }

  handleEscapeKey() {
    this.menuOpen = false;
    this.avatarMenuOpen = false;
  }

  assertInvariant() {
    assert(!(this.menuOpen && this.avatarMenuOpen), 'Invariant Violation: menuOpen and avatarMenuOpen cannot both be true');
  }
}

runTest('Initial state has both menus closed', () => {
  const nav = new NavigationController();
  assert.strictEqual(nav.menuOpen, false);
  assert.strictEqual(nav.avatarMenuOpen, false);
  nav.assertInvariant();
});

runTest('Transition: menuOpen -> open avatarMenu -> menuOpen closed', () => {
  const nav = new NavigationController();
  nav.toggleMenu(); // open menu
  assert.strictEqual(nav.menuOpen, true);
  assert.strictEqual(nav.avatarMenuOpen, false);
  nav.assertInvariant();

  nav.toggleAvatarMenu(); // open avatar menu while menu is open
  assert.strictEqual(nav.menuOpen, false, 'menuOpen must be closed');
  assert.strictEqual(nav.avatarMenuOpen, true, 'avatarMenuOpen must be open');
  nav.assertInvariant();
});

runTest('Transition: avatarMenuOpen -> open menu -> avatarMenu closed', () => {
  const nav = new NavigationController();
  nav.toggleAvatarMenu(); // open avatar menu
  assert.strictEqual(nav.menuOpen, false);
  assert.strictEqual(nav.avatarMenuOpen, true);
  nav.assertInvariant();

  nav.toggleMenu(); // open menu while avatar is open
  assert.strictEqual(nav.menuOpen, true, 'menuOpen must be open');
  assert.strictEqual(nav.avatarMenuOpen, false, 'avatarMenuOpen must be closed');
  nav.assertInvariant();
});

runTest('Closing active menu leaves alternate menu closed', () => {
  const nav = new NavigationController();
  nav.toggleMenu();
  nav.toggleMenu(); // close
  assert.strictEqual(nav.menuOpen, false);
  assert.strictEqual(nav.avatarMenuOpen, false);

  nav.toggleAvatarMenu();
  nav.toggleAvatarMenu(); // close
  assert.strictEqual(nav.menuOpen, false);
  assert.strictEqual(nav.avatarMenuOpen, false);
});

runTest('Route change closes all open menus', () => {
  const nav = new NavigationController();
  nav.toggleMenu();
  nav.handleRouteChange();
  assert.strictEqual(nav.menuOpen, false);
  assert.strictEqual(nav.avatarMenuOpen, false);

  nav.toggleAvatarMenu();
  nav.handleRouteChange();
  assert.strictEqual(nav.menuOpen, false);
  assert.strictEqual(nav.avatarMenuOpen, false);
});

runTest('Escape key closes all open menus', () => {
  const nav = new NavigationController();
  nav.toggleMenu();
  nav.handleEscapeKey();
  assert.strictEqual(nav.menuOpen, false);
  assert.strictEqual(nav.avatarMenuOpen, false);

  nav.toggleAvatarMenu();
  nav.handleEscapeKey();
  assert.strictEqual(nav.menuOpen, false);
  assert.strictEqual(nav.avatarMenuOpen, false);
});

runTest('Click outside closes avatarMenu without affecting menuOpen', () => {
  const nav = new NavigationController();
  nav.toggleAvatarMenu();
  nav.handleClickOutside();
  assert.strictEqual(nav.avatarMenuOpen, false);
  assert.strictEqual(nav.menuOpen, false);
});

runTest('Adversarial Fuzzing: 50,000 random actions preserve mutual exclusion invariant', () => {
  const nav = new NavigationController();
  const actions = ['toggleMenu', 'toggleAvatarMenu', 'handleClickOutside', 'handleRouteChange', 'handleEscapeKey'];
  
  for (let i = 0; i < 50000; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    nav[action]();
    nav.assertInvariant();
  }
  assert.ok(true, '50,000 actions completed with zero invariant violations');
});

// -----------------------------------------------------------------------------
// Part 2: Touch Target Geometry Verification on Mobile (WCAG 2.5.5)
// -----------------------------------------------------------------------------
console.log('\n--- Part 2: Mobile Touch Target Geometry Verification (WCAG 2.5.5) ---');

const navSource = fs.readFileSync('src/components/Navigation.tsx', 'utf-8');
const cssSource = fs.readFileSync('src/index.css', 'utf-8');

runTest('Navigation.tsx specifies minWidth >= 44px and minHeight >= 44px', () => {
  const match = navSource.match(/className="mobile-menu-btn"[\s\S]*?style=\{\{([\s\S]*?)\}\}/);
  assert(match, 'mobile-menu-btn style block found');
  const style = match[1];
  
  const minWidthMatch = style.match(/minWidth:\s*'(\d+)px'/);
  const minHeightMatch = style.match(/minHeight:\s*'(\d+)px'/);
  assert(minWidthMatch, 'minWidth defined');
  assert(minHeightMatch, 'minHeight defined');
  
  const minWidth = parseInt(minWidthMatch[1], 10);
  const minHeight = parseInt(minHeightMatch[1], 10);
  
  assert(minWidth >= 44, `minWidth (${minWidth}px) must be >= 44px`);
  assert(minHeight >= 44, `minHeight (${minHeight}px) must be >= 44px`);
});

runTest('src/index.css enforces min-width >= 44px and min-height >= 44px at <= 768px', () => {
  const mediaBlock = cssSource.match(/@media\s*\(max-width:\s*768px\)[\s\S]*?\.mobile-menu-btn\s*\{([\s\S]*?)\}/);
  assert(mediaBlock, '.mobile-menu-btn found in 768px media block');
  const rules = mediaBlock[1];
  
  const wMatch = rules.match(/min-width:\s*(\d+)px/);
  const hMatch = rules.match(/min-height:\s*(\d+)px/);
  assert(wMatch, 'min-width rule found');
  assert(hMatch, 'min-height rule found');
  
  const minWidth = parseInt(wMatch[1], 10);
  const minHeight = parseInt(hMatch[1], 10);
  
  assert(minWidth >= 44, `CSS min-width (${minWidth}px) must be >= 44px`);
  assert(minHeight >= 44, `CSS min-height (${minHeight}px) must be >= 44px`);
});

// -----------------------------------------------------------------------------
// Part 3: Live Browser Verification via Chromium / Edge Engine
// -----------------------------------------------------------------------------
console.log('\n--- Part 3: Live Browser Engine Verification (Edge / Chromium) ---');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (fs.existsSync(edgePath)) {
  // Create a minimal reproduction HTML file matching project's exact CSS and component markup
  const testHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.mobile-menu-btn {
  display: none !important;
}
@media (max-width: 768px) {
  .desktop-nav {
    display: none !important;
  }
  .mobile-menu-btn {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 10px;
  }
}
</style>
</head>
<body>
<nav class="desktop-nav">Desktop Nav</nav>
<button class="mobile-menu-btn" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 10px; min-width: 44px; min-height: 44px; display: inline-flex; alignItems: center; justifyContent: center;">
  <svg width="24" height="24"></svg>
</button>
<div id="desktop-eval"></div>
<div id="mobile-eval"></div>
<script>
const btn = document.querySelector('.mobile-menu-btn');
const cs = window.getComputedStyle(btn);
const rect = btn.getBoundingClientRect();
document.getElementById('desktop-eval').textContent = JSON.stringify({
  display: cs.display,
  width: rect.width,
  height: rect.height,
  visible: btn.offsetParent !== null
});
</script>
</body>
</html>`;

  const tempHtmlPath = path.resolve('temp-nav-browser-test.html');
  fs.writeFileSync(tempHtmlPath, testHtml);

  try {
    // Run Edge in headless mode at desktop viewport (1280x800)
    const dumpDesktop = execSync(
      `& "${edgePath}" --headless=new --window-size=1280,800 --dump-dom "file:///${tempHtmlPath.replace(/\\/g, '/')}"`,
      { shell: 'powershell', encoding: 'utf-8' }
    );

    const desktopMatch = dumpDesktop.match(/<div id="desktop-eval">([\s\S]*?)<\/div>/);
    const desktopResult = desktopMatch ? JSON.parse(desktopMatch[1]) : null;

    runTest('CRITICAL REGRESSION CHECK: Mobile menu button must be hidden (display: none) on desktop viewports (> 768px)', () => {
      assert(desktopResult, 'Desktop evaluation parsed from Edge DOM dump');
      assert.strictEqual(
        desktopResult.display,
        'none',
        `REGRESSION CONFIRMED: .mobile-menu-btn computed display on 1280px desktop is "${desktopResult.display}" (visible: ${desktopResult.visible}) because inline style 'display: inline-flex' overrides stylesheet '.mobile-menu-btn { display: none; }' without !important`
      );
    });

    // Run Edge in headless mode at mobile viewport (375x667)
    const dumpMobile = execSync(
      `& "${edgePath}" --headless=new --window-size=375,667 --dump-dom "file:///${tempHtmlPath.replace(/\\/g, '/')}"`,
      { shell: 'powershell', encoding: 'utf-8' }
    );

    const mobileMatch = dumpMobile.match(/<div id="desktop-eval">([\s\S]*?)<\/div>/);
    const mobileResult = mobileMatch ? JSON.parse(mobileMatch[1]) : null;

    runTest('Mobile viewport (375px): button bounding box meets WCAG 2.5.5 >= 44x44px', () => {
      assert(mobileResult, 'Mobile evaluation parsed from Edge DOM dump');
      assert(mobileResult.width >= 44, `Computed width (${mobileResult.width}px) must be >= 44px`);
      assert(mobileResult.height >= 44, `Computed height (${mobileResult.height}px) must be >= 44px`);
    });

  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }
} else {
  console.warn('Edge binary not found, skipping headless Edge tests');
}

console.log('\n======================================================');
console.log(`Test Execution Summary: ${totalTests} tests run.`);
console.log(`  Passed: ${passedTests}`);
console.log(`  Failed: ${failedTests}`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
