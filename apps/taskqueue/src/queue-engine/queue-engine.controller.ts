import { Controller, Post, Param } from '@nestjs/common';

import { QueueEngineService } from './queue-engine.service';

@Controller('queue-engine')
export class QueueEngineController {
  constructor(private readonly queueEngineService: QueueEngineService) { }

  @Post('restart')
  async restartQueueEngine() {
    await this.queueEngineService.restart();
  }

  @Post('execute/:queueId')
  async executeQueueOnce(@Param('queueId') queueId: string) {
    const id = parseInt(queueId, 10);
    if (isNaN(id)) {
      throw new Error('Invalid queue ID');
    }
    return await this.queueEngineService.executeQueueOnce(id);
  }
}
