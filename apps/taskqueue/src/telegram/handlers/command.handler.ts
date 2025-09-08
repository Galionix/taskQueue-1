import { Injectable, Logger } from '@nestjs/common';
import { QueueEngineService } from '../../queue-engine/queue-engine.service';

export interface CommandResult {
  success: boolean;
  message: string;
}

@Injectable()
export class CommandHandler {
  private readonly logger = new Logger(CommandHandler.name);

  constructor(private readonly queueEngineService?: QueueEngineService) {}

  /**
   * Execute a command based on callback data
   */
  async executeCommand(command: string): Promise<CommandResult> {
    this.logger.log(`🎯 Executing command: ${command}`);

    let result: CommandResult;

    switch (command) {
      case 'start_queue_1':
        result = await this.startQueue(1);
        break;

      case 'stop_queue_1':
        result = await this.stopQueue(1);
        break;

      case 'status':
        result = await this.getStatus();
        break;

      case 'restart_engine':
        this.logger.log('📋 Command restart_engine recognized, calling restartEngine()...');
        result = await this.restartEngine();
        break;

      case 'execute_task_browser_open':
        result = await this.executeTask('browser_open');
        break;

      case 'execute_task_find_elements':
        result = await this.executeTask('find_elements');
        break;

      default:
        this.logger.warn(`❓ Unknown command received: ${command}`);
        result = { success: false, message: 'Неизвестная команда' };
    }

    this.logger.log(`📤 Command ${command} result: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
    return result;
  }

  private async startQueue(queueId: number): Promise<CommandResult> {
    this.logger.log(`Starting queue ${queueId}`);

    if (this.queueEngineService) {
      // TODO: Implement real queue start logic
      return { success: true, message: `Очередь ${queueId} запущена` };
    } else {
      return { success: false, message: 'Queue Engine недоступен' };
    }
  }

  private async stopQueue(queueId: number): Promise<CommandResult> {
    this.logger.log(`Stopping queue ${queueId}`);

    if (this.queueEngineService) {
      // TODO: Implement real queue stop logic
      return { success: true, message: `Очередь ${queueId} остановлена` };
    } else {
      return { success: false, message: 'Queue Engine недоступен' };
    }
  }

  private async getStatus(): Promise<CommandResult> {
    // This will be handled by status service
    return {
      success: true,
      message: 'Статус получен успешно'
    };
  }

  private async restartEngine(): Promise<CommandResult> {
    this.logger.log('🔄 Executing restart engine command...');

    try {
      if (this.queueEngineService) {
        this.logger.log('🎯 QueueEngineService is available, attempting restart...');
        await this.queueEngineService.restart();
        this.logger.log('✅ Queue Engine restart completed successfully');
        return { success: true, message: 'Queue Engine успешно перезапущен' };
      } else {
        this.logger.warn('⚠️ QueueEngineService is not available');
        return { success: false, message: 'Queue Engine недоступен для перезапуска' };
      }
    } catch (error) {
      this.logger.error('❌ Error during engine restart:', error);
      return {
        success: false,
        message: `Ошибка при перезапуске: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeTask(taskType: string): Promise<CommandResult> {
    this.logger.log(`Executing task: ${taskType}`);
    return { success: true, message: `Задача ${taskType} выполнена` };
  }
}
