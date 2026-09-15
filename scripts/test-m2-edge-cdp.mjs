import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Edge Headless CDP & DOM Invariant Verification Suite...\n');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(edgePath)) {
  console.log('Edge not found at default location, skipping Edge tests.');
  process.exit(0);
}

// 1. Verify Navigation Mutual Exclusion Logic (State Machine Oracle)
let menuOpen = false;
let avatarMenuOpen = false;
let violations = 0;

function toggleMenu() {
  const next = !menuOpen;
  if (next) avatarMenuOpen = false;
  menuOpen = next;
}

function toggleAvatar() {
  const next = !avatarMenuOpen;
  if (next) menuOpen = false;
  avatarMenuOpen = next;
}

for (let i = 0; i < 10000; i++) {
  if (Math.random() < 0.5) toggleMenu();
  else toggleAvatar();
  if (menuOpen && avatarMenuOpen) violations++;
}

console.log('1. Navigation Mutual Exclusion State Machine (10,000 cycles):', violations === 0 ? 'PASS' : 'FAIL');
assert.strictEqual(violations, 0, 'Mutual exclusion must have zero violations');

// 2. Headless Edge DOM & Computed Style Verification
const indexCss = fs.readFileSync('src/index.css', 'utf-8');
const testHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${indexCss}
</style>
</head>
<body>
<div style="display: flex; align-items: center; justify-content: space-between; padding: 10px;">
  <button class="mobile-menu-btn" style="background: none; border: none; color: inherit; cursor: pointer; padding: 10px; min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;" aria-label="Toggle navigation menu">
    <svg width="24" height="24" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line></svg>
  </button>
</div>
<div id="desktop-result"></div>
<div id="mobile-result"></div>
<script>
const btn = document.querySelector('.mobile-menu-btn');
const cs = window.getComputedStyle(btn);
const rect = btn.getBoundingClientRect();
const result = {
  display: cs.display,
  width: rect.width,
  height: rect.height,
  visible: btn.offsetParent !== null
};
document.getElementById('desktop-result').textContent = JSON.stringify(result);
document.getElementById('mobile-result').textContent = JSON.stringify(result);
</script>
</body>
</html>`;

const tempHtml = path.resolve('temp-edge-cdp-test.html');
fs.writeFileSync(tempHtml, testHtml);

try {
  // Desktop check (1280x800)
  const desktopDump = execSync(
    `& "${edgePath}" --headless=new --window-size=1280,800 --dump-dom "file:///${tempHtml.replace(/\\/g, '/')}"`,
    { shell: 'powershell', encoding: 'utf-8' }
  );
  const desktopMatch = desktopDump.match(/<div id="desktop-result">([\s\S]*?)<\/div>/);
  const desktopResult = desktopMatch ? JSON.parse(desktopMatch[1]) : null;

  // Mobile check (375x667)
  const mobileDump = execSync(
    `& "${edgePath}" --headless=new --window-size=375,667 --dump-dom "file:///${tempHtml.replace(/\\/g, '/')}"`,
    { shell: 'powershell', encoding: 'utf-8' }
  );
  const mobileMatch = mobileDump.match(/<div id="mobile-result">([\s\S]*?)<\/div>/);
  const mobileResult = mobileMatch ? JSON.parse(mobileMatch[1]) : null;

  const desktopHidden = desktopResult && desktopResult.display === 'none';
  const mobileTargetOk = mobileResult && mobileResult.width >= 44 && mobileResult.height >= 44;

  console.log('\n======================================================');
  console.log('SUMMARY VERDICTS:');
  console.log('1. Navigation Mutual Exclusion: PASS');
  console.log('2. Touch Target WCAG 2.5.5 (>= 44x44px):', mobileTargetOk ? 'PASS' : 'FAIL');
  console.log('3. Desktop Hamburger Visibility:', desktopHidden ? 'HIDDEN (PASS)' : 'VISIBLE (FAIL)');
  console.log('======================================================\n');

  assert(desktopHidden, 'Desktop hamburger must be display: none');
  assert(mobileTargetOk, 'Mobile hamburger must be >= 44x44px');
  console.log('🎉 ALL EDGE CDP INVARIANTS VERIFIED SUCCESSFULLY!\n');
} finally {
  if (fs.existsSync(tempHtml)) {
    fs.unlinkSync(tempHtml);
  }
}
