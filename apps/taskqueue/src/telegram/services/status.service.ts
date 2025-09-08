import { Injectable, Logger, Optional } from '@nestjs/common';
import { QueueEngineService } from '../../queue-engine/queue-engine.service';
import { QueueService } from '../../queue/queue.service';
import { TaskService } from '../../task/task.service';
import { MessageFormatter } from '../utils';

export interface SystemStatus {
  queueEngineStatus: string;
  activeQueuesCount: number;
  totalTasks: number;
  browserStatus: string;
  uptime: string;
  memoryMB: number;
}

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);

  constructor(
    @Optional() private readonly queueEngineService?: QueueEngineService,
    @Optional() private readonly queueService?: QueueService,
    @Optional() private readonly taskService?: TaskService
  ) {}

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      // Получение количества активных очередей
      let activeQueuesCount = 0;
      let queueEngineStatus = '❌ Inactive';

      if (this.queueEngineService && (this.queueEngineService as any).schedules) {
        const schedules = (this.queueEngineService as any).schedules;
        activeQueuesCount = Object.keys(schedules).length;
        queueEngineStatus = activeQueuesCount > 0 ? '🟢 Active' : '🟡 Ready';
      }

      // Получение общего количества задач
      let totalTasks = 0;
      if (this.taskService) {
        try {
          const tasks = await this.taskService.findAll();
          totalTasks = tasks.length;
        } catch (error) {
          this.logger.warn('Could not fetch tasks count:', error);
        }
      }

      // Получение использования памяти
      const memoryUsage = process.memoryUsage();
      const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);

      // Получение uptime
      const uptime = this.getUptime();

      // Получение статуса браузера
      const browserStatus = this.queueEngineService && (this.queueEngineService as any).browser
        ? '🌐 Connected'
        : '❌ Disconnected';

      return {
        queueEngineStatus,
        activeQueuesCount,
        totalTasks,
        browserStatus,
        uptime,
        memoryMB,
      };
    } catch (error) {
      this.logger.error('Error getting system status:', error);
      throw error;
    }
  }

  /**
   * Get formatted status string for display
   */
  async getFormattedStatus(): Promise<string> {
    try {
      const status = await this.getSystemStatus();
      return MessageFormatter.formatSystemStatus(status);
    } catch (error) {
      this.logger.error('Error getting formatted status:', error);
      return `❌ <b>Error getting status</b>
⚠️ <b>Check logs for details</b>
⏱️ <b>Uptime:</b> ${this.getUptime()}`;
    }
  }

  /**
   * Get uptime string
   */
  private getUptime(): string {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
