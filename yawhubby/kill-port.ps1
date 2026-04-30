$port = 5000
$pids = (netstat -ano | findstr ":$port " | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique)
foreach ($p in $pids) {
  if ($p -match '^\d+$') {
    Write-Host "Killing PID $p on port $port"
    taskkill /PID $p /F 2>$null
  }
}
Write-Host "✅ Port $port cleared"
