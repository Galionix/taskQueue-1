import { Test, TestingModule } from '@nestjs/testing';
import { TaskSchedulerController } from './task-scheduler.controller';
import { TaskSchedulerService } from './task-scheduler.service';

describe('TaskSchedulerController', () => {
  let controller: TaskSchedulerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskSchedulerController],
      providers: [TaskSchedulerService],
    }).compile();

    controller = module.get<TaskSchedulerController>(TaskSchedulerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
