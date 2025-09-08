import { ExeTypes } from '@tasks/lib';
import { TaskModel } from '@tasks/lib';
import { taskProcessorType } from './';
import { Injectable } from '@nestjs/common';

// Интерфейс для внедрения TelegramApiService
interface ITelegramApiService {
  sendPhoto(chatId: string, photoPath: string, caption?: string): Promise<void>;
  sendMediaGroup(chatId: string, photoPaths: string[], caption?: string): Promise<void>;
}

export const sendScreenshotsToTelegram = (telegramApiService?: ITelegramApiService): taskProcessorType => {
  return {
    name: 'sendScreenshotsToTelegram',
    description: 'Sends screenshots from storage to Telegram',
    blocks: [],
    execute: async (data: TaskModel, storage) => {
      // Проверяем наличие скриншотов в storage
      if (!storage.screenshotFiles || storage.screenshotFiles.length === 0) {
        return {
          success: true,
          message: 'No screenshots found in storage'
        };
      }

      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (!chatId) {
        return {
          success: false,
          message: 'TELEGRAM_CHAT_ID not configured'
        };
      }

      if (!telegramApiService) {
        return {
          success: false,
          message: 'TelegramApiService not available'
        };
      }

      try {
        const screenshotFiles = storage.screenshotFiles as string[];
        const caption = storage.message || `📸 Скриншоты из задачи: ${data.name}`;

        if (screenshotFiles.length === 1) {
          // Отправляем одно фото
          await telegramApiService.sendPhoto(chatId, screenshotFiles[0], caption);
        } else {
          // Отправляем группу фото
          await telegramApiService.sendMediaGroup(chatId, screenshotFiles, caption);
        }

        // Очищаем storage после отправки
        storage.screenshotFiles = [];

        return {
          success: true,
          message: `Screenshots sent to Telegram: ${screenshotFiles.length} files`,
          data: {
            sentFiles: screenshotFiles.length,
            chatId
          },
        };
      } catch (error) {
        console.error('Error sending screenshots to Telegram:', error);
        return {
          success: false,
          message: `Failed to send screenshots: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  };
};
