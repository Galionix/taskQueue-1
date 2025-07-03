import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskSchedulerService } from './task-scheduler.service';

@Controller('task-scheduler')
export class TaskSchedulerController {
  constructor(private readonly taskSchedulerService: TaskSchedulerService) {}

  @Post()
  create(@Body() createTaskSchedulerDto: CreateTaskDto) {
    return this.taskSchedulerService.create(createTaskSchedulerDto);
  }

  @Get()
  findAll() {
    return this.taskSchedulerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskSchedulerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskSchedulerDto: UpdateTaskDto) {
    return this.taskSchedulerService.update(+id, updateTaskSchedulerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskSchedulerService.remove(+id);
  }
}
