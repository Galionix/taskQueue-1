import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateQueueDto } from './create-queue.dto';
import { QueueEntity } from './queue.entity';

import type { IQueueService } from '@tasks/lib';
const defaultQueueParameters: Partial<QueueEntity> = {
  state: 'paused',
  currentTaskName: '',
};

@Injectable()
export class QueueService implements IQueueService {
  constructor(
    @InjectRepository(QueueEntity)
    private readonly queueRepository: Repository<QueueEntity> // @InjectRepository(MessageEntity) // private readonly messagesRepositoryService: MessagesRepositoryService
  ) {}
  create: IQueueService["create"] = async (createQueueDto: CreateQueueDto) => {
    const task = this.queueRepository.create({
      ...createQueueDto,
      ...defaultQueueParameters,
    });
    const saved = await this.queueRepository.save(task);
    return saved;
  }

  findAll: IQueueService["findAll"] = async () => {
    return `This action returns all queue`;
  }

  findOne: IQueueService["findOne"] = async (id: number) => {
    return `This action returns a #${id} queue`;
  }

  update: IQueueService["update"] = async (id: number, updateQueueDto) => {
    return `This action updates a #${id} queue`;
  }

  remove: IQueueService["remove"] = async (id: number) => {
    return `This action removes a #${id} queue`;
  }
}
