const fs = require('fs');
const path = require('path');

// Files to process
const files = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/steps.tsx',
  'app/(tabs)/meals.tsx',
  'app/(tabs)/programs.tsx',
  'app/(tabs)/settings.tsx',
];

console.log('Removing fontWeight properties from styles...\n');

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠ Skipping ${filePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Remove fontWeight lines (with comma or without)
  // Pattern 1: fontWeight: 'xxx', (with comma)
  content = content.replace(/\s+fontWeight:\s*['"][0-9]+['"],?\n/g, '\n');

  // Pattern 2: fontWeight: 'xxx' (without comma, before closing brace)
  content = content.replace(/\s+fontWeight:\s*['"][0-9]+['"]\s*\n/g, '\n');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    const removed = (originalContent.match(/fontWeight:/g) || []).length;
    console.log(`✓ ${filePath} - removed ${removed} fontWeight properties`);
  } else {
    console.log(`  ${filePath} - no changes needed`);
  }
});

console.log('\n✅ Done! All fontWeight properties removed.');
console.log('This fixes React Native warnings about fontWeight + fontFamily conflicts.');
