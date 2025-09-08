import { Body, Controller, Post, Logger, Get, Param } from '@nestjs/common';
import { TelegramService, TelegramApiService } from '../services';
import { TelegramUpdateDto } from '../dto';
import { KeyboardUtils } from '../utils';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramApiService: TelegramApiService
  ) {}

  /**
   * Handle webhook from Telegram
   */
  @Post('webhook')
  async handleWebhook(@Body() update: TelegramUpdateDto) {
    this.logger.log('Received Telegram webhook');
    await this.telegramService.handleUpdate(update);
    return { ok: true };
  }

  /**
   * Send control menu to chat
   */
  @Post('send-menu')
  async sendMenu() {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      return { error: 'TELEGRAM_CHAT_ID not set' };
    }

    await this.telegramApiService.sendTaskControlMenu(chatId, KeyboardUtils.createControlKeyboard());
    return { message: 'Control menu sent', chatId };
  }

  /**
   * Test bot functionality
   */
  @Get('test')
  async testBot() {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      return { error: 'TELEGRAM_CHAT_ID not set' };
    }

    try {
      await this.telegramService.sendNotification(
        '🧪 <b>Test Message</b>\n\nБот работает корректно!',
        true // показать кнопки управления
      );

      return {
        message: 'Test message sent with control panel',
        chatId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to send test message:', error);
      return {
        error: 'Failed to send test message',
        details: error instanceof Error ? error.message : 'Unknown error',
        chatId,
      };
    }
  }

  /**
   * Get chat ID helper endpoint
   */
  @Get('get-chat-id/:chatId')
  async getChatId(@Param('chatId') chatId: string) {
    this.logger.log(`🆔 Chat ID received: ${chatId}`);
    return {
      message: 'Chat ID logged successfully',
      chatId: chatId,
      instruction: `Add this to your .env file: TELEGRAM_CHAT_ID=${chatId}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
    const hasChatId = !!process.env.TELEGRAM_CHAT_ID;

    return {
      status: 'ok',
      telegram: {
        hasToken,
        hasChatId,
        configured: hasToken && hasChatId,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
