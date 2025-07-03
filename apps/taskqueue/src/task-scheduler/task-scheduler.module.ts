import { Module } from '@nestjs/common';
import { TaskSchedulerService } from './task-scheduler.service';
import { TaskSchedulerController } from './task-scheduler.controller';

@Module({
  controllers: [TaskSchedulerController],
  providers: [TaskSchedulerService],
})
export class TaskSchedulerModule {}
