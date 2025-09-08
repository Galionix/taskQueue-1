import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PushoverApiService {
  private readonly logger = new Logger(PushoverApiService.name);
  private readonly PUSHOVER_API_URL = 'https://api.pushover.net/1/messages.json';

  async sendMessage(
    message: string,
    title?: string,
    actions?: Array<{
      name: string;
      text: string;
      url: string;
      url_title?: string;
    }>
  ): Promise<void> {
    try {
      const data = {
        token: process.env.PUSHOVER_TOKEN,
        user: process.env.PUSHOVER_USER,
        message,
        title: title || 'Task Queue',
        actions: actions ? JSON.stringify(actions) : undefined,
      };

      await axios.post(this.PUSHOVER_API_URL, data);

      this.logger.log('Message sent successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send message: ${errorMessage}`);
      throw error;
    }
  }

  async sendTaskNotification(taskName: string, queueId?: number): Promise<void> {
    const actions = [
      {
        name: 'start_queue_1',
        text: '▶️ Start Queue',
        url: `${process.env.TUNNEL_URL}/pushover/webhook`,
        url_title: 'Execute',
      },
      {
        name: 'stop_queue_1',
        text: '⏹️ Stop Queue',
        url: `${process.env.TUNNEL_URL}/pushover/webhook`,
        url_title: 'Stop',
      },
      {
        name: 'status',
        text: '📊 Status',
        url: `${process.env.TUNNEL_URL}/pushover/webhook`,
        url_title: 'Check',
      },
    ];

    await this.sendMessage(
      `Task "${taskName}" is ready to execute`,
      'Task Queue System',
      actions
    );
  }
}
