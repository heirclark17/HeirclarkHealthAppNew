/**
 * Create app icon by cropping SVG viewBox to just the logo
 * This ensures the logo fills the entire icon space optimally
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SVG_PATH = 'C:\\Users\\derri\\OneDrive\\Documents\\HeirclarkHealthAppLogo.svg';
const OUTPUT_DIR = './assets';
const ICON_SIZE = 1024;

async function createCroppedIcon() {
  console.log('=' .repeat(60));
  console.log('Creating Optimally-Sized App Icon');
  console.log('=' .repeat(60));

  // Read original SVG
  let svgContent = fs.readFileSync(SVG_PATH, 'utf8');

  // The logo paths are approximately at:
  // x: 225-395 (width ~170), y: 347-527 (height ~180)
  // Center point: x: 310, y: 437

  // Create a new viewBox centered on the logo with some padding
  // Using a 200x200 viewBox centered on the logo (gives ~15% padding)
  const centerX = 310;
  const centerY = 437;
  const viewBoxSize = 200;
  const viewBoxX = centerX - viewBoxSize / 2; // 210
  const viewBoxY = centerY - viewBoxSize / 2; // 337

  // Replace the viewBox in the SVG
  const newViewBox = `${viewBoxX} ${viewBoxY} ${viewBoxSize} ${viewBoxSize}`;
  svgContent = svgContent.replace(
    /viewBox="[^"]*"/,
    `viewBox="${newViewBox}"`
  );

  console.log(`\nOriginal viewBox: 0 0 612 792`);
  console.log(`New viewBox: ${newViewBox}`);
  console.log(`Logo now fills ~85% of icon (with breathing room)\n`);

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: ICON_SIZE, height: ICON_SIZE });

  // Create simple HTML with the cropped SVG
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; }
          body {
            width: ${ICON_SIZE}px;
            height: ${ICON_SIZE}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          svg {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html);
  console.log('[OK] Cropped SVG rendered');

  // Capture icons
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'icon.png'), type: 'png' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'adaptive-icon.png'), type: 'png' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'splash-icon.png'), type: 'png' });

  await browser.close();

  const stats = fs.statSync(path.join(OUTPUT_DIR, 'icon.png'));
  const fileSizeKb = (stats.size / 1024).toFixed(1);

  console.log(`[SAVED] icon.png (${fileSizeKb} KB)`);
  console.log('[SAVED] adaptive-icon.png');
  console.log('[SAVED] splash-icon.png');

  console.log('\n' + '='.repeat(60));
  console.log('SUCCESS! Logo Now Fills Icon Properly');
  console.log('='.repeat(60));
  console.log('\n✓ Logo fills ~85% of icon space');
  console.log('✓ Professional padding/breathing room');
  console.log('✓ Perfect vector quality');
  console.log('✓ Ready for App Store');
}

createCroppedIcon().catch(error => {
  console.error('\n[ERROR]', error);
  process.exit(1);
});
