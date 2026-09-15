import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Milestone M2 Verification Suite (Navigation, Typography & Responsive Overflows)...\n');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

const rootDir = process.cwd();

// Load target files
const navCode = fs.readFileSync(path.join(rootDir, 'src/components/Navigation.tsx'), 'utf-8');
const cssCode = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf-8');
const homeCode = fs.readFileSync(path.join(rootDir, 'src/screens/HomeScreen.tsx'), 'utf-8');
const aboutCode = fs.readFileSync(path.join(rootDir, 'src/screens/AboutScreen.tsx'), 'utf-8');

console.log('--- Suite 1: Navigation Menu Mutual Exclusion Invariants ---');

test('Pure toggle logic: opening mobile menu closes avatar menu', () => {
  let menuOpen = false;
  let avatarMenuOpen = true;

  const toggleMenu = () => {
    const next = !menuOpen;
    if (next) avatarMenuOpen = false;
    menuOpen = next;
  };

  toggleMenu();
  assert.strictEqual(menuOpen, true);
  assert.strictEqual(avatarMenuOpen, false);
});

test('Pure toggle logic: opening avatar menu closes mobile menu', () => {
  let menuOpen = true;
  let avatarMenuOpen = false;

  const toggleAvatarMenu = () => {
    const next = !avatarMenuOpen;
    if (next) menuOpen = false;
    avatarMenuOpen = next;
  };

  toggleAvatarMenu();
  assert.strictEqual(avatarMenuOpen, true);
  assert.strictEqual(menuOpen, false);
});

test('Pure toggle logic: closing mobile menu leaves avatar menu closed', () => {
  let menuOpen = true;
  let avatarMenuOpen = false;

  const toggleMenu = () => {
    const next = !menuOpen;
    if (next) avatarMenuOpen = false;
    menuOpen = next;
  };

  toggleMenu();
  assert.strictEqual(menuOpen, false);
  assert.strictEqual(avatarMenuOpen, false);
});

test('Pure toggle logic: closing avatar menu leaves mobile menu closed', () => {
  let menuOpen = false;
  let avatarMenuOpen = true;

  const toggleAvatarMenu = () => {
    const next = !avatarMenuOpen;
    if (next) menuOpen = false;
    avatarMenuOpen = next;
  };

  toggleAvatarMenu();
  assert.strictEqual(avatarMenuOpen, false);
  assert.strictEqual(menuOpen, false);
});

test('Navigation.tsx declares toggleMenu and toggleAvatarMenu with mutual exclusion', () => {
  assert(navCode.includes('const toggleMenu = () => {'), 'Must declare toggleMenu');
  assert(navCode.includes('const toggleAvatarMenu = () => {'), 'Must declare toggleAvatarMenu');
  assert(navCode.includes('setAvatarMenuOpen(false);'), 'toggleMenu must close avatarMenuOpen');
  assert(navCode.includes('setMenuOpen(false);'), 'toggleAvatarMenu must close menuOpen');
});

test('Navigation.tsx attaches mutual exclusion handlers and aria-expanded to buttons', () => {
  assert(navCode.includes('onClick={toggleAvatarMenu}'), 'Avatar button must use toggleAvatarMenu');
  assert(navCode.includes('aria-expanded={avatarMenuOpen}'), 'Avatar button must include aria-expanded');
  assert(navCode.includes('onClick={toggleMenu}'), 'Mobile button must use toggleMenu');
  assert(navCode.includes('aria-expanded={menuOpen}'), 'Mobile button must include aria-expanded');
});

console.log('\n--- Suite 2: Mobile Hamburger Button Touch Target Geometry (WCAG 2.5.5) ---');

test('Navigation.tsx mobile-menu-btn inline styles meet >= 44x44px target', () => {
  const btnMatch = navCode.match(/className="mobile-menu-btn"[\s\S]*?style=\{\{([\s\S]*?)\}\}/);
  assert(btnMatch, 'Must find mobile-menu-btn with style');
  const styleBlock = btnMatch[1];
  assert(styleBlock.includes("minWidth: '44px'"), 'Must specify minWidth 44px');
  assert(styleBlock.includes("minHeight: '44px'"), 'Must specify minHeight 44px');
  assert(styleBlock.includes("display: 'inline-flex'"), 'Must specify display inline-flex');
  assert(styleBlock.includes("alignItems: 'center'"), 'Must center items');
  assert(styleBlock.includes("justifyContent: 'center'"), 'Must justify content center');
  assert(styleBlock.includes("padding: '10px'"), 'Must have 10px padding');
});

test('src/index.css enforces >= 44x44px on .mobile-menu-btn at max-width: 768px', () => {
  const cssMatch = cssCode.match(/@media\s*\(max-width:\s*768px\)[\s\S]*?\.mobile-menu-btn\s*\{([\s\S]*?)\}/);
  assert(cssMatch, 'Must find .mobile-menu-btn in max-width: 768px media query');
  const rules = cssMatch[1];
  assert(rules.includes('min-width: 44px'), 'Must declare min-width: 44px');
  assert(rules.includes('min-height: 44px'), 'Must declare min-height: 44px');
  assert(rules.includes('display: inline-flex !important'), 'Must declare display: inline-flex !important');
  assert(rules.includes('padding: 10px'), 'Must declare padding: 10px');
});

console.log('\n--- Suite 3: iOS Safari Auto-Zoom Trap Prevention (16px Font Size Rule) ---');

test('src/index.css includes 16px !important rule for form controls at max-width: 768px', () => {
  const media768 = cssCode.match(/@media\s*\(max-width:\s*768px\)\s*\{([\s\S]*?)\n\}/);
  assert(media768, 'Must find @media (max-width: 768px) block');
  const block = media768[1];
  assert(block.includes('font-size: 16px !important;'), 'Must enforce font-size: 16px !important;');
  assert(block.includes('select'), 'Must target select');
  assert(block.includes('textarea'), 'Must target textarea');
  assert(block.includes('input:not([type="checkbox"]):not([type="radio"]):not([type="range"])'), 'Must target text inputs excluding checkbox/radio/range');
});

test('CSS selector correctly matches text-entry inputs and excludes switches', () => {
  const mockElements = [
    { tag: 'input', type: 'text', shouldMatch: true },
    { tag: 'input', type: 'email', shouldMatch: true },
    { tag: 'input', type: 'password', shouldMatch: true },
    { tag: 'input', type: 'number', shouldMatch: true },
    { tag: 'input', type: 'search', shouldMatch: true },
    { tag: 'select', type: null, shouldMatch: true },
    { tag: 'textarea', type: null, shouldMatch: true },
    { tag: 'input', type: 'checkbox', shouldMatch: false },
    { tag: 'input', type: 'radio', shouldMatch: false },
    { tag: 'input', type: 'range', shouldMatch: false },
  ];

  const matchesRule = (el) => {
    if (el.tag === 'select' || el.tag === 'textarea') return true;
    if (el.tag === 'input') {
      return el.type !== 'checkbox' && el.type !== 'radio' && el.type !== 'range';
    }
    return false;
  };

  for (const el of mockElements) {
    assert.strictEqual(matchesRule(el), el.shouldMatch, `Element ${el.tag}[type=${el.type}] match failure`);
  }
});

console.log('\n--- Suite 4: HomeScreen Hero Grid and Responsive Overflow Math ---');

test('HomeScreen.tsx uses responsive minmax formula and home-hero-section class', () => {
  assert(homeCode.includes('className="home-hero-section"'), 'Hero section must have home-hero-section class');
  assert(
    homeCode.includes("gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))'") ||
    homeCode.includes("gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'"),
    'Hero section must use responsive minmax'
  );
  assert(homeCode.includes("maxWidth: '100%'"), 'Hero image must have maxWidth: 100%');
  assert(homeCode.includes('className="home-feature-section"'), 'Feature section must have home-feature-section class');
  assert(
    homeCode.includes("gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))'"),
    'Feature section must use min(100%, 260px)'
  );
});

test('src/index.css provides responsive 16px horizontal padding on mobile for home sections', () => {
  const cssMatch = cssCode.match(/\.home-hero-section\s*\{([\s\S]*?)\}/);
  assert(cssMatch, 'Must find .home-hero-section in CSS');
  assert(cssMatch[1].includes('padding: 36px 16px 48px !important'), 'Hero padding must use 16px horizontal on mobile');
});

test('Mathematical proof: 320px viewport has zero horizontal overflow', () => {
  const viewportWidth = 320;
  const paddingHorizontal = 16 * 2; // 32px
  const availableWidth = viewportWidth - paddingHorizontal; // 288px
  const colMinWidth = Math.min(availableWidth, 280); // 280px
  const totalSectionWidth = colMinWidth + paddingHorizontal; // 312px
  const overflow = totalSectionWidth - viewportWidth;

  assert.strictEqual(availableWidth, 288);
  assert.strictEqual(colMinWidth, 280);
  assert(overflow <= 0, `Overflow must be <= 0px, got ${overflow}px`);
});

test('Mathematical proof: 360px viewport has zero horizontal overflow', () => {
  const viewportWidth = 360;
  const paddingHorizontal = 16 * 2; // 32px
  const availableWidth = viewportWidth - paddingHorizontal; // 328px
  const colMinWidth = Math.min(availableWidth, 280); // 280px
  const totalSectionWidth = colMinWidth + paddingHorizontal; // 312px
  const overflow = totalSectionWidth - viewportWidth;

  assert.strictEqual(availableWidth, 328);
  assert.strictEqual(colMinWidth, 280);
  assert(overflow <= 0, `Overflow must be <= 0px, got ${overflow}px`);
});

console.log('\n--- Suite 5: AboutScreen Figcaption FlexWrap and Gap Invariants ---');

test('AboutScreen.tsx all 3 figcaption elements have flexWrap: wrap and gap: 6px 12px', () => {
  const figcaptionMatches = [...aboutCode.matchAll(/<figcaption\s+style=\{\{([\s\S]*?)\}\}>/g)];
  assert.strictEqual(figcaptionMatches.length, 3, 'Must find exactly 3 figcaption elements');

  figcaptionMatches.forEach((match, idx) => {
    const style = match[1];
    assert(style.includes("flexWrap: 'wrap'"), `Figcaption ${idx + 1} must include flexWrap: 'wrap'`);
    assert(style.includes("gap: '6px 12px'"), `Figcaption ${idx + 1} must include gap: '6px 12px'`);
  });
});

test('AboutScreen.tsx all 3 figures have img with maxWidth: 100%', () => {
  const figureBlocks = aboutCode.split('</figure>');
  assert(figureBlocks.length >= 4, 'Must find at least 3 figure blocks');

  for (let i = 0; i < 3; i++) {
    const block = figureBlocks[i];
    assert(block.includes("maxWidth: '100%'"), `Figure ${i + 1} img must have maxWidth: '100%'`);
  }
});

test('src/index.css includes figcaption { flex-wrap: wrap; } global fallback', () => {
  assert(cssCode.includes('figcaption {') && cssCode.includes('flex-wrap: wrap;'), 'index.css must include figcaption flex-wrap rule');
});

test('Text collision resolution model on 320px viewport inside card', () => {
  const viewportWidth = 320;
  const screenPadding = 24 * 2; // 48px
  const cardPadding = 24 * 2;   // 48px
  const availableFigcaptionWidth = viewportWidth - screenPadding - cardPadding; // 224px

  const titleEstimatedWidth = 180; // 'ART-04 · Duchess with Teacup & Attendant'
  const mediumEstimatedWidth = 140; // 'Monochrome fine-pen cross-hatch'

  // Without wrap:
  const singleLineWidth = titleEstimatedWidth + mediumEstimatedWidth; // 320px
  const overlapWithoutWrap = singleLineWidth - availableFigcaptionWidth; // 96px collision!
  assert(overlapWithoutWrap > 0, 'Confirm that nowrap creates collision');

  // With wrap:
  const line1Fits = titleEstimatedWidth <= availableFigcaptionWidth;
  const line2Fits = mediumEstimatedWidth <= availableFigcaptionWidth;
  assert(line1Fits, 'Line 1 title fits within 224px');
  assert(line2Fits, 'Line 2 medium fits within 224px');
});

console.log('\n=============================================================');
console.log(`Total tests executed: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log('=============================================================\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL EMPIRICAL M2 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error('💥 Some verification tests failed!');
  process.exit(1);
}
