const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Pages to test
const PAGES = [
  { name: 'home', path: '/', description: 'Dashboard/Home Screen' },
  { name: 'steps', path: '/steps', description: 'Steps Tracking' },
  { name: 'meals', path: '/meals', description: 'Meal Planning' },
  { name: 'programs', path: '/programs', description: 'Training Programs' },
  { name: 'settings', path: '/settings', description: 'Settings' },
  { name: 'goals', path: '/goals', description: 'Goals Wizard' },
];

// Create screenshots directory
const SCREENSHOTS_DIR = './playwright-screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runVisualAudit() {
  console.log('🎨 Starting Visual Audit for Light/Dark Mode Issues...\n');
  console.log('='.repeat(80));

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-gpu', '--no-sandbox']
  });

  const issues = [];
  const screenshots = [];

  // Test each page
  for (const pageConfig of PAGES) {
    console.log(`\n📸 Testing: ${pageConfig.description} (${pageConfig.path})`);

    try {
      // Test in light mode
      console.log('   ☀️  Light mode...');
      const lightContext = await browser.newContext({
        colorScheme: 'light',
        viewport: { width: 390, height: 844 }, // iPhone 14 size
      });
      const lightPage = await lightContext.newPage();

      // Capture console errors
      lightPage.on('console', msg => {
        if (msg.type() === 'error') {
          issues.push({
            page: pageConfig.name,
            mode: 'light',
            type: 'console_error',
            message: msg.text()
          });
        }
      });

      try {
        await lightPage.goto(`http://localhost:8081${pageConfig.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // Wait for render
        await lightPage.waitForTimeout(3000);

        // Take screenshot
        const lightScreenshot = path.join(SCREENSHOTS_DIR, `${pageConfig.name}_light.png`);
        await lightPage.screenshot({ path: lightScreenshot, fullPage: true });
        screenshots.push({ page: pageConfig.name, mode: 'light', path: lightScreenshot });
        console.log(`      ✅ Screenshot saved: ${lightScreenshot}`);

        // Analyze light mode issues
        const lightIssues = await analyzePageContrast(lightPage, 'light', pageConfig.name);
        issues.push(...lightIssues);

      } catch (navError) {
        console.log(`      ⚠️  Could not load page: ${navError.message}`);
        issues.push({
          page: pageConfig.name,
          mode: 'light',
          type: 'navigation_error',
          message: navError.message
        });
      }
      await lightContext.close();

      // Test in dark mode
      console.log('   🌙 Dark mode...');
      const darkContext = await browser.newContext({
        colorScheme: 'dark',
        viewport: { width: 390, height: 844 },
      });
      const darkPage = await darkContext.newPage();

      darkPage.on('console', msg => {
        if (msg.type() === 'error') {
          issues.push({
            page: pageConfig.name,
            mode: 'dark',
            type: 'console_error',
            message: msg.text()
          });
        }
      });

      try {
        await darkPage.goto(`http://localhost:8081${pageConfig.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        await darkPage.waitForTimeout(3000);

        const darkScreenshot = path.join(SCREENSHOTS_DIR, `${pageConfig.name}_dark.png`);
        await darkPage.screenshot({ path: darkScreenshot, fullPage: true });
        screenshots.push({ page: pageConfig.name, mode: 'dark', path: darkScreenshot });
        console.log(`      ✅ Screenshot saved: ${darkScreenshot}`);

        const darkIssues = await analyzePageContrast(darkPage, 'dark', pageConfig.name);
        issues.push(...darkIssues);

      } catch (navError) {
        console.log(`      ⚠️  Could not load page: ${navError.message}`);
        issues.push({
          page: pageConfig.name,
          mode: 'dark',
          type: 'navigation_error',
          message: navError.message
        });
      }
      await darkContext.close();

    } catch (error) {
      console.log(`   ❌ Error testing ${pageConfig.name}: ${error.message}`);
      issues.push({
        page: pageConfig.name,
        mode: 'both',
        type: 'test_error',
        message: error.message
      });
    }
  }

  await browser.close();

  // Generate report
  generateReport(issues, screenshots);
}

async function analyzePageContrast(page, mode, pageName) {
  const issues = [];

  try {
    // Check for potential contrast issues
    const contrastAnalysis = await page.evaluate((mode) => {
      const issues = [];
      const allElements = document.querySelectorAll('*');

      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        const text = el.innerText?.substring(0, 50);

        // Check for hardcoded dark mode colors in light mode
        if (mode === 'light') {
          // Check for white/light text that won't be visible on light backgrounds
          if (color.includes('rgba(255, 255, 255') || color === 'rgb(255, 255, 255)') {
            // Check if background is also light
            if (bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)' ||
                bgColor.includes('rgba(255') || bgColor === 'rgb(255, 255, 255)') {
              if (text && text.trim()) {
                issues.push({
                  type: 'white_text_on_light',
                  element: el.tagName,
                  text: text.trim(),
                  color: color,
                  bgColor: bgColor
                });
              }
            }
          }

          // Check for hardcoded dark backgrounds
          if (bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgba(26, 26, 26') ||
              bgColor.includes('rgba(18, 18, 18') || bgColor.includes('rgba(20, 20, 20') ||
              bgColor === 'rgb(0, 0, 0)' || bgColor === 'rgb(26, 26, 26)' ||
              bgColor === 'rgb(18, 18, 18)' || bgColor === 'rgb(30, 30, 30)') {
            issues.push({
              type: 'dark_bg_in_light_mode',
              element: el.tagName,
              className: el.className,
              bgColor: bgColor
            });
          }
        }

        // Check for light mode colors in dark mode
        if (mode === 'dark') {
          // Check for dark text that won't be visible on dark backgrounds
          if (color === 'rgb(0, 0, 0)' || color.includes('rgba(0, 0, 0, 1)') ||
              color.includes('rgba(0, 0, 0, 0.9')) {
            if (bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)' ||
                bgColor.includes('rgba(0, 0, 0') || bgColor === 'rgb(0, 0, 0)') {
              if (text && text.trim()) {
                issues.push({
                  type: 'dark_text_on_dark',
                  element: el.tagName,
                  text: text.trim(),
                  color: color,
                  bgColor: bgColor
                });
              }
            }
          }
        }
      });

      return issues;
    }, mode);

    contrastAnalysis.forEach(issue => {
      issues.push({
        page: pageName,
        mode: mode,
        type: issue.type,
        element: issue.element,
        details: issue
      });
    });

  } catch (analysisError) {
    console.log(`      ⚠️  Could not analyze contrast: ${analysisError.message}`);
  }

  return issues;
}

function generateReport(issues, screenshots) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VISUAL AUDIT REPORT');
  console.log('='.repeat(80) + '\n');

  // Summary
  const lightModeIssues = issues.filter(i => i.mode === 'light');
  const darkModeIssues = issues.filter(i => i.mode === 'dark');

  console.log('📈 SUMMARY:');
  console.log(`   Total Issues: ${issues.length}`);
  console.log(`   Light Mode Issues: ${lightModeIssues.length}`);
  console.log(`   Dark Mode Issues: ${darkModeIssues.length}`);
  console.log(`   Screenshots Taken: ${screenshots.length}`);

  // Group issues by page
  const issuesByPage = {};
  issues.forEach(issue => {
    if (!issuesByPage[issue.page]) {
      issuesByPage[issue.page] = [];
    }
    issuesByPage[issue.page].push(issue);
  });

  console.log('\n📋 ISSUES BY PAGE:\n');
  Object.keys(issuesByPage).forEach(page => {
    const pageIssues = issuesByPage[page];
    console.log(`   ${page.toUpperCase()}: ${pageIssues.length} issues`);

    // Group by type
    const byType = {};
    pageIssues.forEach(i => {
      if (!byType[i.type]) byType[i.type] = 0;
      byType[i.type]++;
    });
    Object.keys(byType).forEach(type => {
      console.log(`      - ${type}: ${byType[type]}`);
    });
  });

  // Light mode specific issues
  if (lightModeIssues.length > 0) {
    console.log('\n☀️  LIGHT MODE CONTRAST ISSUES:\n');
    const whiteTextIssues = lightModeIssues.filter(i => i.type === 'white_text_on_light');
    const darkBgIssues = lightModeIssues.filter(i => i.type === 'dark_bg_in_light_mode');

    if (whiteTextIssues.length > 0) {
      console.log('   White/Light text on light backgrounds (unreadable):');
      whiteTextIssues.slice(0, 10).forEach((issue, i) => {
        console.log(`      ${i + 1}. [${issue.page}] ${issue.details?.text || 'Unknown text'}`);
      });
      if (whiteTextIssues.length > 10) {
        console.log(`      ... and ${whiteTextIssues.length - 10} more`);
      }
    }

    if (darkBgIssues.length > 0) {
      console.log('\n   Dark backgrounds in light mode (should be light/glass):');
      darkBgIssues.slice(0, 10).forEach((issue, i) => {
        console.log(`      ${i + 1}. [${issue.page}] ${issue.details?.className || issue.element} - bg: ${issue.details?.bgColor}`);
      });
      if (darkBgIssues.length > 10) {
        console.log(`      ... and ${darkBgIssues.length - 10} more`);
      }
    }
  }

  // Screenshots list
  console.log('\n📸 SCREENSHOTS SAVED:\n');
  screenshots.forEach(s => {
    console.log(`   ${s.page}_${s.mode}: ${s.path}`);
  });

  // Save JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: issues.length,
      lightModeIssues: lightModeIssues.length,
      darkModeIssues: darkModeIssues.length,
      screenshotsTaken: screenshots.length
    },
    issues,
    screenshots
  };

  const reportPath = path.join(SCREENSHOTS_DIR, 'visual_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);

  // Recommendations
  console.log('\n🔧 RECOMMENDATIONS:\n');
  console.log('   1. Replace hardcoded rgba(26, 26, 26) with theme-aware colors');
  console.log('   2. Replace hardcoded rgba(255, 255, 255) text with adaptive text colors');
  console.log('   3. Use useSettings() hook to detect current theme mode');
  console.log('   4. Use colors from DarkColors/LightColors based on theme');
  console.log('   5. Replace View cards with GlassCard component for proper theming');

  console.log('\n' + '='.repeat(80));
  console.log('✅ Visual audit complete!');
  console.log('='.repeat(80) + '\n');
}

// Run the audit
runVisualAudit().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
