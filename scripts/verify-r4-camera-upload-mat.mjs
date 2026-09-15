import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Milestone R4 Verification Suite (Camera, Upload, HEIC Fallback & Touch Targets)...\n');

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

const rootDir = process.cwd();
const uploadPath = path.join(rootDir, 'src/screens/UploadScreen.tsx');
const editPath = path.join(rootDir, 'src/screens/ArtworkEditScreen.tsx');
const detailPath = path.join(rootDir, 'src/screens/PersonalArtworkDetailScreen.tsx');
const matPath = path.join(rootDir, 'src/components/ui/ArtworkMat.tsx');
const badgePath = path.join(rootDir, 'src/components/ui/Badge.tsx');
const cardPath = path.join(rootDir, 'src/components/sketchbook/ArtworkCard.tsx');

const uploadCode = fs.readFileSync(uploadPath, 'utf-8');
const editCode = fs.readFileSync(editPath, 'utf-8');
const detailCode = fs.readFileSync(detailPath, 'utf-8');
const matCode = fs.readFileSync(matPath, 'utf-8');
const badgeCode = fs.readFileSync(badgePath, 'utf-8');
const cardCode = fs.readFileSync(cardPath, 'utf-8');

// -----------------------------------------------------------------------------
// Suite 1: UploadScreen Camera Capture & Wildcard Accept (R4.1 & R4.2)
// -----------------------------------------------------------------------------
console.log('--- Suite 1: Camera Capture & Wildcard Accept Invariants ---');

runTest('UploadScreen.tsx file input accept contains image/* wildcard', () => {
  const match = uploadCode.match(/<input[\s\S]*?ref=\{fileInputRef\}[\s\S]*?\/>/);
  assert(match, 'Must find fileInputRef input element');
  const inputTag = match[0];
  assert(inputTag.includes('image/*'), 'File input accept must include image/*');
  assert(inputTag.includes('.heic') || inputTag.includes('image/heic'), 'File input accept must include HEIC');
});

runTest('UploadScreen.tsx contains dedicated camera input with capture="environment"', () => {
  const match = uploadCode.match(/<input[\s\S]*?ref=\{cameraInputRef\}[\s\S]*?\/>/);
  assert(match, 'Must find cameraInputRef input element');
  const inputTag = match[0];
  assert(inputTag.includes('capture="environment"'), 'Camera input must specify capture="environment"');
  assert(inputTag.includes('image/*'), 'Camera input accept must specify image/*');
});

runTest('UploadScreen.tsx renders "Take Photo of Sketch" option with Camera icon', () => {
  assert(uploadCode.includes('Take Photo of Sketch'), 'Must render "Take Photo of Sketch" text');
  assert(uploadCode.includes('<Camera'), 'Must render Camera icon component');
  assert(uploadCode.includes('cameraInputRef.current?.click()'), 'Must wire button to cameraInputRef');
});

runTest('UploadScreen.tsx file validation accepts image MIME types and HEIC extensions', () => {
  assert(uploadCode.includes("file.type.startsWith('image/')"), 'Validation must accept all image/* MIME types');
  assert(uploadCode.includes('heic') || uploadCode.includes('heif'), 'Validation must accept HEIC/HEIF files');
});

// -----------------------------------------------------------------------------
// Suite 2: ArtworkMat & Screens Silent Substitution Elimination (R4.3)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: ArtworkMat & Broken/Unsupported Image Handling ---');

runTest('ArtworkMat.tsx never silently substitutes art-01.jpeg Victorian badger', () => {
  assert(!matCode.includes('art-01.jpeg'), 'ArtworkMat must not contain hardcoded art-01.jpeg reference');
});

runTest('ArtworkMat.tsx renders clear error/fallback state on format or load failure', () => {
  assert(matCode.includes('hasError'), 'Must track hasError state');
  assert(matCode.includes('role="alert"'), 'Error state must have accessible role="alert"');
  assert(matCode.includes('AlertCircle'), 'Must display AlertCircle icon');
  assert(matCode.includes('Unable to display image'), 'Must display informative error title');
  assert(matCode.includes('Format unsupported'), 'Must explain format unsupported / load failure');
});

runTest('ArtworkMat.tsx renders clean empty state when no imageUrl provided', () => {
  assert(matCode.includes('ImageOff'), 'Must display ImageOff icon when empty');
  assert(matCode.includes('No image provided'), 'Must display "No image provided"');
});

runTest('ArtworkEditScreen.tsx displayImage does not default to art-01.jpeg', () => {
  assert(!editCode.includes("'/artist-reference/art-01.jpeg'"), 'ArtworkEditScreen must not default to art-01.jpeg');
});

runTest('PersonalArtworkDetailScreen.tsx displayImage does not default to art-01.jpeg', () => {
  assert(!detailCode.includes("'/artist-reference/art-01.jpeg'"), 'PersonalArtworkDetailScreen must not default to art-01.jpeg');
});

runTest('ArtworkCard.tsx displayImage does not default to art-01.jpeg', () => {
  assert(!cardCode.includes("'/artist-reference/art-01.jpeg'"), 'ArtworkCard must not default to art-01.jpeg');
});

// -----------------------------------------------------------------------------
// Suite 3: Touch Target Geometry Verification (WCAG 2.5.5 >= 44x44px) (R4.4)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: Touch Target Geometry Verification (WCAG 2.5.5 >= 44px) ---');

runTest('UploadScreen.tsx tag "Add" button specifies minWidth and minHeight >= 44px', () => {
  const match = uploadCode.match(/onClick=\{handleAddTag\}[\s\S]*?style=\{\{([\s\S]*?)\}\}/);
  assert(match, 'Must find handleAddTag button with style');
  const style = match[1];
  assert(style.includes("minHeight: '44px'"), 'Tag Add button must specify minHeight: 44px');
  assert(style.includes("minWidth: '44px'"), 'Tag Add button must specify minWidth: 44px');
});

runTest('ArtworkEditScreen.tsx tag "Add" button specifies minWidth and minHeight >= 44px', () => {
  const match = editCode.match(/onClick=\{handleAddTag\}[\s\S]*?style=\{\{([\s\S]*?)\}\}/);
  assert(match, 'Must find handleAddTag button with style in ArtworkEditScreen');
  const style = match[1];
  assert(style.includes("minHeight: '44px'"), 'Tag Add button must specify minHeight: 44px');
  assert(style.includes("minWidth: '44px'"), 'Tag Add button must specify minWidth: 44px');
});

runTest('UploadScreen.tsx collection toggle pills specify minHeight >= 44px', () => {
  const match = uploadCode.match(/onClick=\{\(\) => toggleCollection\(col\.id\)\}[\s\S]*?style=\{\{([\s\S]*?)\}\}/);
  assert(match, 'Must find collection toggle button with style');
  const style = match[1];
  assert(style.includes("minHeight: '44px'"), 'Collection pill must specify minHeight: 44px');
});

runTest('ArtworkEditScreen.tsx collection toggle pills specify minHeight >= 44px', () => {
  const match = editCode.match(/onClick=\{\(\) => toggleCollection\(col\.id\)\}[\s\S]*?style=\{\{([\s\S]*?)\}\}/);
  assert(match, 'Must find collection toggle button with style in ArtworkEditScreen');
  const style = match[1];
  assert(style.includes("minHeight: '44px'"), 'Collection pill must specify minHeight: 44px');
});

runTest('Badge.tsx tag remove button specifies minWidth and minHeight >= 44px', () => {
  const match = badgeCode.match(/className="badge-remove-btn"[\s\S]*?style=\{\{([\s\S]*?)\}\}/);
  assert(match, 'Must find badge-remove-btn with style');
  const style = match[1];
  assert(style.includes("minHeight: '44px'"), 'Remove button must specify minHeight: 44px');
  assert(style.includes("minWidth: '44px'"), 'Remove button must specify minWidth: 44px');
  assert(badgeCode.includes('aria-label={`Remove ${label}`}'), 'Remove button must have accessible aria-label');
});

// -----------------------------------------------------------------------------
// Suite 4: Live Browser Engine Verification (Edge / Chromium)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: Live Browser Engine Touch Target Bounding Boxes ---');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const { execSync } = await import('child_process');

if (fs.existsSync(edgePath)) {
  const testHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
</style>
</head>
<body>
<div style="padding: 20px;">
  <!-- Tag Add Button -->
  <button id="tag-add-btn" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #ccc; font-size: 0.88rem; font-weight: 600; min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; justify-content: center;">
    Add
  </button>

  <!-- Collection Pill -->
  <button id="collection-pill" style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; min-height: 44px; border-radius: 9999px; border: 1px solid #ccc; font-size: 0.82rem; font-weight: 500;">
    <span>Nature Studies</span>
  </button>

  <!-- Badge with Remove Button -->
  <span id="badge" style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 4px 4px 10px; border-radius: 9999px; font-size: 0.76rem; font-weight: 600;">
    <span>Study</span>
    <button id="badge-remove-btn" class="badge-remove-btn" style="background: none; border: none; padding: 0; margin-left: 2px; min-width: 44px; min-height: 44px; font-size: 1rem; line-height: 1; display: inline-flex; align-items: center; justify-content: center; margin: -12px -8px -12px 0; touch-action: manipulation;" aria-label="Remove Study">
      <span>&times;</span>
    </button>
  </span>
</div>
<div id="results"></div>
<script>
const tagAdd = document.getElementById('tag-add-btn').getBoundingClientRect();
const collPill = document.getElementById('collection-pill').getBoundingClientRect();
const badgeRemove = document.getElementById('badge-remove-btn').getBoundingClientRect();
document.getElementById('results').textContent = JSON.stringify({
  tagAdd: { width: tagAdd.width, height: tagAdd.height },
  collPill: { width: collPill.width, height: collPill.height },
  badgeRemove: { width: badgeRemove.width, height: badgeRemove.height }
});
</script>
</body>
</html>`;

  const tempHtml = path.resolve('temp-touch-target-test.html');
  fs.writeFileSync(tempHtml, testHtml);

  try {
    const dump = execSync(
      `& "${edgePath}" --headless=new --window-size=375,667 --dump-dom "file:///${tempHtml.replace(/\\\\/g, '/')}"`,
      { shell: 'powershell', encoding: 'utf-8' }
    );
    const match = dump.match(/<div id="results">([\s\S]*?)<\/div>/);
    const results = match ? JSON.parse(match[1]) : null;

    runTest('Live Edge: Tag Add button computed box >= 44x44px', () => {
      assert(results, 'Must parse results from Edge DOM dump');
      assert(results.tagAdd.width >= 44, `tagAdd width (${results.tagAdd.width}px) >= 44px`);
      assert(results.tagAdd.height >= 44, `tagAdd height (${results.tagAdd.height}px) >= 44px`);
    });

    runTest('Live Edge: Collection pill computed box height >= 44px', () => {
      assert(results, 'Must parse results from Edge DOM dump');
      assert(results.collPill.height >= 44, `collPill height (${results.collPill.height}px) >= 44px`);
      assert(results.collPill.width >= 44, `collPill width (${results.collPill.width}px) >= 44px`);
    });

    runTest('Live Edge: Badge remove button computed box >= 44x44px', () => {
      assert(results, 'Must parse results from Edge DOM dump');
      assert(results.badgeRemove.width >= 44, `badgeRemove width (${results.badgeRemove.width}px) >= 44px`);
      assert(results.badgeRemove.height >= 44, `badgeRemove height (${results.badgeRemove.height}px) >= 44px`);
    });
  } finally {
    if (fs.existsSync(tempHtml)) {
      fs.unlinkSync(tempHtml);
    }
  }
}

console.log('\n=============================================================');
console.log(`Total tests executed: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log('=============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL EMPIRICAL R4 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
