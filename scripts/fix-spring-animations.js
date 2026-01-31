#!/usr/bin/env node
/**
 * Spring Animation Fixer - Replaces withTiming with withSpring for iOS 26 compliance
 * Ensures all animations use spring physics for authentic iOS feel
 */

const fs = require('fs');
const path = require('path');

console.log('🎬 Spring Animation Fixer');
console.log('==========================\n');

// Standard spring config for iOS 26 Liquid Glass
const SPRING_CONFIG = `{
  damping: 15,
  stiffness: 150,
  mass: 1,
}`;

const componentsDir = path.join(__dirname, '..', 'components');
const appDir = path.join(__dirname, '..', 'app');

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

const files = [...getAllTsxFiles(componentsDir), ...getAllTsxFiles(appDir)];
console.log(`Found ${files.length} TypeScript files\n`);

let totalReplacements = 0;
let filesModified = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let fileModified = false;

  // Check if file uses withTiming
  if (content.includes('withTiming')) {
    // Pattern 1: withTiming(value, { duration: X })
    const timingPattern1 = /withTiming\(([^,]+),\s*\{\s*duration:\s*\d+\s*\}\)/g;
    if (timingPattern1.test(content)) {
      content = content.replace(timingPattern1, 'withSpring($1, GLASS_SPRING)');
      fileModified = true;
      totalReplacements++;
    }

    // Pattern 2: withTiming(value, duration)
    const timingPattern2 = /withTiming\(([^,]+),\s*\d+\)/g;
    if (timingPattern2.test(content)) {
      content = content.replace(timingPattern2, 'withSpring($1, GLASS_SPRING)');
      fileModified = true;
      totalReplacements++;
    }

    // Pattern 3: Simple withTiming(value)
    const timingPattern3 = /withTiming\(([^)]+)\)(?!\s*,)/g;
    if (timingPattern3.test(content)) {
      content = content.replace(timingPattern3, 'withSpring($1, GLASS_SPRING)');
      fileModified = true;
      totalReplacements++;
    }

    if (fileModified) {
      // Add GLASS_SPRING constant if not present
      if (!content.includes('GLASS_SPRING')) {
        // Find good insertion point (after imports, before first const/function)
        const insertRegex = /(import.*\n)+\n/;
        if (insertRegex.test(content)) {
          content = content.replace(insertRegex, (match) => {
            return match + `// iOS 26 Liquid Glass spring physics\nconst GLASS_SPRING = ${SPRING_CONFIG};\n\n`;
          });
        }
      }

      // Make sure withSpring is imported from react-native-reanimated
      if (content.includes('withSpring') && !content.includes("'react-native-reanimated'")) {
        // Check if there's already a reanimated import
        const reanimatedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react-native-reanimated['"]/;
        if (reanimatedImportRegex.test(content)) {
          // Add withSpring to existing import
          content = content.replace(reanimatedImportRegex, (match, imports) => {
            if (!imports.includes('withSpring')) {
              return match.replace(imports, imports + ', withSpring');
            }
            return match;
          });
        } else {
          // Add new reanimated import
          const importRegex = /(import.*\n)+/;
          if (importRegex.test(content)) {
            content = content.replace(importRegex, (match) => {
              return match + "import { withSpring } from 'react-native-reanimated';\n";
            });
          }
        }
      }

      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
      filesModified++;
    }
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   withTiming → withSpring replacements: ${totalReplacements}`);
console.log(`\n✨ iOS 26 Liquid Glass spring physics implemented!\n`);
