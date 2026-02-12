#!/bin/bash
# Automated batch replacement of non-standard border radius values

# Navigate to project root
cd "$(dirname "$0")/.."

echo "🎯 Starting border radius standardization..."
count=0

# Standard border radius scale: 4, 8, 12, 16, 20, 24, 32
# Map odd/non-standard values to nearest standard value
declare -A RADIUS_MAP=(
  ["borderRadius: 3,"]="borderRadius: 4,"
  ["borderRadius: 5,"]="borderRadius: 4,"
  ["borderRadius: 6,"]="borderRadius: 8,"
  ["borderRadius: 10,"]="borderRadius: 12,"
  ["borderRadius: 14,"]="borderRadius: 12,"
  ["borderRadius: 15,"]="borderRadius: 16,"
  ["borderRadius: 18,"]="borderRadius: 16,"
  ["borderRadius: 22,"]="borderRadius: 24,"
  ["borderRadius: 28,"]="borderRadius: 24,"
  ["borderRadius: 30,"]="borderRadius: 32,"
)

for old_value in "${!RADIUS_MAP[@]}"; do
  new_value="${RADIUS_MAP[$old_value]}"

  # Find and replace in components directory (excluding tests)
  files=$(grep -rl "$old_value" components/ --include="*.tsx" --include="*.ts" --exclude-dir="__tests__" 2>/dev/null || true)

  if [ -n "$files" ]; then
    echo "Replacing: $old_value → $new_value"
    echo "$files" | while read file; do
      # Use sed for in-place replacement (cross-platform)
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/$old_value/$new_value/g" "$file"
      else
        sed -i "s/$old_value/$new_value/g" "$file"
      fi
      ((count++))
    done
  fi
done

echo "✅ Standardized border radius in $count file instances"
echo ""
echo "Standard radius scale now:"
echo "  4  - Small (chips, badges)"
echo "  8  - Medium (buttons, inputs)"
echo "  12 - Large (cards)"
echo "  16 - Extra large (panels)"
echo "  20 - Rounded (pills)"
echo "  24 - Very rounded (avatars)"
echo "  32 - Extremely rounded"
