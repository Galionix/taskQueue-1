import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateQueueDto, QueueEntity, UpdateQueueDto } from '../entity';

const defaultQueueParameters: Partial<QueueEntity> = {
  state: 'paused',
  currentTaskName: '',
};
@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntity)
    private readonly queueRepository: Repository<QueueEntity> // @InjectRepository(MessageEntity) // private readonly messagesRepositoryService: MessagesRepositoryService
  ) {}
  async create(createQueueDto: CreateQueueDto) {
    const task = this.queueRepository.create({
      ...createQueueDto,
      ...defaultQueueParameters,
    });
    const saved = await this.queueRepository.save(task);
    return saved;
  }

  async findAll() {
    return `This action returns all queue`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} queue`;
  }

  async update(id: number, updateQueueDto: UpdateQueueDto) {
    return `This action updates a #${id} queue`;
  }

  async remove(id: number) {
    return `This action removes a #${id} queue`;
  }
}
