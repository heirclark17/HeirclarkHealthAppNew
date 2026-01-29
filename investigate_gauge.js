const { chromium } = require('playwright');

async function investigateGauge() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 14 size
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to app on port 19006...');
    await page.goto('http://localhost:19006', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for content to load
    console.log('Waiting for app to render...');
    await page.waitForTimeout(3000);

    // Click "Skip" to skip onboarding
    console.log('Looking for Skip button...');
    const skipButton = await page.getByText('Skip');
    if (await skipButton.isVisible()) {
      console.log('Clicking Skip...');
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    // Take screenshot after skip
    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\gauge_after_skip.png',
      fullPage: false
    });
    console.log('Screenshot after skip saved');

    // Try to navigate directly to main tabs if needed
    // Wait for the dashboard to load
    await page.waitForTimeout(3000);

    // Take screenshot of current state
    await page.screenshot({
      path: 'C:\\Users\\derri\\HeirclarkHealthAppNew\\gauge_dashboard_1.png',
      fullPage: false
    });
    console.log('Dashboard screenshot 1 saved');

    // Scroll down to find the gauges
    console.log('Scrolling to find gauges...');
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => {
        const scrollContainer = document.querySelector('[data-testid="scroll-view"]') ||
                               document.querySelector('[role="main"]') ||
                               document.body;
        scrollContainer.scrollTop += 400;
        window.scrollBy(0, 400);
      });
      await page.waitForTimeout(800);

      await page.screenshot({
        path: `C:\\Users\\derri\\HeirclarkHealthAppNew\\gauge_scroll_${i + 1}.png`,
        fullPage: false
      });
      console.log(`Scroll screenshot ${i + 1} saved`);
    }

    // Get all SVG info
    const svgInfo = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      const results = [];
      svgs.forEach((svg, index) => {
        const rect = svg.getBoundingClientRect();
        const parent = svg.parentElement;
        const parentRect = parent ? parent.getBoundingClientRect() : null;
        const parentStyle = parent ? window.getComputedStyle(parent) : null;
        const grandparent = parent ? parent.parentElement : null;
        const grandparentRect = grandparent ? grandparent.getBoundingClientRect() : null;

        results.push({
          index,
          svgWidth: rect.width,
          svgHeight: rect.height,
          svgLeft: rect.left,
          svgTop: rect.top,
          viewBox: svg.getAttribute('viewBox'),
          parentTag: parent ? parent.tagName : null,
          parentWidth: parentRect ? parentRect.width : null,
          parentHeight: parentRect ? parentRect.height : null,
          parentOverflow: parentStyle ? parentStyle.overflow : null,
          grandparentWidth: grandparentRect ? grandparentRect.width : null,
          grandparentHeight: grandparentRect ? grandparentRect.height : null
        });
      });
      return results;
    });

    console.log('\nSVG Element Analysis:');
    svgInfo.forEach(info => {
      if (info.svgWidth > 50) { // Only show larger SVGs (gauges)
        console.log(`\nSVG #${info.index}:`);
        console.log(`  SVG Size: ${info.svgWidth.toFixed(1)} x ${info.svgHeight.toFixed(1)}`);
        console.log(`  Position: (${info.svgLeft.toFixed(1)}, ${info.svgTop.toFixed(1)})`);
        console.log(`  ViewBox: ${info.viewBox}`);
        console.log(`  Parent: ${info.parentTag}, Size: ${info.parentWidth?.toFixed(1)} x ${info.parentHeight?.toFixed(1)}`);
        console.log(`  Parent Overflow: ${info.parentOverflow}`);
        console.log(`  Grandparent Size: ${info.grandparentWidth?.toFixed(1)} x ${info.grandparentHeight?.toFixed(1)}`);
      }
    });

    // Check for circles (dots at end of progress)
    const circleInfo = await page.evaluate(() => {
      const circles = document.querySelectorAll('circle');
      const results = [];
      circles.forEach((circle, index) => {
        const cx = parseFloat(circle.getAttribute('cx'));
        const cy = parseFloat(circle.getAttribute('cy'));
        const r = parseFloat(circle.getAttribute('r'));
        const fill = circle.getAttribute('fill');
        const svg = circle.closest('svg');
        const viewBox = svg ? svg.getAttribute('viewBox') : null;
        const svgRect = svg ? svg.getBoundingClientRect() : null;

        let isOutside = false;
        let exceedAmount = { left: 0, right: 0, top: 0, bottom: 0 };
        if (viewBox) {
          const [vbX, vbY, vbW, vbH] = viewBox.split(' ').map(Number);
          if (cx - r < vbX) {
            isOutside = true;
            exceedAmount.left = vbX - (cx - r);
          }
          if (cx + r > vbX + vbW) {
            isOutside = true;
            exceedAmount.right = (cx + r) - (vbX + vbW);
          }
          if (cy - r < vbY) {
            isOutside = true;
            exceedAmount.top = vbY - (cy - r);
          }
          if (cy + r > vbY + vbH) {
            isOutside = true;
            exceedAmount.bottom = (cy + r) - (vbY + vbH);
          }
        }

        results.push({
          index,
          cx,
          cy,
          r,
          fill,
          viewBox,
          svgWidth: svgRect?.width,
          svgHeight: svgRect?.height,
          isOutside,
          exceedAmount
        });
      });
      return results;
    });

    if (circleInfo.length > 0) {
      console.log('\n\nCircle (dot) Analysis:');
      circleInfo.forEach(info => {
        console.log(`\nCircle #${info.index}:`);
        console.log(`  Center: (${info.cx?.toFixed(1)}, ${info.cy?.toFixed(1)}), Radius: ${info.r?.toFixed(1)}`);
        console.log(`  Fill: ${info.fill}`);
        console.log(`  ViewBox: ${info.viewBox}`);
        console.log(`  SVG actual size: ${info.svgWidth?.toFixed(1)} x ${info.svgHeight?.toFixed(1)}`);
        console.log(`  Outside ViewBox: ${info.isOutside ? 'YES - PROBLEM!' : 'No'}`);
        if (info.isOutside) {
          console.log(`  Exceeds by: L:${info.exceedAmount.left.toFixed(1)}, R:${info.exceedAmount.right.toFixed(1)}, T:${info.exceedAmount.top.toFixed(1)}, B:${info.exceedAmount.bottom.toFixed(1)}`);
        }
      });
    } else {
      console.log('\nNo circles found - gauges may not have progress yet');
    }

    // Analyze paths (arcs)
    const pathInfo = await page.evaluate(() => {
      const paths = document.querySelectorAll('path');
      const results = [];
      paths.forEach((path, index) => {
        const stroke = path.getAttribute('stroke');
        const strokeWidth = path.getAttribute('stroke-width');
        if (strokeWidth && parseInt(strokeWidth) > 5) { // Only gauge arcs
          const svg = path.closest('svg');
          const viewBox = svg ? svg.getAttribute('viewBox') : null;
          results.push({
            index,
            stroke,
            strokeWidth,
            viewBox
          });
        }
      });
      return results;
    });

    if (pathInfo.length > 0) {
      console.log('\n\nPath (arc) Analysis (stroke > 5):');
      pathInfo.forEach(info => {
        console.log(`\nPath #${info.index}:`);
        console.log(`  Stroke: ${info.stroke}, Width: ${info.strokeWidth}`);
        console.log(`  ViewBox: ${info.viewBox}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\nBrowser closed');
  }
}

investigateGauge();
