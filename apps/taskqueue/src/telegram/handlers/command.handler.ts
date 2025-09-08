import { Injectable, Logger } from '@nestjs/common';
import { QueueEngineService } from '../../queue-engine/queue-engine.service';
import { TelegramQueueService } from '../services/telegram-queue.service';
import { ETaskState } from '@tasks/lib';

export interface CommandResult {
  success: boolean;
  message: string;
}

@Injectable()
export class CommandHandler {
  private readonly logger = new Logger(CommandHandler.name);

  constructor(
    private readonly queueEngineService?: QueueEngineService,
    private readonly telegramQueueService?: TelegramQueueService,
  ) {}

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

      case 'list_queues':
        result = await this.listQueues();
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

      case 'queues_menu':
        result = await this.showQueuesMenu();
        break;

      case 'main_menu':
        result = await this.showMainMenu();
        break;

      case 'help':
        result = await this.showHelp();
        break;

      default:
        // Проверяем, не является ли это командой запуска конкретной очереди
        if (command.startsWith('execute_queue_')) {
          const queueIdStr = command.replace('execute_queue_', '');
          const queueId = parseInt(queueIdStr, 10);
          if (!isNaN(queueId)) {
            result = await this.executeQueue(queueId);
            break;
          }
        }
        
        // Проверяем, не является ли это командой получения статуса очереди
        if (command.startsWith('queue_status_')) {
          const queueIdStr = command.replace('queue_status_', '');
          const queueId = parseInt(queueIdStr, 10);
          if (!isNaN(queueId)) {
            result = await this.getQueueStatus(queueId);
            break;
          }
        }

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

  private async listQueues(): Promise<CommandResult> {
    this.logger.log('📋 Getting list of all queues');
    
    try {
      if (!this.telegramQueueService) {
        return { success: false, message: 'TelegramQueueService недоступен' };
      }

      const queues = await this.telegramQueueService.getQueuesList();
      
      if (queues.length === 0) {
        return { success: true, message: '📋 Очереди не найдены' };
      }

      const queueList = queues.map((queue, index) => 
        `${index + 1}. 📋 ${queue.name} (ID: ${queue.id})\n` +
        `   📊 Статус: ${this.getStateEmoji(queue.state)} ${queue.state}\n` +
        `   🔢 Задач: ${queue.taskCount}\n` +
        `   ⏰ Расписание: ${queue.schedule}\n`
      ).join('\n');

      return {
        success: true,
        message: `📋 Список очередей (${queues.length}):\n\n${queueList}`
      };
    } catch (error) {
      this.logger.error('❌ Error getting queues list:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `❌ Ошибка получения списка очередей: ${errorMessage}` };
    }
  }

  private async executeQueue(queueId: number): Promise<CommandResult> {
    this.logger.log(`🚀 Executing queue ${queueId} once`);
    
    try {
      if (!this.telegramQueueService) {
        return { success: false, message: 'TelegramQueueService недоступен' };
      }

      const result = await this.telegramQueueService.executeQueueOnce(queueId);
      
      // Форматируем лог для Telegram (ограничиваем размер)
      const logPreview = result.log.slice(0, 15).join('\n');
      const isLogTruncated = result.log.length > 15;
      
      const message = [
        `🚀 Выполнение очереди "${result.queueName}" завершено`,
        '',
        `📊 Результат: ${result.success ? '✅ Успешно' : '❌ Ошибки'}`,
        `⏱️ Время выполнения: ${result.executionTime}ms`,
        `📈 Выполнено задач: ${result.tasksExecuted}`,
        `✅ Успешно: ${result.tasksSuccessful}`,
        `❌ Ошибок: ${result.tasksFailed}`,
        '',
        '📋 Лог выполнения:',
        logPreview,
        isLogTruncated ? '\n... (лог сокращен)' : '',
        result.error ? `\n💥 Ошибка: ${result.error}` : ''
      ].filter(Boolean).join('\n');

      return { success: result.success, message };
    } catch (error) {
      this.logger.error(`❌ Error executing queue ${queueId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `❌ Ошибка выполнения очереди: ${errorMessage}` };
    }
  }

  private async getQueueStatus(queueId: number): Promise<CommandResult> {
    this.logger.log(`📊 Getting status for queue ${queueId}`);
    
    try {
      if (!this.telegramQueueService) {
        return { success: false, message: 'TelegramQueueService недоступен' };
      }

      const status = await this.telegramQueueService.getQueueStatus(queueId);
      return { success: true, message: status };
    } catch (error) {
      this.logger.error(`❌ Error getting queue ${queueId} status:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `❌ Ошибка получения статуса: ${errorMessage}` };
    }
  }

  private getStateEmoji(state: ETaskState): string {
    switch (state) {
      case ETaskState.running: return '🟢';
      case ETaskState.paused: return '🟡';
      case ETaskState.stopped: return '🔴';
      default: return '⚪';
    }
  }

  private async showQueuesMenu(): Promise<CommandResult> {
    this.logger.log('📋 Showing queues menu');
    return {
      success: true,
      message: '📋 Управление очередями\n\nВыберите действие:'
    };
  }

  private async showMainMenu(): Promise<CommandResult> {
    this.logger.log('🏠 Showing main menu');
    return {
      success: true,
      message: '🏠 Главное меню\n\nВыберите действие:'
    };
  }

  private async showHelp(): Promise<CommandResult> {
    this.logger.log('❓ Showing help information');
    const helpText = [
      '❓ Справка по командам:',
      '',
      '📋 Управление очередями:',
      '• 📋 Список очередей - показать все доступные очереди',
      '• 🚀 Запустить очередь - выполнить все задачи очереди один раз',
      '• 📊 Статус очереди - получить информацию о состоянии очереди',
      '',
      '🔧 Управление системой:',
      '• 📊 Общий статус - статус всей системы',
      '• 🔄 Restart Engine - перезапустить движок очередей',
      '',
      '💡 Подсказки:',
      '• Очереди выполняются последовательно',
      '• В логе показывается детальная информация о выполнении',
      '• При ошибках система продолжает работу с следующими задачами',
    ].join('\n');

    return {
      success: true,
      message: helpText
    };
  }
}
