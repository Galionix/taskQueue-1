import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore - screenshot-desktop не имеет типов
import screenshot from 'screenshot-desktop';

import { ExeTypes, ExeTypesPayloadMap } from '@tasks/lib';

import { TaskEntity } from '../../task/task.entity';
import { taskProcessorType } from './';

const payloadType = ExeTypesPayloadMap[ExeTypes.take_screenshot];

export const takeScreenshot = (): taskProcessorType => {
  return {
    name: 'takeScreenshot',
    description: 'Takes screenshots of all computer screens',
    blocks: [], // Не блокирует ресурсы, так как screenshot-desktop работает независимо
    execute: async (data: TaskEntity, storage) => {
      const payload = JSON.parse(data.payload) as typeof payloadType;

      try {
        // Создаем директорию если её нет
        if (!fs.existsSync(payload.outputPath)) {
          fs.mkdirSync(payload.outputPath, { recursive: true });
        }

        // Создаем уникальное имя файла с временной меткой
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = payload.filename.replace('{timestamp}', timestamp);
        const fullPath = path.join(payload.outputPath, filename);

        if (payload.allScreens) {
          // Делаем скриншот всех экранов
          const screenshots = await screenshot.all();

          const savedFiles: string[] = [];

          for (let i = 0; i < screenshots.length; i++) {
            const screenFilename = filename.replace(
              '.png',
              `_screen${i + 1}.png`
            );
            const screenPath = path.join(payload.outputPath, screenFilename);

            fs.writeFileSync(screenPath, screenshots[i]);
            savedFiles.push(screenPath);

            console.log(`Screenshot saved: ${screenPath}`);
          }

          // Добавляем информацию в storage для уведомлений
          if (payload.sendNotification) {
            const message = `Screenshots taken: ${savedFiles.length} screens saved to ${payload.outputPath}`;
            storage.message += storage.message ? `\n${message}` : message;
          }

          return {
            success: true,
            message: `Screenshots taken successfully: ${savedFiles.length} screens`,
            data: {
              files: savedFiles,
              screensCount: screenshots.length,
              outputPath: payload.outputPath,
            },
          };
        } else {
          // Делаем скриншот основного экрана
          const img = await screenshot();
          fs.writeFileSync(fullPath, img);

          // Добавляем информацию в storage для уведомлений
          if (payload.sendNotification) {
            const message = `Screenshot taken: ${fullPath}`;
            storage.message += storage.message ? `\n${message}` : message;
          }

          console.log(`Screenshot saved: ${fullPath}`);

          return {
            success: true,
            message: 'Screenshot taken successfully',
            data: {
              file: fullPath,
              screensCount: 1,
              outputPath: payload.outputPath,
            },
          };
        }
      } catch (error) {
        console.error('Error taking screenshot:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to take screenshot: ${errorMessage}`);
      }
    },
  };
};
