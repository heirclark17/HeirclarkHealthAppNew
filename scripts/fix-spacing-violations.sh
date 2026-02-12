#!/bin/bash
# Automated batch replacement of non-8pt grid spacing values

# Navigate to project root
cd "$(dirname "$0")/.."

echo "🎯 Starting batch spacing fixes (8pt grid compliance)..."
count=0

# Common spacing replacements (non-8pt → 8pt grid)
declare -A SPACING_MAP=(
  ["padding: 14,"]="padding: 16,"
  ["padding: 18,"]="padding: 16,"
  ["padding: 22,"]="padding: 24,"
  ["padding: 10,"]="padding: 8,"
  ["padding: 6,"]="padding: 8,"
  ["margin: 14,"]="margin: 16,"
  ["margin: 18,"]="margin: 16,"
  ["margin: 22,"]="margin: 24,"
  ["margin: 10,"]="margin: 8,"
  ["margin: 6,"]="margin: 8,"
  ["gap: 14,"]="gap: 16,"
  ["gap: 18,"]="gap: 16,"
  ["gap: 22,"]="gap: 24,"
  ["gap: 10,"]="gap: 8,"
  ["gap: 6,"]="gap: 8,"
  ["marginTop: 14,"]="marginTop: 16,"
  ["marginBottom: 14,"]="marginBottom: 16,"
  ["marginLeft: 14,"]="marginLeft: 16,"
  ["marginRight: 14,"]="marginRight: 16,"
  ["paddingTop: 14,"]="paddingTop: 16,"
  ["paddingBottom: 14,"]="paddingBottom: 16,"
  ["paddingLeft: 14,"]="paddingLeft: 16,"
  ["paddingRight: 14,"]="paddingRight: 16,"
  ["paddingHorizontal: 14,"]="paddingHorizontal: 16,"
  ["paddingVertical: 14,"]="paddingVertical: 16,"
  ["marginHorizontal: 14,"]="marginHorizontal: 16,"
  ["marginVertical: 14,"]="marginVertical: 16,"
)

for old_value in "${!SPACING_MAP[@]}"; do
  new_value="${SPACING_MAP[$old_value]}"

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

echo "✅ Fixed spacing in $count file instances"
echo "⚠️  Manual review needed for:"
echo "  - Width/height values (not auto-fixable)"
echo "  - Font sizes (separate system)"
echo "  - Border widths (separate system)"
