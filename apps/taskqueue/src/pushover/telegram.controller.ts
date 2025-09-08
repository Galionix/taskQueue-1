import { Body, Controller, Post, Logger, Get, Param } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramApiService } from './telegram-api.service';
import { TelegramUpdateDto } from './dto/telegram.dto';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramApiService: TelegramApiService,
  ) {}

  @Post('webhook')
  async handleWebhook(@Body() update: TelegramUpdateDto) {
    this.logger.log('Received Telegram webhook');
    await this.telegramService.handleUpdate(update);
    return { ok: true };
  }

  @Post('send-menu')
  async sendMenu() {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      return { error: 'TELEGRAM_CHAT_ID not set' };
    }

    await this.telegramApiService.sendTaskControlMenu(chatId);
    return { message: 'Control menu sent' };
  }

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
      };
    } catch (error) {
      return {
        error: 'Failed to send test message',
        details: error instanceof Error ? error.message : 'Unknown error',
        chatId,
      };
    }
  }

  @Get('get-chat-id/:chatId')
  async getChatId(@Param('chatId') chatId: string) {
    this.logger.log(`🆔 Chat ID received: ${chatId}`);
    return {
      message: 'Chat ID logged successfully',
      chatId: chatId,
      instruction: `Add this to your .env file: TELEGRAM_CHAT_ID=${chatId}`,
    };
  }
}
