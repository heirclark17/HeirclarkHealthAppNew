const fs = require('fs');
const path = require('path');

const URBANIST_IMPORT = "import { Colors, Fonts } from '../../constants/Theme';";

const files = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/steps.tsx',
  'app/(tabs)/meals.tsx',
  'app/(tabs)/programs.tsx',
  'app/(tabs)/settings.tsx',
];

function addUrbanistFont(filePath) {
  console.log(`\n📄 Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // Step 1: Add import if not present
  if (!content.includes(URBANIST_IMPORT)) {
    const lines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      } else if (lastImportIndex >= 0 && !lines[i].trim().startsWith('import')) {
        break;
      }
    }

    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, URBANIST_IMPORT);
      content = lines.join('\n');
      console.log('  ✅ Added Urbanist import');
      changes++;
    }
  }

  // Step 2: Remove local Colors definition
  const colorsDefPattern = /const Colors = \{[^}]+\};?\n?/s;
  if (colorsDefPattern.test(content)) {
    content = content.replace(colorsDefPattern, '');
    console.log('  ✅ Removed local Colors definition');
    changes++;
  }

  // Step 3: Add fontFamily to styles
  // Match style definitions with fontSize but without fontFamily
  const lines = content.split('\n');
  const newLines = [];
  let inStyle = false;
  let styleIndent = '';
  let needsFont = false;
  let fontWeight = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we're entering a style object
    if (line.match(/^\s+\w+:\s*\{/)) {
      inStyle = true;
      styleIndent = line.match(/^\s+/)?.[0] || '';
      needsFont = false;
      fontWeight = null;
    }

    // Check if line has fontSize (means it's a text style)
    if (inStyle && line.includes('fontSize:')) {
      needsFont = true;
    }

    // Capture fontWeight if present
    if (inStyle && line.match(/fontWeight:\s*['"]?(\d+|bold|normal)['"]?/)) {
      const match = line.match(/fontWeight:\s*['"]?(\d+|bold|normal)['"]?/);
      fontWeight = match[1];
    }

    // Check if closing brace of style
    if (inStyle && line.match(/^\s+\}/)) {
      // Add fontFamily before closing brace if needed
      if (needsFont && !content.slice(0, content.indexOf(line)).split('\n').slice(-10).some(l => l.includes('fontFamily:'))) {
        let font = 'Fonts.regular';

        if (fontWeight === '700' || fontWeight === 'bold') {
          font = 'Fonts.bold';
        } else if (fontWeight === '600') {
          font = 'Fonts.semiBold';
        } else if (fontWeight === '500') {
          font = 'Fonts.medium';
        }

        newLines.push(`${styleIndent}  fontFamily: ${font},`);
        console.log(`  ✅ Added ${font} to style`);
        changes++;
      }

      inStyle = false;
      needsFont = false;
      fontWeight = null;
    }

    newLines.push(line);
  }

  if (changes > 0) {
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`  ✨ Total changes: ${changes}`);
  } else {
    console.log(`  ⚪ No changes needed`);
  }
}

console.log('🎨 Applying Urbanist Font to All Screens...\n');
console.log('='.repeat(50));

files.forEach(file => {
  try {
    addUrbanistFont(file);
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(50));
console.log('\n✨ Urbanist font application complete!\n');
