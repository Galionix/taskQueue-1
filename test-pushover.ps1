# Быстрый тест Pushover интеграции

Write-Host "🚀 Запуск Pushover + LocalTunnel интеграции..."
Write-Host ""

# Проверяем, установлен ли localtunnel
if (-not (Get-Command "lt" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ LocalTunnel не установлен. Устанавливаем..."
    npm install -g localtunnel
    Write-Host "✅ LocalTunnel установлен"
}

Write-Host "📋 Инструкции:"
Write-Host "1. Запустите ваш NestJS сервер в отдельном терминале:"
Write-Host "   npm run serve taskqueue"
Write-Host ""
Write-Host "2. Затем запустите туннель:"
Write-Host "   lt --port 3000 --subdomain pushover-tasks"
Write-Host ""
Write-Host "3. Ваш webhook URL будет:"
Write-Host "   https://pushover-tasks.loca.lt/pushover/webhook"
Write-Host ""
Write-Host "4. Для тестирования откройте в браузере:"
Write-Host "   https://pushover-tasks.loca.lt/pushover/test"
Write-Host ""
Write-Host "🔧 Для отправки тестового push уведомления используйте curl:"
Write-Host ""

$curlCommand = @"
curl -X POST https://api.pushover.net/1/messages.json \
  -d "token=$env:PUSHOVER_TOKEN" \
  -d "user=$env:PUSHOVER_USER" \
  -d "message=Test message with actions" \
  -d "title=Task Queue Control" \
  -d 'actions=[{"name": "start_queue_1", "text": "▶️ Start", "url": "https://pushover-tasks.loca.lt/pushover/webhook", "url_title": "Execute"}]'
"@

Write-Host $curlCommand
Write-Host ""
Write-Host "✨ Готово! Следуйте инструкциям выше."
