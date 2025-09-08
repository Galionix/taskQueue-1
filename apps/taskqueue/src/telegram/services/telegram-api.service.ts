import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { InlineKeyboardMarkup } from '../utils';

@Injectable()
export class TelegramApiService {
  private readonly logger = new Logger(TelegramApiService.name);
  private readonly API_URL: string;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not set');
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
    this.API_URL = `https://api.telegram.org/bot${token}`;
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(
    chatId: string,
    text: string,
    replyMarkup?: InlineKeyboardMarkup
  ): Promise<void> {
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
      this.handleApiError(error, 'Failed to send message');
      throw error;
    }
  }

  /**
   * Send task control menu
   */
  async sendTaskControlMenu(chatId: string, keyboard: InlineKeyboardMarkup): Promise<void> {
    await this.sendMessage(
      chatId,
      '🎛️ <b>Task Queue Control Panel</b>\n\nВыберите действие:',
      keyboard
    );
  }

  /**
   * Answer callback query
   */
  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    try {
      await axios.post(`${this.API_URL}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text: text || '✅ Команда выполнена',
      });
    } catch (error) {
      this.logger.error('Failed to answer callback query:', error);
    }
  }

  /**
   * Edit message text
   */
  async editMessageText(
    chatId: string,
    messageId: number,
    text: string,
    replyMarkup?: InlineKeyboardMarkup
  ): Promise<void> {
    try {
      await axios.post(`${this.API_URL}/editMessageText`, {
        chat_id: chatId,
        message_id: messageId,
        text,
        reply_markup: replyMarkup,
        parse_mode: 'HTML',
      });
    } catch (error) {
      this.logger.error('Failed to edit message:', error);
    }
  }

  /**
   * Set webhook
   */
  async setWebhook(url: string): Promise<void> {
    try {
      await axios.post(`${this.API_URL}/setWebhook`, {
        url: `${url}/api/telegram/webhook`,
      });
      this.logger.log(`Webhook set to: ${url}/api/telegram/webhook`);
    } catch (error) {
      this.handleApiError(error, 'Failed to set webhook');
      throw error;
    }
  }

  /**
   * Delete webhook (for polling mode)
   */
  async deleteWebhook(): Promise<void> {
    try {
      await axios.post(`${this.API_URL}/deleteWebhook`);
      this.logger.log('Webhook deleted - using polling mode');
    } catch (error) {
      this.logger.error('Failed to delete webhook:', error);
    }
  }

  /**
   * Get updates (long polling)
   */
  async getUpdates(offset?: number): Promise<any[]> {
    try {
      this.logger.debug(`🔄 Requesting updates with offset: ${offset}`);

      const response = await axios.post(
        `${this.API_URL}/getUpdates`,
        {
          offset,
          timeout: 30, // Telegram timeout
        },
        {
          timeout: 35000, // HTTP timeout (больше чем Telegram timeout)
        }
      );

      const updates = response.data.result || [];

      if (updates.length > 0) {
        this.logger.debug(`📨 Received ${updates.length} updates from Telegram API`);
      } else {
        this.logger.debug('📭 No updates from Telegram API');
      }

      return updates;
    } catch (error) {
      this.handleGetUpdatesError(error);
      return [];
    }
  }

  /**
   * Check bot status
   */
  async checkBotStatus(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.API_URL}/getMe`);
      if (response.data.ok) {
        this.logger.log(`Bot connected successfully: @${response.data.result.username}`);
        return true;
      }
      return false;
    } catch (error) {
      this.handleApiError(error, 'Bot status check failed');
      return false;
    }
  }

  /**
   * Handle API errors with detailed logging
   */
  private handleApiError(error: unknown, context: string): void {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      switch (status) {
        case 401:
          this.logger.error(`${context}: Invalid bot token! Please check TELEGRAM_BOT_TOKEN in .env file`);
          break;
        case 404:
          this.logger.error(`${context}: Bot not found! Token might be invalid or bot might be deleted`);
          break;
        case 409:
          this.logger.error(`${context}: Conflict - another bot instance might be running`);
          break;
        default:
          this.logger.error(`${context} (${status}):`, data?.description || error.message);
      }
    } else {
      this.logger.error(`${context}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Handle specific getUpdates errors
   */
  private handleGetUpdatesError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 409) {
        this.logger.error('Conflict: Another bot instance is running. Stop other instances!');
      } else if (status === 401) {
        this.logger.error('Invalid bot token! Please check TELEGRAM_BOT_TOKEN in .env file');
      } else if (status === 404) {
        this.logger.error('Bot not found! Token might be invalid or bot might be deleted');
      } else {
        this.logger.error(`Telegram API error (${status}):`, data?.description || error.message);
      }
    } else {
      this.logger.error('Failed to get updates:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
