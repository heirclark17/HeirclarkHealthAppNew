#!/bin/bash

# Remove all console.log, console.error, and console.warn statements from TypeScript files

echo "Removing console statements from TypeScript files..."

# Find all .ts and .tsx files and comment out console statements
find "C:/Users/derri/HeirclarkHealthAppNew" -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/.expo/*" | while read file; do
  # Comment out console.log statements
  sed -i 's/^\(\s*\)console\.log(/\1\/\/ console.log(/g' "$file"

  # Comment out console.error statements
  sed -i 's/^\(\s*\)console\.error(/\1\/\/ console.error(/g' "$file"

  # Comment out console.warn statements
  sed -i 's/^\(\s*\)console\.warn(/\1\/\/ console.warn(/g' "$file"

  echo "Processed: $file"
done

echo "Done! All console statements have been commented out."
