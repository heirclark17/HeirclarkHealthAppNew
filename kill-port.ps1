# Kill process on a specific port
# Usage: .\kill-port.ps1 -Port 8081

param(
    [int]$Port = 8081
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kill Process on Port $Port" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find process using the port
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connections) {
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

        if ($process) {
            Write-Host "Found process:" -ForegroundColor Yellow
            Write-Host "  Name: $($process.ProcessName)" -ForegroundColor White
            Write-Host "  PID:  $processId" -ForegroundColor White
            Write-Host "  Port: $Port" -ForegroundColor White
            Write-Host ""

            Write-Host "Killing process..." -ForegroundColor Red
            Stop-Process -Id $processId -Force
            Write-Host "✓ Process killed successfully!" -ForegroundColor Green
        }
    }
} else {
    Write-Host "No process found on port $Port" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
