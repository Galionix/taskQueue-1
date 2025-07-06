import { ETaskState } from '../constants/taskConstant.js';
import { TaskModel } from './task.service.type.js';

export class QueueModel {
  constructor(
    public id: number,
    public name: string,
    public tasks: TaskModel[],
    public state: keyof typeof ETaskState,
    public currentTaskName: string,
    public createdAt: string,
    public updatedAt: string
  ) {}
}

export class CreateQueueDtoModel {
  constructor(
    public name: string,
    public tasks: TaskModel[],
  ) {}
}
export class UpdateQueueDtoModel {
  constructor(
    public id?: number,
    public name?: string,
    public tasks?: TaskModel[],
    public state?: keyof typeof ETaskState,
    public currentTaskName?: string,
    public createdAt?: string,
    public updatedAt?: string
  ) {}
}
export interface IQueueService {
  create(createQueueDto: CreateQueueDtoModel): Promise<QueueModel>;
  findAll(): Promise<string>
  findOne(id: number): Promise<string>
  update(id: number, updateQueueDto: UpdateQueueDtoModel): Promise<string>
  remove(id: number): Promise<string>
}
