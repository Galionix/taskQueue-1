import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../../queue/queue.service';
import { QueueEngineService } from '../../queue-engine/queue-engine.service';
import { ETaskState } from '@tasks/lib';

export interface QueueExecutionResult {
  success: boolean;
  queueId: number;
  queueName: string;
  executionTime: number;
  log: string[];
  tasksExecuted: number;
  tasksSuccessful: number;
  tasksFailed: number;
  error?: string;
}

export interface QueueListItem {
  id: number;
  name: string;
  state: ETaskState;
  taskCount: number;
  schedule: string;
  isActive: boolean;
}

@Injectable()
export class TelegramQueueService {
  private readonly logger = new Logger(TelegramQueueService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly queueEngineService: QueueEngineService,
  ) {}

  /**
   * Получить список всех очередей для отображения в боте
   */
  async getQueuesList(): Promise<QueueListItem[]> {
    this.logger.log('📋 Getting queues list for Telegram');

    try {
      const queues = await this.queueService.findAll();

      return queues.map(queue => ({
        id: queue.id,
        name: queue.name,
        state: queue.state,
        taskCount: queue.tasks?.length || 0,
        schedule: queue.schedule,
        isActive: queue.isActive,
      }));
    } catch (error) {
      this.logger.error('❌ Error getting queues list:', error);
      throw error;
    }
  }

  /**
   * Запустить очередь один раз и получить детальный лог
   */
  async executeQueueOnce(queueId: number): Promise<QueueExecutionResult> {
    this.logger.log(`🚀 Starting one-time execution of queue ${queueId}`);

    try {
      // Получаем информацию об очереди для названия
      const queues = await this.queueService.findAll();
      const targetQueue = queues.find(q => q.id === queueId);

      if (!targetQueue) {
        throw new Error(`Queue with ID ${queueId} not found`);
      }

      // Выполняем очередь через QueueEngineService
      this.logger.log(`🔄 Delegating execution to QueueEngineService for queue ${queueId}`);
      const engineResult = await this.queueEngineService.executeQueueOnce(queueId);

      // Форматируем лог для Telegram с красивыми эмодзи
      const formattedLog = [
        `🎯 Queue: ${targetQueue.name}`,
        `📊 Tasks count: ${targetQueue.tasks?.length || 0}`,
        `🕐 Started at: ${new Date().toLocaleString()}`,
        '',
        '📝 Execution Log:',
        ...engineResult.log.map(line => `  ${line}`),
        '',
        '📈 Execution Summary:',
        `⏱️ Total time: ${engineResult.executionTime}ms`,
        `✅ Successful: ${engineResult.tasksSuccessful}`,
        `❌ Failed: ${engineResult.tasksFailed}`,
        engineResult.tasksExecuted > 0 ? `📊 Success rate: ${Math.round((engineResult.tasksSuccessful / engineResult.tasksExecuted) * 100)}%` : '📊 No tasks executed'
      ].filter(Boolean);

      this.logger.log(`✅ Queue ${queueId} execution completed. Success: ${engineResult.tasksSuccessful}, Failed: ${engineResult.tasksFailed}`);

      return {
        success: engineResult.success,
        queueId,
        queueName: targetQueue.name,
        executionTime: engineResult.executionTime,
        log: formattedLog,
        tasksExecuted: engineResult.tasksExecuted,
        tasksSuccessful: engineResult.tasksSuccessful,
        tasksFailed: engineResult.tasksFailed,
        error: engineResult.error,
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorLog = [
        `💥 Fatal error: ${errorMessage}`,
        `🕐 Error occurred at: ${new Date().toLocaleString()}`
      ];

      this.logger.error(`❌ Queue ${queueId} execution failed:`, error);

      return {
        success: false,
        queueId,
        queueName: 'Unknown Queue',
        executionTime: 0,
        log: errorLog,
        tasksExecuted: 0,
        tasksSuccessful: 0,
        tasksFailed: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Получить статус конкретной очереди
   */
  async getQueueStatus(queueId: number): Promise<string> {
    try {
      const queues = await this.queueService.findAll();
      const queue = queues.find(q => q.id === queueId);

      if (!queue) {
        return `❌ Queue ${queueId} not found`;
      }      const stateEmoji = this.getStateEmoji(queue.state);
      const stateText = this.getStateText(queue.state);
      const activityEmoji = queue.isActive ? '🟢' : '⚪';
      const activityText = queue.isActive ? 'Активна' : 'Неактивна';
      
      return [
        `🎯 Queue: ${queue.name}`,
        `${stateEmoji} Status: ${stateText}`,
        `${activityEmoji} Activity: ${activityText}`,
        `📊 Tasks: ${queue.tasks?.length || 0}`,
        `⏰ Schedule: ${queue.schedule}`,
      ].join('\n');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting queue ${queueId} status:`, error);
      return `❌ Error getting queue status: ${errorMessage}`;
    }
  }

  /**
   * Переключить активность очереди (включить/выключить автоматическое выполнение по расписанию)
   */
  async toggleQueueActivity(queueId: number): Promise<{
    success: boolean;
    queueId: number;
    queueName: string;
    isActive: boolean;
    message: string;
  }> {
    this.logger.log(`🔄 Toggling activity for queue ${queueId}`);
    
    try {
      const queues = await this.queueService.findAll();
      const targetQueue = queues.find(q => q.id === queueId);
      
      if (!targetQueue) {
        throw new Error(`Queue with ID ${queueId} not found`);
      }

      // Переключаем активность через QueueService
      const updatedQueue = await this.queueService.toggleActivity!(queueId);
      
      const statusText = updatedQueue.isActive ? 'активирована' : 'деактивирована';
      const statusEmoji = updatedQueue.isActive ? '🟢' : '⚪';
      
      const message = [
        `${statusEmoji} Очередь "${updatedQueue.name}" ${statusText}`,
        '',
        updatedQueue.isActive 
          ? '✅ Очередь будет выполняться по расписанию'
          : '⏸️ Очередь НЕ будет выполняться по расписанию',
        `📋 Ручное выполнение через бота остается доступным`,
        `⏰ Расписание: ${updatedQueue.schedule}`,
      ].join('\n');

      this.logger.log(`✅ Queue ${queueId} activity toggled to: ${updatedQueue.isActive}`);

      return {
        success: true,
        queueId,
        queueName: updatedQueue.name,
        isActive: updatedQueue.isActive,
        message,
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`❌ Failed to toggle queue ${queueId} activity:`, error);

      return {
        success: false,
        queueId,
        queueName: 'Unknown Queue',
        isActive: false,
        message: `❌ Ошибка переключения активности: ${errorMessage}`,
      };
    }
  }

  private getStateEmoji(state: ETaskState): string {
    switch (state) {
      case ETaskState.running: return '🟢';
      case ETaskState.paused: return '🟡';
      case ETaskState.stopped: return '🔴';
      case ETaskState.error: return '🔴';
      case ETaskState.locked: return '🔒';
      default: return '⚪';
    }
  }

  private getStateText(state: ETaskState): string {
    switch (state) {
      case ETaskState.running: return 'Running';
      case ETaskState.paused: return 'Paused';
      case ETaskState.stopped: return 'Stopped';
      case ETaskState.error: return 'Error';
      case ETaskState.locked: return 'Locked';
      default: return 'Unknown';
    }
  }
}
