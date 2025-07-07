import { In, Repository } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTaskDto } from './create-task.dto';
import { TaskEntity } from './task.entity';
import { UpdateTaskDto } from './update-task.dto';

import type { ITaskService } from '@tasks/lib';
@Injectable()
export class TaskService implements ITaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity> // @InjectRepository(MessageEntity) // private readonly messagesRepositoryService: MessagesRepositoryService
  ) {}

  // TODO: type guard for payload
  create: ITaskService['create'] = async (createTaskDto: CreateTaskDto) => {
    const task = this.taskRepository.create(createTaskDto);
    const saved = await this.taskRepository.save(task);
    return saved;
  };

  findAll: ITaskService['findAll'] = async () => {
    return await this.taskRepository.find();
  };

  findOne: ITaskService['findOne'] = async (id: number) => {
    return await this.taskRepository.findOneBy({ id });
  };

  setQueueToTasks: ITaskService['setQueueToTasks'] = async (
    taskIds: number[],
    id: number
  ) => {
    if (taskIds.length === 0) {
      return 'No task ids provided';
    }
    if (!id) {
      return 'No queue id provided';
    }

    const tasksToMark = await this.taskRepository.findBy({
      id: In(taskIds),
    });
    if (tasksToMark.length === 0) {
      return `No tasks found with ids: ${taskIds}`;
    }
    const updatedTasks = tasksToMark.map((task) => {
      task.queue = id; // Cast to match the expected type
      return task;
    });
    const saved = await this.taskRepository.save(updatedTasks);
    return saved;
  };

  update: ITaskService['update'] = async (
    id: number,
    updateTaskDto: UpdateTaskDto
  ) => {
    await this.taskRepository.update(id, updateTaskDto);
    return `This action updates a #${id} task`;
  };

  remove: ITaskService['remove'] = async (id: number) => {
    const exists = await this.taskRepository.findOneBy({
      id,
    });
    if (exists) {
      return await this.taskRepository.delete({
        id,
      });
    }
    return `#${id} task doesn't exist`;
  };

  removeQueueFromTasks: ITaskService['removeQueueFromTasks'] = async (
    taskIds: number[]
  ) => {
    Logger.log('taskIds: ', taskIds);
    if (taskIds.length === 0) {
      return 'No task ids provided';
    }
    const tasksToUpdate = await this.taskRepository.findBy({
      id: In(taskIds),
    });
    Logger.log('tasksToUpdate: ', tasksToUpdate);
    if (tasksToUpdate.length === 0) {
      return `No tasks found with ids: ${taskIds}`;
    }
    const updatedTasks = tasksToUpdate.map((task) => {
      task.queue = null; // Set queue to null
      return task;
    });
    const saved = await this.taskRepository.save(updatedTasks);
    return saved;
  };

  findByIds: ITaskService['findByIds'] = async (ids: number[]) => {
    return await this.taskRepository.findBy({
      id: In(ids),
    });
  };
}
