# Pushover + LocalTunnel Setup

## Установка и запуск

### 1. Установите localtunnel
```bash
npm install -g localtunnel
```

### 2. Запустите ваш NestJS сервер
```bash
npm run serve taskqueue
```

### 3. В отдельном терминале запустите туннель
```bash
lt --port 3000 --subdomain pushover-tasks
```

Вы получите URL вида: `https://pushover-tasks.loca.lt`

### 4. Настройте Pushover Actions

Ваш webhook URL: `https://pushover-tasks.loca.lt/pushover/webhook`

Пример отправки уведомления с действиями:

```bash
curl -X POST https://api.pushover.net/1/messages.json \
  -d "token=YOUR_PUSHOVER_TOKEN" \
  -d "user=YOUR_PUSHOVER_USER" \
  -d "message=Choose an action" \
  -d "title=Task Queue Control" \
  -d 'actions=[
    {
      "name": "start_queue_1",
      "text": "▶️ Start Queue",
      "url": "https://pushover-tasks.loca.lt/pushover/webhook",
      "url_title": "Execute"
    },
    {
      "name": "status",
      "text": "📊 Status",
      "url": "https://pushover-tasks.loca.lt/pushover/webhook",
      "url_title": "Check"
    }
  ]'
```

### 5. Поддерживаемые команды

- `start_queue_1` - запустить очередь с ID 1
- `stop_queue_1` - остановить очередь с ID 1
- `execute_task_browser_open` - выполнить задачу
- `status` - получить статус системы

### 6. Тестирование

Откройте браузер и перейдите на:
`https://pushover-tasks.loca.lt/pushover/test`

Это отправит тестовое уведомление с действиями.

## Автоматический запуск

Используйте скрипт `start-with-tunnel.ps1`:

```powershell
.\start-with-tunnel.ps1
```

## Отладка

Логи webhook'ов можно посмотреть в консоли NestJS сервера.

## Безопасность

⚠️ **ВАЖНО**: LocalTunnel делает ваш сервер публично доступным!

Рекомендации:
- Используйте только для разработки
- Добавьте аутентификацию для production
- Рассмотрите использование ngrok с авторизацией
