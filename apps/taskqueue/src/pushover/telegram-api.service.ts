import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramApiService {
  private readonly logger = new Logger(TelegramApiService.name);
  private readonly API_URL: string;

  constructor() {
    this.API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  }

  async sendMessage(chatId: string, text: string, replyMarkup?: any): Promise<void> {
    try {
      const payload = {
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
        parse_mode: 'HTML',
      };

      await axios.post(`${this.API_URL}/sendMessage`, payload);
      this.logger.log(`Message sent to chat ${chatId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send message: ${errorMessage}`);
      throw error;
    }
  }

  async sendTaskControlMenu(chatId: string): Promise<void> {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '▶️ Start Queue 1', callback_data: 'start_queue_1' },
          { text: '⏹️ Stop Queue 1', callback_data: 'stop_queue_1' }
        ],
        [
          { text: '📊 Status', callback_data: 'status' },
          { text: '🔄 Restart Engine', callback_data: 'restart_engine' }
        ],
        [
          { text: '🌐 Open Google', callback_data: 'execute_task_browser_open' },
          { text: '🔍 Count Elements', callback_data: 'execute_task_find_elements' }
        ]
      ]
    };

    await this.sendMessage(
      chatId,
      '🎛️ <b>Task Queue Control Panel</b>\n\nВыберите действие:',
      keyboard
    );
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    try {
      await axios.post(`${this.API_URL}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text: text || '✅ Команда выполнена',
      });
    } catch (error) {
      this.logger.error('Failed to answer callback query');
    }
  }

  async editMessageText(chatId: string, messageId: number, text: string, replyMarkup?: any): Promise<void> {
    try {
      await axios.post(`${this.API_URL}/editMessageText`, {
        chat_id: chatId,
        message_id: messageId,
        text,
        reply_markup: replyMarkup,
        parse_mode: 'HTML',
      });
    } catch (error) {
      this.logger.error('Failed to edit message');
    }
  }

  async setWebhook(url: string): Promise<void> {
    try {
      await axios.post(`${this.API_URL}/setWebhook`, {
        url: `${url}/api/telegram/webhook`,
      });
      this.logger.log(`Webhook set to: ${url}/api/telegram/webhook`);
    } catch (error) {
      this.logger.error('Failed to set webhook');
    }
  }

  async deleteWebhook(): Promise<void> {
    try {
      await axios.post(`${this.API_URL}/deleteWebhook`);
      this.logger.log('Webhook deleted - using polling mode');
    } catch (error) {
      this.logger.error('Failed to delete webhook');
    }
  }

  async getUpdates(offset?: number): Promise<any[]> {
    try {
      this.logger.debug(`🔄 Requesting updates with offset: ${offset}`);

      const response = await axios.post(`${this.API_URL}/getUpdates`, {
        offset,
        timeout: 30, // Telegram timeout
      }, {
        timeout: 35000, // HTTP timeout (больше чем Telegram timeout)
      });

      const updates = response.data.result || [];

      if (updates.length > 0) {
        this.logger.debug(`📨 Received ${updates.length} updates from Telegram API`);
      } else {
        this.logger.debug('📭 No updates from Telegram API');
      }

      return updates;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401) {
          this.logger.error('Invalid bot token! Please check TELEGRAM_BOT_TOKEN in .env file');
        } else if (status === 404) {
          this.logger.error('Bot not found! Token might be invalid or bot might be deleted');
        } else if (status === 409) {
          this.logger.error('Conflict: Another bot instance is running. Stop other instances!');
        } else {
          this.logger.error(`Telegram API error (${status}):`, data?.description || error.message);
        }
      } else {
        this.logger.error('Failed to get updates:', error instanceof Error ? error.message : 'Unknown error');
      }
      return [];
    }
  }

  async checkBotStatus(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.API_URL}/getMe`);
      if (response.data.ok) {
        this.logger.log(`Bot connected successfully: @${response.data.result.username}`);
        return true;
      }
      return false;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          this.logger.error('❌ Invalid TELEGRAM_BOT_TOKEN! Please check your .env file');
        } else {
          this.logger.error(`❌ Bot status check failed (${status}):`, error.response?.data?.description);
        }
      } else {
        this.logger.error('❌ Bot status check failed:', error instanceof Error ? error.message : 'Unknown error');
      }
      return false;
    }
  }
}
