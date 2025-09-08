import * as cron from 'cron';
import { Repository } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ETaskState, IQueueService } from '@tasks/lib';

import { TaskService } from '../task/task.service';
import { CreateQueueDto } from './create-queue.dto';
import { QueueEntity } from './queue.entity';

const defaultQueueParameters: Partial<QueueEntity> = {
  state: ETaskState.paused,
  currentTaskName: '',
};

@Injectable()
export class QueueService implements IQueueService {
  constructor(
    @InjectRepository(QueueEntity)
    private readonly queueRepository: Repository<QueueEntity>,
    private readonly taskService: TaskService
  ) {}
  create: IQueueService['create'] = async (createQueueDto: CreateQueueDto) => {
    const validation = cron.validateCronExpression(createQueueDto.schedule);
    if (!validation.valid) {
      throw new Error(`Invalid cron expression: ${validation.error}`);
    }

    const task = this.queueRepository.create({
      ...createQueueDto,
      ...defaultQueueParameters,
    });

    const saved = await this.queueRepository.save(task);
    if (createQueueDto.tasks.length > 0) {
      await this.taskService.setQueueToTasks(createQueueDto.tasks, saved.id);
    }
    return saved;
  };

  findAll: IQueueService['findAll'] = async () => {
    const queues = await this.queueRepository.find();
    // Transform simple-array field to ensure it's always an array of numbers
    return queues.map((queue) => ({
      ...queue,
      tasks: Array.isArray(queue.tasks)
        ? queue.tasks.map((id: string | number) =>
            typeof id === 'string' ? parseInt(id, 10) : id
          )
        : typeof queue.tasks === 'string'
        ? (queue.tasks as string)
            .split(',')
            .filter(Boolean)
            .map((id: string) => parseInt(id.trim(), 10))
        : [],
    }));
  };

  findOne: IQueueService['findOne'] = async (id: number) => {
    return `This action returns a #${id} queue`;
  };

  update: IQueueService['update'] = async (id: number, updateQueueDto) => {
    // Find the queue by id
    const queue = await this.queueRepository.findOneBy({ id });
    Logger.log('queue: ', queue);
    if (!queue) {
      throw new Error(`Queue with id ${id} not found`);
    }
    // Update the queue with the new data
    const updatedQueue = this.queueRepository.merge(queue, updateQueueDto);
    // Save the updated queue
    const savedQueue = await this.queueRepository.save(updatedQueue);

    // If tasks are changed, at first unlink the old tasks
    if (updateQueueDto.tasks) {
      // Remove the queue from all tasks
      await this.taskService.removeQueueFromTasks(queue.tasks);
      // Set the new tasks to the queue
      await this.taskService.setQueueToTasks(
        updateQueueDto.tasks,
        savedQueue.id
      );
    }
    return savedQueue;
  };

  remove: IQueueService['remove'] = async (id: number) => {
    const queue = await this.queueRepository.findOneBy({ id });
    Logger.log('queue: ', queue);
    if (!queue) {
      throw new Error(`Queue with id ${id} not found`);
    }
    // Remove the queue from all tasks
    if (queue.tasks) {
      await this.taskService.removeQueueFromTasks(queue.tasks);
    }
    // Delete the QueueController
    await this.queueRepository.delete({ id });
  };

  findActive = async () => {
    return await this.queueRepository.find({
      where: {
        isActive: true
      }
    });
  };

  /**
   * Toggle queue activity (enable/disable automatic execution by schedule)
   */
  toggleActivity = async (id: number): Promise<QueueEntity> => {
    const queue = await this.queueRepository.findOneBy({ id });
    if (!queue) {
      throw new Error(`Queue with id ${id} not found`);
    }

    queue.isActive = !queue.isActive;
    const updatedQueue = await this.queueRepository.save(queue);

    Logger.log(
      `Queue ${id} activity toggled to: ${
        updatedQueue.isActive ? 'ACTIVE' : 'INACTIVE'
      }`
    );
    return updatedQueue;
  };

  /**
   * Set queue activity status
   */
  setActivity = async (id: number, isActive: boolean): Promise<QueueEntity> => {
    const queue = await this.queueRepository.findOneBy({ id });
    if (!queue) {
      throw new Error(`Queue with id ${id} not found`);
    }

    queue.isActive = isActive;
    const updatedQueue = await this.queueRepository.save(queue);

    Logger.log(
      `Queue ${id} activity set to: ${
        updatedQueue.isActive ? 'ACTIVE' : 'INACTIVE'
      }`
    );
    return updatedQueue;
  };
  getTasks = async (id: number) => {
    const queue = await this.queueRepository.findOneBy({ id });
    if (!queue) {
      throw new Error(`Queue with id ${id} not found`);
    }
    if (!queue.tasks || queue.tasks.length === 0) {
      return [];
    }
    const tasks = await this.taskService.findByIds(queue.tasks);
    if (!tasks || tasks.length === 0) {
      throw new Error(`No tasks found for queue with id ${id}`);
    }
    return tasks;
  };
}
