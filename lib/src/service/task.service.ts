import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTaskDto, TaskEntity, UpdateTaskDto } from '../entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity> // @InjectRepository(MessageEntity) // private readonly messagesRepositoryService: MessagesRepositoryService
  ) {}

  // TODO: type guard for payload
  async create(createTaskDto: CreateTaskDto) {
    const task = this.taskRepository.create(createTaskDto);
    const saved = await this.taskRepository.save(task);
    return saved;
  }

  async findAll() {
    return await this.taskRepository.find();
  }

  async findOne(id: number) {
    return `This action returns a #${id} task`;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    return `This action updates a #${id} task`;
  }

  async remove(id: number) {
    const exists = await this.taskRepository.findOneBy({
      id,
    });
    if (exists) {
      return await this.taskRepository.delete({
        id,
      });
    }
    return `#${id} task doesn't exist`;
  }
}
