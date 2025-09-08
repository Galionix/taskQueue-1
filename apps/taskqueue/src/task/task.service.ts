import { In, Repository } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTaskDto } from './create-task.dto';
import { TaskEntity } from './task.entity';
import { UpdateTaskDto } from './update-task.dto';
import { QueueEntity } from '../queue/queue.entity';

import type { ITaskService } from '@tasks/lib';
import { ExeTypes } from '@tasks/lib';
@Injectable()
export class TaskService implements ITaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity> // @InjectRepository(MessageEntity) // private readonly messagesRepositoryService: MessagesRepositoryService
  ) {}

  // TODO: type guard for payload
  create: ITaskService['create'] = async (createTaskDto: CreateTaskDto) => {
    // Преобразуем DTO в формат для создания Entity
    const taskData: Partial<TaskEntity> = {
      name: createTaskDto.name,
      exeType: createTaskDto.exeType as keyof typeof ExeTypes,
      payload: createTaskDto.payload,
      dependencies: createTaskDto.dependencies,
    };

    const task = this.taskRepository.create(taskData);
    const saved = await this.taskRepository.save(task);

    // Если указаны очереди в DTO, добавляем их
    if (createTaskDto.queues && createTaskDto.queues.length > 0) {
      const queueRepo = this.taskRepository.manager.getRepository(QueueEntity);
      const queues = await queueRepo.findBy({ id: In(createTaskDto.queues) });

      // Загружаем сохраненную задачу с отношениями для обновления
      const taskWithRelations = await this.taskRepository.findOne({
        where: { id: saved.id },
        relations: ['queueEntities'],
      });

      if (taskWithRelations) {
        taskWithRelations.queueEntities = queues;
        await this.taskRepository.save(taskWithRelations);
        return taskWithRelations;
      }
    }

    return saved;
  };

  findAll: ITaskService['findAll'] = async () => {
    return await this.taskRepository.find({
      relations: ['queueEntities'], // Load the queue relations
    });
  };

  findOne: ITaskService['findOne'] = async (id: number) => {
    return await this.taskRepository.findOne({
      where: { id },
      relations: ['queueEntities'], // Load the queue relations
    });
  };

  setQueueToTasks: ITaskService['setQueueToTasks'] = async (
    taskIds: number[],
    queueId: number
  ) => {
    if (taskIds.length === 0) {
      return 'No task ids provided';
    }
    if (!queueId) {
      return 'No queue id provided';
    }

    // Загрузить сущности очереди
    const queueRepo = this.taskRepository.manager.getRepository(QueueEntity);
    const queue = await queueRepo.findOne({ where: { id: queueId } });
    if (!queue) {
      return `Queue with id ${queueId} not found`;
    }

    const tasksToUpdate = await this.taskRepository.find({
      where: { id: In(taskIds) },
      relations: ['queueEntities'],
    });
    if (tasksToUpdate.length === 0) {
      return `No tasks found with ids: ${taskIds}`;
    }

    const updatedTasks = tasksToUpdate.map((task) => {
      // Добавить очередь, если её ещё нет
      if (!task.queueEntities) task.queueEntities = [];
      if (!task.queueEntities.find((q) => q.id === queue.id)) {
        task.queueEntities.push(queue);
      }
      return task;
    });
    const saved = await this.taskRepository.save(updatedTasks);
    return saved;
  };

  update: ITaskService['update'] = async (
    id: number,
    updateTaskDto: UpdateTaskDto
  ) => {
    // Загружаем существующую задачу с отношениями
    const existingTask = await this.taskRepository.findOne({
      where: { id },
      relations: ['queueEntities'],
    });

    if (!existingTask) {
      throw new Error(`Task with id ${id} not found`);
    }

    // Обновляем основные поля
    if (updateTaskDto.name !== undefined) {
      existingTask.name = updateTaskDto.name;
    }
    if (updateTaskDto.payload !== undefined) {
      existingTask.payload = updateTaskDto.payload;
    }
    if (updateTaskDto.exeType !== undefined) {
      existingTask.exeType = updateTaskDto.exeType as keyof typeof ExeTypes;
    }
    if (updateTaskDto.dependencies !== undefined) {
      existingTask.dependencies = updateTaskDto.dependencies;
    }

    // Обновляем связи с очередями, если они переданы
    if (updateTaskDto.queues !== undefined) {
      if (updateTaskDto.queues.length > 0) {
        const queueRepo =
          this.taskRepository.manager.getRepository(QueueEntity);
        const queues = await queueRepo.findBy({ id: In(updateTaskDto.queues) });
        existingTask.queueEntities = queues;
      } else {
        // Если передан пустой массив, убираем все связи
        existingTask.queueEntities = [];
      }
    }

    // Сохраняем обновленную задачу
    const savedTask = await this.taskRepository.save(existingTask);
    return { affected: 1, raw: savedTask, generatedMaps: [] };
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
    const tasksToUpdate = await this.taskRepository.find({
      where: { id: In(taskIds) },
      relations: ['queueEntities'],
    });
    Logger.log('tasksToUpdate: ', tasksToUpdate);
    if (tasksToUpdate.length === 0) {
      return `No tasks found with ids: ${taskIds}`;
    }
    const updatedTasks = tasksToUpdate.map((task) => {
      // Полностью очищаем связи с очередями
      task.queueEntities = [];
      return task;
    });
    const saved = await this.taskRepository.save(updatedTasks);
    return saved;
  };

  findByIds: ITaskService['findByIds'] = async (ids: number[]) => {
    return await this.taskRepository.find({
      where: { id: In(ids) },
      relations: ['queueEntities'], // Load the queue relations
    });
  };
}
