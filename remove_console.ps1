# PowerShell script to comment out all console statements

$files = Get-ChildItem -Path "C:\Users\derri\HeirclarkHealthAppNew" -Include *.ts,*.tsx -Recurse | Where-Object { $_.FullName -notmatch "node_modules|\.expo" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $content -replace '(\s+)console\.(log|error|warn)\(', '$1// console.$2('
    Set-Content -Path $file.FullName -Value $modified -NoNewline
    Write-Host "Processed: $($file.FullName)"
}

Write-Host "Done! All console statements commented out."
