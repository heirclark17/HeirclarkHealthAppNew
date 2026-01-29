# PowerShell script to add Urbanist font to all screen files

$files = @(
    "app\(tabs)\index.tsx",
    "app\(tabs)\steps.tsx",
    "app\(tabs)\meals.tsx",
    "app\(tabs)\programs.tsx",
    "app\(tabs)\settings.tsx"
)

foreach ($file in $files) {
    Write-Host "Processing: $file"

    $content = Get-Content $file -Raw

    # Add import at top if not present
    if ($content -notmatch "import.*Fonts.*from.*Theme") {
        # Find first import
        $lines = $content -split "`n"
        $lastImportIndex = -1

        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^import") {
                $lastImportIndex = $i
            }
        }

        if ($lastImportIndex -ge 0) {
            $lines = @($lines[0..$lastImportIndex]) + "import { Colors, Fonts } from '../../constants/Theme';" + @($lines[($lastImportIndex + 1)..($lines.Count - 1)])
            $content = $lines -join "`n"
            Write-Host "  Added import"
        }
    }

    # Remove local Colors definition
    $content = $content -replace "const Colors = \{[^}]+\};", ""

    # Add fontFamily to all styles with fontSize
    # This regex finds style objects and adds fontFamily
    $content = $content -replace "(\w+):\s*\{([^}]*fontSize:\s*\d+(?!.*fontFamily)[^}]*)\}", {
        param($match)
        $styleName = $match.Groups[1].Value
        $styleBody = $match.Groups[2].Value

        # Determine font based on fontWeight
        $font = "Fonts.regular"
        if ($styleBody -match "fontWeight:\s*['\`"]?(\d+|bold)['\`"]?") {
            $weight = $Matches[1]
            switch ($weight) {
                "700" { $font = "Fonts.bold" }
                "600" { $font = "Fonts.semiBold" }
                "500" { $font = "Fonts.medium" }
                "bold" { $font = "Fonts.bold" }
                default { $font = "Fonts.regular" }
            }
            # Remove fontWeight line
            $styleBody = $styleBody -replace ",?\s*fontWeight:\s*['\`"]?\w+['\`"]?,?", ","
        }

        # Add fontFamily
        $styleBody = $styleBody.TrimEnd()
        if (-not $styleBody.EndsWith(",")) {
            $styleBody += ","
        }
        $styleBody += "`n    fontFamily: $font,"

        return "$styleName: {$styleBody}"
    }

    # Save file
    Set-Content -Path $file -Value $content -NoNewline
    Write-Host "  ✅ Updated`n"
}

Write-Host "✨ All files updated with Urbanist font!"
