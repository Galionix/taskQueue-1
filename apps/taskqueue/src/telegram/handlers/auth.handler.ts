import { Injectable, Logger } from '@nestjs/common';
import { TelegramUpdateDto, TelegramUserDto } from '../dto';
import { MessageFormatter } from '../utils';

@Injectable()
export class AuthHandler {
  private readonly logger = new Logger(AuthHandler.name);

  /**
   * Check if user is authorized to use the bot
   */
  isUserAuthorized(user: TelegramUserDto): boolean {
    const allowedUsername = process.env.TELEGRAM_ALLOWED_USERNAME;

    if (!allowedUsername) {
      this.logger.warn('TELEGRAM_ALLOWED_USERNAME not set - allowing all users');
      return true;
    }

    const isAuthorized = user.username?.toLowerCase() === allowedUsername.toLowerCase();

    if (!isAuthorized) {
      this.logger.warn(
        `Unauthorized access attempt from user: ${user.username || 'unknown'} (ID: ${user.id})`
      );
    }

    return isAuthorized;
  }

  /**
   * Get user from update
   */
  getUserFromUpdate(update: TelegramUpdateDto): TelegramUserDto | null {
    return update.callback_query?.from || update.message?.from || null;
  }

  /**
   * Get chat ID from update
   */
  getChatIdFromUpdate(update: TelegramUpdateDto): string | null {
    const chatId = update.callback_query?.message?.chat.id || update.message?.chat.id;
    return chatId ? chatId.toString() : null;
  }

  /**
   * Format unauthorized access message
   */
  formatUnauthorizedMessage(user: TelegramUserDto): string {
    const username = user?.username || 'неизвестен';
    const userId = user?.id?.toString() || 'неизвестен';
    return MessageFormatter.formatUnauthorizedMessage(username, userId);
  }

  /**
   * Log unauthorized access attempt
   */
  logUnauthorizedAccess(user: TelegramUserDto, chatId: string): void {
    const username = user?.username || 'unknown';
    const userId = user?.id || 'unknown';
    this.logger.warn(
      `🚫 Unauthorized access attempt: @${username} (ID: ${userId}) from chat ${chatId}`
    );
  }
}
