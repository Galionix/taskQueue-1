import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateQueueDto } from './create-queue.dto';
import { QueueService } from './queue.service';
import { UpdateQueueDto } from './update-queue.dto';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  create(@Body() createQueueDto: CreateQueueDto) {
    return this.queueService.create(createQueueDto);
  }

  @Get()
  findAll() {
    return this.queueService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queueService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQueueDto: UpdateQueueDto) {
    return this.queueService.update(+id, updateQueueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queueService.remove(+id);
  }

  @Post(':id/toggle-activity')
  toggleActivity(@Param('id') id: string) {
    return this.queueService.toggleActivity(+id);
  }

  @Post(':id/set-activity')
  setActivity(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.queueService.setActivity(+id, body.isActive);
  }
}
