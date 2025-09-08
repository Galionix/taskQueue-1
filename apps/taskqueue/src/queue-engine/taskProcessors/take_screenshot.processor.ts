import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

import { ExeTypes, ExeTypesPayloadMap } from '@tasks/lib';

import { TaskEntity } from '../../task/task.entity';
import { taskProcessorType } from './';

const execAsync = promisify(exec);
const payloadType = ExeTypesPayloadMap[ExeTypes.take_screenshot];

// Функция для отправки скриншотов в Telegram
async function sendScreenshotsToTelegram(screenshotFiles: string[], caption: string): Promise<void> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!chatId) {
    console.warn('TELEGRAM_CHAT_ID not configured, skipping screenshot send');
    return;
  }
  
  if (!botToken) {
    console.warn('TELEGRAM_BOT_TOKEN not configured, skipping screenshot send');
    return;
  }

  const axios = require('axios');
  const FormData = require('form-data');
  const fs = require('fs');
  
  const API_URL = `https://api.telegram.org/bot${botToken}`;
  
  console.log(`Attempting to send ${screenshotFiles.length} screenshots to chat ${chatId}`);

  try {
    // Сначала проверим, что бот может отправлять сообщения в чат
    try {
      const testResponse = await axios.get(`${API_URL}/getChat?chat_id=${chatId}`);
      console.log('Bot has access to chat:', testResponse.data.ok);
    } catch (testError: any) {
      console.warn('Bot test access failed:', testError.response?.data || testError.message);
      if (testError.response?.status === 403) {
        console.error('Bot does not have permission to access this chat. Please:');
        console.error('1. Make sure the bot is added to the chat');
        console.error('2. Make sure the bot has permission to send messages');
        console.error('3. Check that TELEGRAM_CHAT_ID is correct');
        return;
      }
    }

    if (screenshotFiles.length === 1) {
      // Отправляем одно фото
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('photo', fs.createReadStream(screenshotFiles[0]));
      form.append('caption', caption);
      form.append('parse_mode', 'HTML');

      const response = await axios.post(`${API_URL}/sendPhoto`, form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });
      
      console.log(`Screenshot sent successfully: ${response.data.ok}`);
    } else {
      // Отправляем группу фото
      const form = new FormData();
      form.append('chat_id', chatId);
      
      const media = screenshotFiles.map((path, index) => ({
        type: 'photo',
        media: `attach://photo${index}`,
        ...(index === 0 ? { caption, parse_mode: 'HTML' } : {})
      }));
      
      form.append('media', JSON.stringify(media));
      
      screenshotFiles.forEach((path, index) => {
        form.append(`photo${index}`, fs.createReadStream(path));
      });

      const response = await axios.post(`${API_URL}/sendMediaGroup`, form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });
      
      console.log(`Screenshots sent successfully: ${response.data.ok}`);
    }
    
    console.log(`✅ Screenshots sent to Telegram: ${screenshotFiles.length} files`);
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.error('❌ Telegram Bot Access Error (403):');
      console.error('The bot does not have permission to send messages to this chat.');
      console.error('Please check:');
      console.error('1. Bot is added to the chat');
      console.error('2. Bot has "Send Messages" permission');
      console.error('3. TELEGRAM_CHAT_ID is correct');
      console.error('4. TELEGRAM_BOT_TOKEN is valid');
    } else if (error.response?.status === 400) {
      console.error('❌ Bad Request (400):', error.response.data);
    } else {
      console.error('❌ Failed to send screenshots to Telegram:', error.response?.data || error.message);
    }
    
    // Не выбрасываем ошибку, чтобы не прерывать выполнение задачи
    console.warn('Screenshot task completed, but failed to send to Telegram');
  }
}

export const takeScreenshot = (): taskProcessorType => {
  return {
    name: 'takeScreenshot',
    description: 'Takes screenshot of all computer screens using PowerShell',
    blocks: [], // Не блокирует ресурсы
    execute: async (data: TaskEntity, storage) => {
      const payload = JSON.parse(data.payload) as typeof payloadType;

      try {
        // Создаем папку для конкретной задачи
        const taskFolderName = `task_${data.id}_${data.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const taskOutputPath = path.join(payload.outputPath, taskFolderName);
        
        // Создаем директорию если её нет
        if (!fs.existsSync(taskOutputPath)) {
          fs.mkdirSync(taskOutputPath, { recursive: true });
        }

        // Создаем уникальное имя файла с временной меткой
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = payload.filename.replace('{timestamp}', timestamp);
        const fullPath = path.join(taskOutputPath, filename);

        // Создаем PowerShell скрипт для захвата всех экранов
        const powershellScriptPath = path.join(taskOutputPath, 'screenshot_script.ps1');
        const powershellScript = `Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Получаем границы всех экранов
$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen

# Создаем bitmap для всего виртуального экрана
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height

# Создаем graphics объект
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Копируем изображение с экрана
$graphics.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bounds.Size)

# Сохраняем
$bitmap.Save('${fullPath.replace(/\\/g, '\\\\')}')

# Освобождаем ресурсы
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Screenshot saved to ${fullPath.replace(/\\/g, '\\\\')}"
Write-Host "Size: $($bounds.Width)x$($bounds.Height)"`;

        // Сохраняем скрипт во временный файл
        fs.writeFileSync(powershellScriptPath, powershellScript);

        // Выполняем PowerShell скрипт
        const command = `powershell -ExecutionPolicy Bypass -File "${powershellScriptPath}"`;
        
        console.log('Taking screenshot of all screens...');
        await execAsync(command);

        // Удаляем временный скрипт
        fs.unlinkSync(powershellScriptPath);

        // Проверяем, что файл создался
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Screenshot file was not created at ${fullPath}`);
        }

        console.log(`Screenshot saved: ${fullPath}`);

        // Добавляем информацию в storage для уведомлений
        if (payload.sendNotification) {
          const message = `Screenshot taken: ${fullPath}`;
          storage.message += storage.message ? `\n${message}` : message;
          // Добавляем путь к файлу для отправки в Telegram
          storage.screenshotFiles = [fullPath];
          
          // Отправляем скриншот в Telegram если настроен TELEGRAM_CHAT_ID
          try {
            await sendScreenshotsToTelegram([fullPath], `📸 Скриншот всех экранов из задачи: ${data.name}`);
          } catch (error: any) {
            console.warn('Failed to send screenshot to Telegram:', error.message);
            // Добавляем информацию об ошибке в storage, но не прерываем выполнение
            storage.telegramError = `Failed to send to Telegram: ${error.message}`;
          }
        }

        return {
          success: true,
          message: 'Screenshot of all screens taken successfully',
          data: {
            file: fullPath,
            outputPath: taskOutputPath,
            taskFolder: taskFolderName,
          },
        };
      } catch (error) {
        console.error('Error taking screenshot:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to take screenshot: ${errorMessage}`);
      }
    },
  };
};
