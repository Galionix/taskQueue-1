import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskEntity } from './entities/task.entity';

@Injectable()
export class TaskService {

    constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity> // @InjectRepository(MessageEntity) // private readonly messagesRepositoryService: MessagesRepositoryService
  ) { }

  async create(createTaskDto: CreateTaskDto) {
       const task = this.taskRepository.create(
      createTaskDto
    );
    const saved = await this.taskRepository.save(task);
    return saved;
  }

  async findAll() {
    return await this.taskRepository.find()
  }

  findOne(id: number) {
    return `This action returns a #${id} task`;
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return `This action updates a #${id} task`;
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
