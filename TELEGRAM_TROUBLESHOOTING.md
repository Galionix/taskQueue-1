# Telegram Bot Setup Guide

## 🤖 Проблема с Telegram Bot

Если вы видите ошибку "Failed to get updates", это означает проблему с токеном бота или его конфигурацией.

## 🔧 Как исправить:

### 1. Создать нового бота (рекомендуется)
1. Откройте Telegram и найдите @BotFather
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "Task Queue Bot")
4. Введите username бота (например: "taskqueue_myusername_bot")
5. Скопируйте полученный токен

### 2. Обновить .env файл
```env
TELEGRAM_BOT_TOKEN=YOUR_NEW_TOKEN_HERE
TELEGRAM_CHAT_ID=YOUR_CHAT_ID
TELEGRAM_ALLOWED_USERNAME=your_telegram_username
```

### 3. Получить ваш Chat ID
1. Отправьте любое сообщение вашему боту
2. Откройте: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`
3. Найдите ваш chat ID в ответе

### 4. Настроить имя пользователя
- В настройках Telegram убедитесь, что у вас есть username
- Укажите его в TELEGRAM_ALLOWED_USERNAME (без @)

## ✅ Проверка конфигурации

После перезапуска сервера вы должны увидеть в логах:
```
[TelegramApiService] Bot connected successfully: @your_bot_username
[TelegramService] 🚀 Starting Telegram polling...
```

## 🎮 Команды бота

После настройки отправьте боту:
- `/start` - получить меню управления
- `/status` - статус очередей
- `/help` - список команд

## 🚨 Типичные ошибки

- **401 Unauthorized**: Неверный токен бота
- **404 Not Found**: Бот не существует или удален
- **403 Forbidden**: Бот заблокирован пользователем
