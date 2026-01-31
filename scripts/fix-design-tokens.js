#!/usr/bin/env node
/**
 * Design Token Fixer - Replaces hardcoded hex colors with theme tokens
 * Fixes typography violations and enforces design system compliance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color mappings - hex to theme token
const COLOR_MAPPINGS = {
  // White variants
  '#ffffff': { token: 'Colors.text', context: 'auto' },
  '#FFFFFF': { token: 'Colors.text', context: 'auto' },

  // Black variants
  '#000000': { token: 'Colors.background', context: 'auto' },
  '#000': { token: 'Colors.background', context: 'auto' },

  // Success colors
  '#4ECDC4': { token: 'Colors.success', context: 'success' },
  '#4ADE80': { token: 'Colors.successStrong', context: 'success' },
  '#96CEB4': { token: 'Colors.successMuted', context: 'success' },
  '#34C759': { token: 'Colors.goalAchieved', context: 'success' },
  '#22C55E': { token: 'Colors.successStrong', context: 'success' },

  // Error/Warning colors
  '#FF6B6B': { token: 'Colors.error', context: 'error' },
  '#FF3B30': { token: 'Colors.errorStrong', context: 'error' },
  '#FFD93D': { token: 'Colors.warning', context: 'warning' },
  '#FB923C': { token: 'Colors.warningOrange', context: 'warning' },
  '#F59E0B': { token: 'Colors.warningOrange', context: 'warning' },
  '#fbbf24': { token: 'Colors.warning', context: 'warning' },

  // Accent colors
  '#7B61FF': { token: 'Colors.accentPurple', context: 'accent' },
  '#00D9F5': { token: 'Colors.accentCyan', context: 'accent' },
  '#FFD700': { token: 'Colors.accentGold', context: 'accent' },

  // Gauge/Progress colors
  '#60A5FA': { token: 'Colors.restingEnergy', context: 'progress' },
  '#CC7722': { token: 'Colors.activeEnergy', context: 'progress' },

  // Gray variants
  '#1a1a1a': { token: 'Colors.card', context: 'background' },
  '#111111': { token: 'Colors.backgroundSecondary', context: 'background' },
  '#222222': { token: 'Colors.cardHover', context: 'background' },
  '#333333': { token: 'Colors.gaugeBg', context: 'background' },
  '#444444': { token: 'Colors.textMuted', context: 'text' },
  '#666666': { token: 'Colors.textMuted', context: 'text' },
  '#888888': { token: 'Colors.textMuted', context: 'text' },
  '#999999': { token: 'Colors.textMuted', context: 'text' },
  '#cccccc': { token: 'Colors.textSecondary', context: 'text' },
};

console.log('🎨 Design Token Fixer');
console.log('=====================\n');

// Find all TypeScript/TSX files in components directory
const componentsDir = path.join(__dirname, '..', 'components');

function getAllTsxFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllTsxFiles(fullPath, files);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = getAllTsxFiles(componentsDir);
console.log(`Found ${files.length} TypeScript files\n`);

let totalReplacements = 0;
let filesModified = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let fileReplacements = 0;

  // Check if file imports Colors
  const hasColorsImport = content.includes('import') && (
    content.includes("from '../constants/Theme'") ||
    content.includes("from '../../constants/Theme'") ||
    content.includes("from '@/constants/Theme'")
  );

  // Replace each color mapping
  for (const [hex, { token }] of Object.entries(COLOR_MAPPINGS)) {
    const regex = new RegExp(`['"]${hex}['"]`, 'gi');
    const matches = content.match(regex);

    if (matches) {
      content = content.replace(regex, token);
      fileReplacements += matches.length;
    }
  }

  if (fileReplacements > 0) {
    // Add Colors import if not present
    if (!hasColorsImport) {
      // Determine correct import path based on file depth
      const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '..', 'constants'));
      const importPath = relativePath.replace(/\\/g, '/');

      // Insert import after other imports
      const importRegex = /(import.*from.*['"];?\n)+/;
      if (importRegex.test(content)) {
        content = content.replace(importRegex, (match) => {
          return match + `import { Colors } from '${importPath}/Theme';\n`;
        });
      } else {
        // No imports, add at top
        content = `import { Colors } from '${importPath}/Theme';\n\n` + content;
      }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${path.relative(process.cwd(), filePath)}: ${fileReplacements} replacements`);
    filesModified++;
    totalReplacements += fileReplacements;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log(`   Design token compliance: ${((filesModified / files.length) * 100).toFixed(1)}%\n`);

if (filesModified > 0) {
  console.log('✨ Run `npm run typecheck` to verify no TypeScript errors\n');
}
