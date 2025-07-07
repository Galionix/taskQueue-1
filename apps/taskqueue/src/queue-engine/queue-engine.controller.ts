import { Controller, Post } from '@nestjs/common';

import { QueueEngineService } from './queue-engine.service';

@Controller('queue-engine')
export class QueueEngineController {
  constructor(private readonly queueEngineService: QueueEngineService) { }


  // restart queueEngine() {

  @Post('restart')
  async restartQueueEngine() {
    await this.queueEngineService.restart();
  }
}
