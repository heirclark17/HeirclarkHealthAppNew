#!/bin/bash
# Automated batch replacement of common hardcoded colors with Theme.ts tokens

# Navigate to project root
cd "$(dirname "$0")/.."

# Common color replacements
declare -A COLOR_MAP=(
  ["#4ECDC4"]="Colors.success"
  ["#4ecdc4"]="Colors.success"
  ["#FF6B6B"]="Colors.error"
  ["#ff6b6b"]="Colors.error"
  ["#3b82f6"]="colors.accentPurple"
  ["#6366f1"]="colors.accentPurple"
  ["#6366F1"]="colors.accentPurple"
  ["#a855f7"]="colors.accentPurple"
  ["#22C55E"]="Colors.successStrong"
  ["#22c55e"]="Colors.successStrong"
  ["#EF5350"]="colors.error"
  ["#ef5350"]="colors.error"
  ["#FFB74D"]="colors.warningOrange"
  ["#ffb74d"]="colors.warningOrange"
  ["#F39C12"]="colors.protein"
  ["#f39c12"]="colors.protein"
  ["#1D1D1F"]="Colors.text"
  ["#1d1d1f"]="Colors.text"
  ["#FFFFFF"]="Colors.text"
  ["#ffffff"]="Colors.text"
  ["#000000"]="Colors.background"
)

echo "🎨 Starting batch color replacement..."
count=0

for color in "${!COLOR_MAP[@]}"; do
  replacement="${COLOR_MAP[$color]}"

  # Find and replace in components directory (excluding tests)
  files=$(grep -rl "$color" components/ --include="*.tsx" --include="*.ts" --exclude-dir="__tests__" 2>/dev/null || true)

  if [ -n "$files" ]; then
    echo "Replacing $color → $replacement"
    echo "$files" | while read file; do
      # Use sed for in-place replacement (macOS/Linux compatible)
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/'$color'/$replacement/g" "$file"
        sed -i '' "s/\"$color\"/$replacement/g" "$file"
      else
        sed -i "s/'$color'/$replacement/g" "$file"
        sed -i "s/\"$color\"/$replacement/g" "$file"
      fi
      ((count++))
    done
  fi
done

echo "✅ Replaced colors in $count files"
echo "⚠️  Manual review needed for:"
echo "  - Colors with opacity (e.g., #FF6B6B20)"
echo "  - Context-specific colors"
echo "  - CSS-in-JS template literals"
