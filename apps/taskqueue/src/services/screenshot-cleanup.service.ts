import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ScreenshotCleanupService implements OnModuleInit {
  private readonly logger = new Logger(ScreenshotCleanupService.name);
  private readonly screenshotsPath = 'C:\\screenshots\\';

  onModuleInit() {
    this.cleanupScreenshotsFolder();
  }

  /**
   * Очищает папку со скриншотами при запуске приложения
   */
  private cleanupScreenshotsFolder(): void {
    try {
      if (fs.existsSync(this.screenshotsPath)) {
        const files = fs.readdirSync(this.screenshotsPath);
        
        files.forEach(file => {
          const filePath = path.join(this.screenshotsPath, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            // Удаляем папки задач
            this.removeDirectory(filePath);
          } else if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            // Удаляем старые скриншоты
            fs.unlinkSync(filePath);
          }
        });
        
        this.logger.log(`✅ Screenshots folder cleaned: ${this.screenshotsPath}`);
      } else {
        // Создаем папку если её нет
        fs.mkdirSync(this.screenshotsPath, { recursive: true });
        this.logger.log(`✅ Screenshots folder created: ${this.screenshotsPath}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to cleanup screenshots folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Рекурсивно удаляет директорию
   */
  private removeDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          this.removeDirectory(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      });
      
      fs.rmdirSync(dirPath);
    }
  }

  /**
   * Получить путь к папке скриншотов
   */
  getScreenshotsPath(): string {
    return this.screenshotsPath;
  }
}
