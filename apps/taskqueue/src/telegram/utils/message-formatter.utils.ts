/**
 * Telegram message formatting utilities
 */

export class MessageFormatter {
  /**
   * Format system status for display
   */
  static formatSystemStatus(status: {
    queueEngineStatus: string;
    activeQueuesCount: number;
    totalTasks: number;
    browserStatus: string;
    uptime: string;
    memoryMB: number;
  }): string {
    return `${status.queueEngineStatus} <b>Queue Engine</b>
📊 <b>Active Queues:</b> ${status.activeQueuesCount}
📝 <b>Total Tasks:</b> ${status.totalTasks}
🌐 <b>Browser:</b> ${status.browserStatus}
⏱️ <b>Uptime:</b> ${status.uptime}
💾 <b>Memory:</b> ${status.memoryMB} MB`;
  }

  /**
   * Format welcome message
   */
  static formatWelcomeMessage(): string {
    return `🎉 <b>Добро пожаловать!</b>

Вы авторизованы для управления Task Queue системой.

Доступные команды:
• /menu - панель управления
• /status - статус системы
• /help - справка
• /security - информация о безопасности`;
  }

  /**
   * Format help message
   */
  static formatHelpMessage(): string {
    return `🤖 <b>Task Queue Bot - Справка</b>

<b>Команды:</b>
• /start, /menu - панель управления
• /status - статус системы
• /help - эта справка
• /security - информация о безопасности

<b>Кнопки управления:</b>
▶️ Start Queue - запуск очереди задач
⏹️ Stop Queue - остановка очереди
📊 Status - получить статус системы
🔄 Restart Engine - перезапуск движка
🌐 Open Google - выполнить браузерную задачу
🔍 Count Elements - выполнить задачу поиска

<b>Безопасность:</b>
🔒 Бот доступен только авторизованным пользователям
📝 Все действия логируются

<i>Версия: 1.0 | Разработано для Task Queue System</i>`;
  }

  /**
   * Format security info message
   */
  static formatSecurityInfo(allowedUsername: string, uptime: string): string {
    return `🔒 <b>Информация о безопасности</b>

<b>Статус авторизации:</b> ✅ Авторизован
<b>Разрешённый username:</b> @${allowedUsername}
<b>Время работы бота:</b> ${uptime}

<b>Настройки безопасности:</b>
🛡️ Проверка по username включена
📊 Логирование всех действий
🚫 Автоблокировка неавторизованных пользователей

<b>Для изменения доступа:</b>
Измените TELEGRAM_ALLOWED_USERNAME в .env файле`;
  }

  /**
   * Format unauthorized access message
   */
  static formatUnauthorizedMessage(username: string, userId: string): string {
    return `🚫 <b>Доступ запрещён</b>

Извините, этот бот предназначен только для авторизованных пользователей.

Ваш username: @${username}
Ваш ID: ${userId}

Если вы считаете, что это ошибка, обратитесь к администратору.`;
  }

  /**
   * Format error message
   */
  static formatErrorMessage(error: string): string {
    return `❌ <b>Ошибка</b>

${error}

Попробуйте повторить операцию позже или обратитесь к администратору.`;
  }

  /**
   * Remove HTML tags from text for plain text usage
   */
  static stripHtml(text: string): string {
    return text.replace(/<\/?[^>]+(>|$)/g, '');
  }
}
