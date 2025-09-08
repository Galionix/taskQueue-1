# 🚀 Автоматический запуск Pushover + LocalTunnel

Write-Host "🎯 Запуск Task Queue сервера с Pushover интеграцией..." -ForegroundColor Green
Write-Host ""

# Установка localtunnel (если не установлен)
if (-not (Get-Command "lt" -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Устанавливаем LocalTunnel..." -ForegroundColor Yellow
    npm install -g localtunnel
    Write-Host "✅ LocalTunnel установлен" -ForegroundColor Green
}

# Запуск NestJS сервера в фоне
Write-Host "🖥️  Запускаем NestJS сервер..." -ForegroundColor Blue
$serverJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    npm run dev:backend
} -ArgumentList $PWD

# Ждем запуска сервера
Write-Host "⏳ Ожидаем запуска сервера (30 сек)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Запуск localtunnel
Write-Host "🌐 Запускаем LocalTunnel..." -ForegroundColor Blue
Write-Host ""
Write-Host "🔗 Ваш webhook URL: https://pushover-tasks.loca.lt/pushover/webhook" -ForegroundColor Cyan
Write-Host "🧪 Тест endpoint: https://pushover-tasks.loca.lt/pushover/test" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Обновите .env файл:" -ForegroundColor Yellow
Write-Host "TUNNEL_URL=https://pushover-tasks.loca.lt" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Нажмите Ctrl+C для остановки сервера и туннеля" -ForegroundColor Red
Write-Host ""

# Обработка прерывания
$exitHandler = {
    Write-Host ""
    Write-Host "🛑 Останавливаем сервер..." -ForegroundColor Red
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
    Write-Host "✅ Завершено" -ForegroundColor Green
    exit
}

# Регистрируем обработчик Ctrl+C
[Console]::TreatControlCAsInput = $false
[Console]::CancelKeyPress += $exitHandler

try {
    # Запуск туннеля на правильном порту
    lt --port 3001 --subdomain pushover-tasks
}
finally {
    & $exitHandler
}
