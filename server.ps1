$port = 8081
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Алхимия — локальный сервер" -ForegroundColor Cyan
Write-Host "Открой в браузере: http://localhost:$port" -ForegroundColor Yellow
Write-Host 'Нажми Ctrl+C для остановки' -ForegroundColor Gray
python -m http.server $port -d $dir
