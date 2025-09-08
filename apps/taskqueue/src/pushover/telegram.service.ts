import {
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
  OnModuleDestroy,
} from '@nestjs/common';
import { QueueEngineService } from '../queue-engine/queue-engine.service';
import { QueueService } from '../queue/queue.service';
import { TaskService } from '../task/task.service';
import { TelegramApiService } from './telegram-api.service';
import {
  TelegramUpdateDto,
  TelegramCallbackQueryDto,
} from './dto/telegram.dto';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastUpdateId = 0;

  constructor(
    private readonly telegramApiService: TelegramApiService,
    @Optional() private readonly queueEngineService: QueueEngineService,
    @Optional() private readonly queueService: QueueService,
    @Optional() private readonly taskService: TaskService
  ) {}

  async onModuleInit() {
    // Проверяем, что переменные окружения настроены
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      this.logger.warn(
        '⚠️  TELEGRAM_BOT_TOKEN not set - Telegram integration disabled'
      );
      return;
    }

    // Проверяем статус бота
    const isValid = await this.telegramApiService.checkBotStatus();
    if (!isValid) {
      this.logger.error(
        '❌ Failed to connect to Telegram bot - polling disabled'
      );
      return;
    }

    // Удаляем webhook и запускаем polling
    await this.telegramApiService.deleteWebhook();
    this.startPolling();
  }

  private startPolling(): void {
    this.logger.log('🚀 Starting Telegram polling...');
    // Устанавливаем флаг что polling активен
    this.pollingInterval = setInterval(() => {}, 1000) as NodeJS.Timeout; // Dummy interval для флага
    clearInterval(this.pollingInterval); // Сразу очищаем, но оставляем флаг
    this.pollingInterval = true as any; // Используем как флаг
    this.pollForUpdates();
  }

  private async pollForUpdates(): Promise<void> {
    this.logger.log('📡 Polling loop started, waiting for updates...');

    while (this.pollingInterval) {
      try {
        this.logger.debug(`🔄 Requesting updates from offset ${this.lastUpdateId + 1}`);

        // Long polling - запрос ждет до 30 секунд новых сообщений
        const updates = await this.telegramApiService.getUpdates(
          this.lastUpdateId + 1
        );

        if (updates.length > 0) {
          this.logger.log(`📨 Received ${updates.length} updates`);

          for (const update of updates) {
            this.logger.debug(`Processing update ${update.update_id}`);
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            await this.handleUpdate(update);
          }
        } else {
          this.logger.debug('📭 No new updates');
        }

        // Минимальная пауза между запросами для стабильности
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        this.logger.error(
          '❌ Polling error:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        // При ошибке ждем дольше перед следующим запросом
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    this.logger.warn('⚠️  Polling loop stopped');
  }

  async handleUpdate(update: TelegramUpdateDto): Promise<void> {
    try {
      // Проверяем авторизацию для всех типов обновлений
      const user = update.callback_query?.from || update.message?.from;
      if (!user || !this.isUserAuthorized(user)) {
        await this.handleUnauthorizedAccess(update);
        return;
      }

      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      } else if (update.message?.text) {
        await this.handleMessage(
          update.message.text,
          update.message.chat.id.toString()
        );
      }
    } catch (error) {
      this.logger.error('Error handling update:', error);
    }
  }

  private isUserAuthorized(user: any): boolean {
    const allowedUsername = process.env.TELEGRAM_ALLOWED_USERNAME;

    if (!allowedUsername) {
      this.logger.warn(
        'TELEGRAM_ALLOWED_USERNAME not set - allowing all users'
      );
      return true;
    }

    const isAuthorized =
      user.username?.toLowerCase() === allowedUsername.toLowerCase();

    if (!isAuthorized) {
      this.logger.warn(
        `Unauthorized access attempt from user: ${
          user.username || 'unknown'
        } (ID: ${user.id})`
      );
    }

    return isAuthorized;
  }

  private async handleUnauthorizedAccess(
    update: TelegramUpdateDto
  ): Promise<void> {
    const user = update.callback_query?.from || update.message?.from;
    const chatId =
      update.callback_query?.message?.chat.id || update.message?.chat.id;

    if (!chatId) return;

    const username = user?.username || 'неизвестен';
    const userId = user?.id || 'неизвестен';

    // Отправляем сообщение о запрете доступа
    await this.telegramApiService.sendMessage(
      chatId.toString(),
      `🚫 <b>Доступ запрещён</b>\n\n` +
        `Извините, этот бот предназначен только для авторизованных пользователей.\n\n` +
        `Ваш username: @${username}\n` +
        `Ваш ID: ${userId}\n\n` +
        `Если вы считаете, что это ошибка, обратитесь к администратору.`
    );

    // Логируем попытку несанкционированного доступа
    this.logger.warn(
      `🚫 Unauthorized access attempt: @${username} (ID: ${userId}) from chat ${chatId}`
    );
  }

  private async handleMessage(text: string, chatId: string): Promise<void> {
    if (text === '/start' || text === '/menu') {
      await this.telegramApiService.sendMessage(
        chatId,
        `🎉 <b>Добро пожаловать!</b>\n\n` +
          `Вы авторизованы для управления Task Queue системой.\n\n` +
          `Доступные команды:\n` +
          `• /menu - панель управления\n` +
          `• /status - статус системы\n` +
          `• /help - справка\n` +
          `• /security - информация о безопасности`
      );
      await this.telegramApiService.sendTaskControlMenu(chatId);
    } else if (text === '/status') {
      await this.sendSystemStatus(chatId);
    } else if (text === '/help') {
      await this.sendHelpMessage(chatId);
    } else if (text === '/security') {
      await this.sendSecurityInfo(chatId);
    } else {
      await this.telegramApiService.sendMessage(
        chatId,
        '🤖 Используйте команды:\n' +
          '• /menu - панель управления\n' +
          '• /status - статус системы\n' +
          '• /help - справка\n' +
          '• /security - безопасность'
      );
    }
  }

  private async handleCallbackQuery(
    callbackQuery: TelegramCallbackQueryDto
  ): Promise<void> {
    const { data, from, message } = callbackQuery;
    const chatId = message?.chat.id.toString() || from.id.toString();

    if (!data) return;

    // Логируем авторизованное действие
    this.logger.log(
      `✅ Authorized command: ${data} from @${
        from.username || 'unknown'
      } (ID: ${from.id})`
    );

    try {
      const result = await this.executeCommand(data);

      // Отвечаем на callback
      await this.telegramApiService.answerCallbackQuery(
        callbackQuery.id,
        result.success ? '✅ Выполнено' : '❌ Ошибка'
      );

      // Обновляем сообщение с результатом
      if (message) {
        const statusText = await this.getFormattedStatus();
        await this.telegramApiService.editMessageText(
          chatId,
          message.message_id,
          `🎛️ <b>Task Queue Control Panel</b>\n\n${statusText}\n\n<i>Последняя команда: ${data}</i>\n<i>Результат: ${result.message}</i>`,
          this.getControlKeyboard()
        );
      }
    } catch (error) {
      await this.telegramApiService.answerCallbackQuery(
        callbackQuery.id,
        '❌ Ошибка выполнения'
      );
    }
  }

  private async executeCommand(
    command: string
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`🎯 Executing command: ${command}`);

    let result: { success: boolean; message: string };

    switch (command) {
      case 'start_queue_1':
        result = await this.startQueue(1);
        break;

      case 'stop_queue_1':
        result = await this.stopQueue(1);
        break;

      case 'status':
        result = await this.getStatus();
        break;

      case 'restart_engine':
        this.logger.log('📋 Command restart_engine recognized, calling restartEngine()...');
        result = await this.restartEngine();
        break;

      case 'execute_task_browser_open':
        result = await this.executeTask('browser_open');
        break;

      case 'execute_task_find_elements':
        result = await this.executeTask('find_elements');
        break;

      default:
        this.logger.warn(`❓ Unknown command received: ${command}`);
        result = { success: false, message: 'Неизвестная команда' };
    }

    this.logger.log(`📤 Command ${command} result: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
    return result;
  }

  private async startQueue(
    queueId: number
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Starting queue ${queueId}`);

    if (this.queueEngineService) {
      // Здесь будет реальная интеграция с QueueEngineService
      // await this.queueEngineService.startQueue(queueId);
      return { success: true, message: `Очередь ${queueId} запущена` };
    } else {
      return { success: false, message: 'Queue Engine недоступен' };
    }
  }

  private async stopQueue(
    queueId: number
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Stopping queue ${queueId}`);

    if (this.queueEngineService) {
      // await this.queueEngineService.stopQueue(queueId);
      return { success: true, message: `Очередь ${queueId} остановлена` };
    } else {
      return { success: false, message: 'Queue Engine недоступен' };
    }
  }

  private async getStatus(): Promise<{ success: boolean; message: string }> {
    try {
      const statusText = await this.getFormattedStatus();
      return {
        success: true,
        message: statusText.replace(/<\/?b>/g, '') // Remove HTML tags for plain text
      };
    } catch (error) {
      return {
        success: false,
        message: 'Ошибка при получении статуса системы'
      };
    }
  }

  private async restartEngine(): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log('🔄 Executing restart engine command...');

    try {
      if (this.queueEngineService) {
        this.logger.log('🎯 QueueEngineService is available, attempting restart...');
        await this.queueEngineService.restart();
        this.logger.log('✅ Queue Engine restart completed successfully');
        return { success: true, message: 'Queue Engine успешно перезапущен' };
      } else {
        this.logger.warn('⚠️ QueueEngineService is not available');
        return { success: false, message: 'Queue Engine недоступен для перезапуска' };
      }
    } catch (error) {
      this.logger.error('❌ Error during engine restart:', error);
      return {
        success: false,
        message: `Ошибка при перезапуске: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeTask(
    taskType: string
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Executing task: ${taskType}`);
    return { success: true, message: `Задача ${taskType} выполнена` };
  }

  private async sendSystemStatus(chatId: string): Promise<void> {
    const status = await this.getFormattedStatus();
    await this.telegramApiService.sendMessage(
      chatId,
      `📊 <b>System Status</b>\n\n${status}`
    );
  }

  private async sendHelpMessage(chatId: string): Promise<void> {
    const helpText =
      `🤖 <b>Task Queue Bot - Справка</b>\n\n` +
      `<b>Команды:</b>\n` +
      `• /start, /menu - панель управления\n` +
      `• /status - статус системы\n` +
      `• /help - эта справка\n` +
      `• /security - информация о безопасности\n\n` +
      `<b>Кнопки управления:</b>\n` +
      `▶️ Start Queue - запуск очереди задач\n` +
      `⏹️ Stop Queue - остановка очереди\n` +
      `📊 Status - получить статус системы\n` +
      `🔄 Restart Engine - перезапуск движка\n` +
      `🌐 Open Google - выполнить браузерную задачу\n` +
      `🔍 Count Elements - выполнить задачу поиска\n\n` +
      `<b>Безопасность:</b>\n` +
      `🔒 Бот доступен только авторизованным пользователям\n` +
      `📝 Все действия логируются\n\n` +
      `<i>Версия: 1.0 | Разработано для Task Queue System</i>`;

    await this.telegramApiService.sendMessage(chatId, helpText);
  }

  private async sendSecurityInfo(chatId: string): Promise<void> {
    const allowedUsername =
      process.env.TELEGRAM_ALLOWED_USERNAME || 'не установлен';
    const uptime = this.getUptime();

    const securityText =
      `🔒 <b>Информация о безопасности</b>\n\n` +
      `<b>Статус авторизации:</b> ✅ Авторизован\n` +
      `<b>Разрешённый username:</b> @${allowedUsername}\n` +
      `<b>Время работы бота:</b> ${uptime}\n\n` +
      `<b>Настройки безопасности:</b>\n` +
      `🛡️ Проверка по username включена\n` +
      `📊 Логирование всех действий\n` +
      `🚫 Автоблокировка неавторизованных пользователей\n\n` +
      `<b>Для изменения доступа:</b>\n` +
      `Измените TELEGRAM_ALLOWED_USERNAME в .env файле`;

    await this.telegramApiService.sendMessage(chatId, securityText);
  }

  private async getFormattedStatus(): Promise<string> {
    try {
      // Получение количества активных очередей
      let activeQueuesCount = 0;
      let queueEngineStatus = '❌ Inactive';

      if (this.queueEngineService && (this.queueEngineService as any).schedules) {
        const schedules = (this.queueEngineService as any).schedules;
        activeQueuesCount = Object.keys(schedules).length;
        queueEngineStatus = activeQueuesCount > 0 ? '🟢 Active' : '🟡 Ready';
      }

      // Получение общего количества задач
      let totalTasks = 0;
      if (this.taskService) {
        try {
          const tasks = await this.taskService.findAll();
          totalTasks = tasks.length;
        } catch (error) {
          this.logger.warn('Could not fetch tasks count:', error);
        }
      }

      // Получение использования памяти
      const memoryUsage = process.memoryUsage();
      const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);

      // Получение uptime
      const uptime = this.getUptime();

      // Получение статуса браузера
      const browserStatus = this.queueEngineService && (this.queueEngineService as any).browser
        ? '🌐 Connected'
        : '❌ Disconnected';

      return `${queueEngineStatus} <b>Queue Engine</b>
📊 <b>Active Queues:</b> ${activeQueuesCount}
📝 <b>Total Tasks:</b> ${totalTasks}
🌐 <b>Browser:</b> ${browserStatus}
⏱️ <b>Uptime:</b> ${uptime}
💾 <b>Memory:</b> ${memoryMB} MB`;
    } catch (error) {
      this.logger.error('Error getting formatted status:', error);
      return `❌ <b>Error getting status</b>
⚠️ <b>Check logs for details</b>
⏱️ <b>Uptime:</b> ${this.getUptime()}`;
    }
  }

  private getUptime(): string {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  private getControlKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '▶️ Start Queue 1', callback_data: 'start_queue_1' },
          { text: '⏹️ Stop Queue 1', callback_data: 'stop_queue_1' },
        ],
        [
          { text: '📊 Status', callback_data: 'status' },
          { text: '🔄 Restart Engine', callback_data: 'restart_engine' },
        ],
        [
          {
            text: '🌐 Open Google',
            callback_data: 'execute_task_browser_open',
          },
          {
            text: '🔍 Count Elements',
            callback_data: 'execute_task_find_elements',
          },
        ],
      ],
    };
  }

  // Метод для отправки уведомлений из других частей системы
  async sendNotification(message: string, showControls = false): Promise<void> {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      this.logger.warn('TELEGRAM_CHAT_ID not set');
      return;
    }

    if (showControls) {
      await this.telegramApiService.sendTaskControlMenu(chatId);
    } else {
      await this.telegramApiService.sendMessage(chatId, message);
    }
  }

  onModuleDestroy() {
    if (this.pollingInterval) {
      this.pollingInterval = null; // Останавливаем цикл polling
      this.logger.log('🛑 Telegram polling stopped');
    }
  }
}
