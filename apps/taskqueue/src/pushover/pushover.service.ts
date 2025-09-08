import { Injectable, Logger, Optional } from '@nestjs/common';
import { QueueEngineService } from '../queue-engine/queue-engine.service';
import { PushoverApiService } from './pushover-api.service';
import { PushoverWebhookDto } from './dto/pushover-webhook.dto';

@Injectable()
export class PushoverService {
  private readonly logger = new Logger(PushoverService.name);

  constructor(
    @Optional() private readonly queueEngineService: QueueEngineService,
    private readonly pushoverApiService: PushoverApiService,
  ) {}

  async handleWebhook(webhookData: PushoverWebhookDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Received Pushover webhook: ${JSON.stringify(webhookData)}`);

    try {
      // Парсим команду из action
      const command = this.parseCommand(webhookData.action);

      if (!command) {
        return { success: false, message: 'Unknown command' };
      }

      // Выполняем команду через queue engine
      await this.executeCommand(command, webhookData);

      return { success: true, message: 'Command executed successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing webhook: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }

  private parseCommand(action: string): { type: string; params?: any } | null {
    // Примеры команд:
    // "start_queue_1" - запустить очередь с ID 1
    // "stop_queue_2" - остановить очередь с ID 2
    // "execute_task_browser_open" - выполнить задачу открытия браузера

    const patterns = [
      { regex: /^start_queue_(\d+)$/, type: 'start_queue' },
      { regex: /^stop_queue_(\d+)$/, type: 'stop_queue' },
      { regex: /^execute_task_(.+)$/, type: 'execute_task' },
      { regex: /^status$/, type: 'status' },
    ];

    for (const pattern of patterns) {
      const match = action.match(pattern.regex);
      if (match) {
        return {
          type: pattern.type,
          params: match[1] || null,
        };
      }
    }

    return null;
  }

  private async executeCommand(command: { type: string; params?: any }, webhookData: PushoverWebhookDto): Promise<void> {
    switch (command.type) {
      case 'start_queue':
        await this.startQueue(Number(command.params));
        break;

      case 'stop_queue':
        await this.stopQueue(Number(command.params));
        break;

      case 'execute_task':
        await this.executeTask(command.params);
        break;

      case 'status':
        await this.getStatus();
        break;

      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }
  }

  private async startQueue(queueId: number): Promise<void> {
    this.logger.log(`Starting queue ${queueId}`);
    if (this.queueEngineService) {
      // Интеграция с вашим QueueEngineService
      // await this.queueEngineService.startQueue(queueId);
      this.logger.log('Queue engine service available - would start queue');
    } else {
      this.logger.warn('Queue engine service not available');
    }
  }

  private async stopQueue(queueId: number): Promise<void> {
    this.logger.log(`Stopping queue ${queueId}`);
    if (this.queueEngineService) {
      // await this.queueEngineService.stopQueue(queueId);
      this.logger.log('Queue engine service available - would stop queue');
    } else {
      this.logger.warn('Queue engine service not available');
    }
  }

  private async executeTask(taskType: string): Promise<void> {
    this.logger.log(`Executing task: ${taskType}`);
    if (this.queueEngineService) {
      // Создание и выполнение конкретной задачи
      // await this.queueEngineService.executeTask(taskType);
      this.logger.log('Queue engine service available - would execute task');
    } else {
      this.logger.warn('Queue engine service not available');
    }
  }

  private async getStatus(): Promise<void> {
    this.logger.log('Getting system status');
    // Получение статуса системы
  }

  // Метод для отправки уведомлений через Pushover
  async sendNotification(message: string, title?: string, actions?: any[]): Promise<void> {
    await this.pushoverApiService.sendMessage(message, title, actions);
  }

  async sendTaskReadyNotification(taskName: string): Promise<void> {
    // Отправляем push уведомление
    await this.pushoverApiService.sendTaskNotification(taskName);

    this.logger.log(`Task notification sent for: ${taskName}`);
  }

  // Новый метод для отправки уведомлений о статусе
  async sendStatusNotification(status: string): Promise<void> {
    // Push уведомление
    await this.pushoverApiService.sendMessage(
      `System Status: ${status}`,
      'Task Queue System'
    );

    this.logger.log(`Status notification sent: ${status}`);
  }
}
