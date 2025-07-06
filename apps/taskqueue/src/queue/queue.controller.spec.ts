import { Test, TestingModule } from '@nestjs/testing';

import { QueueService } from '../../../../lib/src/service/queue.service';
import { QueueController } from './queue.controller';

describe('QueueController', () => {
  let controller: QueueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [QueueService],
    }).compile();

    controller = module.get<QueueController>(QueueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
