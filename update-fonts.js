const fs = require('fs');
const path = require('path');

// Files to update
const files = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/steps.tsx',
  'app/(tabs)/meals.tsx',
  'app/(tabs)/programs.tsx',
  'app/(tabs)/settings.tsx',
];

// Font weight mappings
const fontMap = {
  '400': 'Fonts.regular',
  '500': 'Fonts.medium',
  '600': 'Fonts.semiBold',
  '700': 'Fonts.bold',
  'normal': 'Fonts.regular',
  'bold': 'Fonts.bold',
};

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Step 1: Add import if not present
  if (!content.includes('import { Colors, Fonts }')) {
    if (content.includes('const Colors = {')) {
      // Replace local Colors definition with import
      content = content.replace(
        /const Colors = \{[^}]+\};/s,
        ''
      );
      content = `import { Colors, Fonts } from '../../constants/Theme';\n\n${content}`;
      modified = true;
    } else {
      // Add import at the top
      const importIndex = content.indexOf('import');
      if (importIndex >= 0) {
        const lines = content.split('\n');
        let lastImportLine = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import')) {
            lastImportLine = i;
          } else if (lastImportLine > 0 && !lines[i].trim().startsWith('import')) {
            break;
          }
        }
        lines.splice(lastImportLine + 1, 0, "import { Colors, Fonts } from '../../constants/Theme';");
        content = lines.join('\n');
        modified = true;
      }
    }
  }

  // Step 2: Add fontFamily to all text styles that don't have it
  const stylePatterns = [
    // Match style objects with fontSize but no fontFamily
    /(\w+):\s*\{([^}]*fontSize:\s*\d+[^}]*)\}/g,
  ];

  stylePatterns.forEach(pattern => {
    content = content.replace(pattern, (match, styleName, styleBody) => {
      // Check if fontFamily already exists
      if (styleBody.includes('fontFamily')) {
        return match;
      }

      // Determine which font variant to use based on fontWeight
      let fontVariant = 'Fonts.regular';

      // Check for fontWeight
      const weightMatch = styleBody.match(/fontWeight:\s*['"]?(\w+)['"]?/);
      if (weightMatch) {
        const weight = weightMatch[1];
        fontVariant = fontMap[weight] || 'Fonts.regular';

        // Remove fontWeight since we're using fontFamily now
        styleBody = styleBody.replace(/,?\s*fontWeight:\s*['"]?\w+['"]?,?\s*/g, ',');
      }

      // Add fontFamily
      styleBody = styleBody.trim();
      if (!styleBody.endsWith(',')) {
        styleBody += ',';
      }
      styleBody += `\n    fontFamily: ${fontVariant},`;

      modified = true;
      return `${styleName}: {${styleBody}}`;
    });
  });

  // Save if modified
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${file}`);
  } else {
    console.log(`⚪ No changes: ${file}`);
  }
});

console.log('\n✨ Font update complete!');
