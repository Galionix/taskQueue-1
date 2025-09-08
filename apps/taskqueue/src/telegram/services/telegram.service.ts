import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { TelegramUpdateDto, TelegramCallbackQueryDto } from '../dto';
import { TelegramApiService } from './telegram-api.service';
import { StatusService } from './status.service';
import { TelegramQueueService } from './telegram-queue.service';
import { CommandHandler, AuthHandler } from '../handlers';
import { KeyboardUtils, MessageFormatter } from '../utils';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private pollingInterval: any = null;
  private lastUpdateId = 0;

  constructor(
    private readonly telegramApiService: TelegramApiService,
    private readonly statusService: StatusService,
    private readonly telegramQueueService: TelegramQueueService,
    private readonly commandHandler: CommandHandler,
    private readonly authHandler: AuthHandler
  ) {}

  async onModuleInit() {
    // Проверяем, что переменные окружения настроены
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      this.logger.warn('⚠️  TELEGRAM_BOT_TOKEN not set - Telegram integration disabled');
      return;
    }

    // Проверяем статус бота
    const isValid = await this.telegramApiService.checkBotStatus();
    if (!isValid) {
      this.logger.error('❌ Failed to connect to Telegram bot - polling disabled');
      return;
    }

    // Удаляем webhook и запускаем polling
    await this.telegramApiService.deleteWebhook();
    this.startPolling();
  }

  /**
   * Start polling for updates
   */
  private startPolling(): void {
    this.logger.log('🚀 Starting Telegram polling...');
    this.pollingInterval = true; // Используем как флаг
    this.pollForUpdates();
  }

  /**
   * Poll for updates from Telegram
   */
  private async pollForUpdates(): Promise<void> {
    this.logger.log('📡 Polling loop started, waiting for updates...');

    while (this.pollingInterval) {
      try {
        this.logger.debug(`🔄 Requesting updates from offset ${this.lastUpdateId + 1}`);

        // Long polling - запрос ждет до 30 секунд новых сообщений
        const updates = await this.telegramApiService.getUpdates(this.lastUpdateId + 1);

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

  /**
   * Handle incoming update
   */
  async handleUpdate(update: TelegramUpdateDto): Promise<void> {
    try {
      // Проверяем авторизацию для всех типов обновлений
      const user = this.authHandler.getUserFromUpdate(update);
      if (!user || !this.authHandler.isUserAuthorized(user)) {
        await this.handleUnauthorizedAccess(update);
        return;
      }

      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      } else if (update.message?.text) {
        await this.handleMessage(update.message.text, this.authHandler.getChatIdFromUpdate(update)!);
      }
    } catch (error) {
      this.logger.error('Error handling update:', error);
    }
  }

  /**
   * Handle unauthorized access
   */
  private async handleUnauthorizedAccess(update: TelegramUpdateDto): Promise<void> {
    const user = this.authHandler.getUserFromUpdate(update);
    const chatId = this.authHandler.getChatIdFromUpdate(update);

    if (!chatId || !user) return;

    // Отправляем сообщение о запрете доступа
    const message = this.authHandler.formatUnauthorizedMessage(user);
    await this.telegramApiService.sendMessage(chatId, message);

    // Логируем попытку несанкционированного доступа
    this.authHandler.logUnauthorizedAccess(user, chatId);
  }

  /**
   * Handle text message
   */
  private async handleMessage(text: string, chatId: string): Promise<void> {
    if (text === '/start' || text === '/menu') {
      await this.telegramApiService.sendMessage(chatId, MessageFormatter.formatWelcomeMessage());
      await this.telegramApiService.sendTaskControlMenu(chatId, KeyboardUtils.createMainMenuKeyboardV2());
    } else if (text === '/queues') {
      await this.showQueuesMenu(chatId);
    } else if (text === '/status') {
      await this.sendSystemStatus(chatId);
    } else if (text === '/help') {
      await this.telegramApiService.sendMessage(chatId, MessageFormatter.formatHelpMessage());
    } else if (text === '/security') {
      await this.sendSecurityInfo(chatId);
    } else {
      await this.telegramApiService.sendMessage(
        chatId,
        '🤖 Используйте команды:\n' +
          '• /menu - главное меню\n' +
          '• /queues - управление очередями\n' +
          '• /status - статус системы\n' +
          '• /help - помощь'
      );
    }
  }

  /**
   * Handle callback query (button press)
   */
  private async handleCallbackQuery(callbackQuery: TelegramCallbackQueryDto): Promise<void> {
    const { data, from, message } = callbackQuery;
    const chatId = message?.chat.id.toString() || from.id.toString();

    if (!data) return;

    // Логируем авторизованное действие
    this.logger.log(
      `✅ Authorized command: ${data} from @${from.username || 'unknown'} (ID: ${from.id})`
    );

    try {
      // Специальная обработка для команд навигации
      if (data === 'queues_menu') {
        await this.showQueuesMenu(chatId);
        await this.telegramApiService.answerCallbackQuery(callbackQuery.id, '📋 Меню очередей');
        return;
      }

      if (data === 'main_menu') {
        await this.telegramApiService.sendMessage(
          chatId,
          '🏠 Главное меню',
          KeyboardUtils.createMainMenuKeyboardV2()
        );
        await this.telegramApiService.answerCallbackQuery(callbackQuery.id, '🏠 Главное меню');
        return;
      }

      if (data === 'list_queues') {
        await this.showQueueList(chatId);
        await this.telegramApiService.answerCallbackQuery(callbackQuery.id, '📋 Список очередей');
        return;
      }

      // Обычная обработка команд
      const result = await this.commandHandler.executeCommand(data);

      // Отвечаем на callback
      await this.telegramApiService.answerCallbackQuery(
        callbackQuery.id,
        result.success ? '✅ Выполнено' : '❌ Ошибка'
      );

      // Отправляем результат как новое сообщение
      await this.telegramApiService.sendMessage(chatId, result.message);

      // Для команд выполнения очередей показываем обновленный список
      if (data.startsWith('execute_queue_')) {
        setTimeout(() => this.showQueueList(chatId), 1000);
      }

    } catch (error) {
      await this.telegramApiService.answerCallbackQuery(callbackQuery.id, '❌ Ошибка выполнения');
      this.logger.error('Error executing command:', error);
    }
  }

  /**
   * Send system status
   */
  private async sendSystemStatus(chatId: string): Promise<void> {
    const status = await this.statusService.getFormattedStatus();
    await this.telegramApiService.sendMessage(chatId, `📊 <b>System Status</b>\n\n${status}`);
  }

  /**
   * Send security info
   */
  private async sendSecurityInfo(chatId: string): Promise<void> {
    const allowedUsername = process.env.TELEGRAM_ALLOWED_USERNAME || 'не установлен';
    const uptime = this.getUptime();
    const securityText = MessageFormatter.formatSecurityInfo(allowedUsername, uptime);
    await this.telegramApiService.sendMessage(chatId, securityText);
  }

  /**
   * Get uptime string
   */
  private getUptime(): string {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  /**
   * Send notification (public method for external use)
   */
  async sendNotification(message: string, showControls = false): Promise<void> {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      this.logger.warn('TELEGRAM_CHAT_ID not set');
      return;
    }

    if (showControls) {
      await this.telegramApiService.sendTaskControlMenu(chatId, KeyboardUtils.createControlKeyboard());
    } else {
      await this.telegramApiService.sendMessage(chatId, message);
    }
  }

  /**
   * Show queues management menu
   */
  private async showQueuesMenu(chatId: string): Promise<void> {
    await this.telegramApiService.sendMessage(
      chatId,
      '📋 Управление очередями\n\nВыберите действие:',
      KeyboardUtils.createQueuesKeyboard()
    );
  }

  /**
   * Show list of queues with action buttons
   */
  private async showQueueList(chatId: string): Promise<void> {
    try {
      const queues = await this.telegramQueueService.getQueuesList();

      if (queues.length === 0) {
        await this.telegramApiService.sendMessage(
          chatId,
          '📋 Очереди не найдены\n\nВозможно, они еще не созданы.'
        );
        return;
      }

      const message = [
        `📋 Доступные очереди (${queues.length}):`,
        '',
        ...queues.map(
          (queue, index) =>
            `${index + 1}. **${queue.name}** (ID: ${queue.id})\n` +
            `   📊 Статус: ${this.getStateEmojiForService(queue.state)} ${
              queue.state
            }\n` +
            `   🔢 Задач: ${queue.taskCount}\n` +
            `   ⏰ Расписание: ${queue.schedule}`
        ),
        '',
        '🚀 Нажмите кнопку для запуска очереди',
        '📊 Или получите детальный статус',
      ].join('\n');

      // Создаем клавиатуру с кнопками для каждой очереди
      const keyboard = KeyboardUtils.createQueueListKeyboard(
        queues.map(q => ({ id: q.id, name: q.name, isActive: q.isActive }))
      );

      await this.telegramApiService.sendMessage(chatId, message, keyboard);
    } catch (error) {
      this.logger.error('Error showing queue list:', error);
      await this.telegramApiService.sendMessage(
        chatId,
        '❌ Ошибка при получении списка очередей'
      );
    }
  }

  private getStateEmojiForService(state: any): string {
    switch (String(state)) {
      case 'running': return '🟢';
      case 'paused': return '🟡';
      case 'stopped': return '🔴';
      default: return '⚪';
    }
  }

  onModuleDestroy() {
    if (this.pollingInterval) {
      this.pollingInterval = null; // Останавливаем цикл polling
      this.logger.log('🛑 Telegram polling stopped');
    }
  }
}
