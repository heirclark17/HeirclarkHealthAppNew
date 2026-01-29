const fs = require('fs');

// Absolute paths to files
const files = [
  'C:\\Users\\derri\\HeirclarkHealthAppNew\\app\\(tabs)\\index.tsx',
  'C:\\Users\\derri\\HeirclarkHealthAppNew\\app\\(tabs)\\steps.tsx',
  'C:\\Users\\derri\\HeirclarkHealthAppNew\\app\\(tabs)\\meals.tsx',
  'C:\\Users\\derri\\HeirclarkHealthAppNew\\app\\(tabs)\\programs.tsx',
  'C:\\Users\\derri\\HeirclarkHealthAppNew\\app\\(tabs)\\settings.tsx',
];

console.log('🔧 Removing fontWeight properties that conflict with fontFamily...\n');

let totalRemoved = 0;

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ Skipping ${filePath} - file not found`);
    return;
  }

  const fileName = filePath.split('\\').pop();
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Count before
  const beforeCount = (originalContent.match(/fontWeight:/g) || []).length;

  // Remove fontWeight lines
  // Pattern 1: fontWeight: '700', (with comma and newline)
  content = content.replace(/\s+fontWeight:\s*['"][0-9]+['"],\n/g, '\n');

  // Pattern 2: fontWeight: 'xxx' (no comma at end of style object)
  content = content.replace(/\s+fontWeight:\s*['"][0-9]+['"]\n/g, '\n');

  // Count after
  const afterCount = (content.match(/fontWeight:/g) || []).length;
  const removed = beforeCount - afterCount;

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${fileName} - removed ${removed} fontWeight properties`);
    totalRemoved += removed;
  } else {
    console.log(`  ${fileName} - no fontWeight properties found`);
  }
});

console.log(`\n✅ Done! Removed ${totalRemoved} total fontWeight properties.`);
console.log('\n💡 Why this fixes console errors:');
console.log('   React Native throws warnings when you use fontWeight');
console.log('   with custom fonts (like Urbanist_600SemiBold).');
console.log('   The weight is already in the font name!');
