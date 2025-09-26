import { ELockStrategy, ETaskState } from '../constants/taskConstant.js';
import { TaskModel } from './task.service.type.js';

export class QueueModel {
  constructor(
    public id: number,
    public name: string,
    public tasks: TaskModel['id'][],
    public state: (typeof ETaskState)[keyof typeof ETaskState],
    public currentTaskName: string,
    public createdAt: string,
    public updatedAt: string,
    public schedule: string,
    public lockStrategy:
      | (typeof ELockStrategy)[keyof typeof ELockStrategy]
      | null,
    public isActive = true,
    public notifyOnEmpty = true // Отправлять уведомления даже если все задачи вернули пустые результаты
  ) {}
}

export class CreateQueueDtoModel {
  constructor(
    public name: string,
    public tasks: TaskModel['id'][],
    public schedule: string,
    public lockStrategy:
      | (typeof ELockStrategy)[keyof typeof ELockStrategy]
      | null,
    public isActive: boolean,
    public notifyOnEmpty: boolean
  ) {}
}
export class UpdateQueueDtoModel {
  constructor(
    public id?: number,
    public name?: string,
    public tasks?: TaskModel['id'][],
    public state?: (typeof ETaskState)[keyof typeof ETaskState],
    public currentTaskName?: string,
    public createdAt?: string,
    public updatedAt?: string,
    public schedule?: string,
    public lockStrategy?:
      | (typeof ELockStrategy)[keyof typeof ELockStrategy]
      | null,
    public isActive?: boolean,
    public notifyOnEmpty?: boolean
  ) {}
}
export interface IQueueService {
  create(createQueueDto: CreateQueueDtoModel): Promise<QueueModel>;
  findAll(): Promise<QueueModel[]>;
  findOne(id: number): Promise<string>;
  update(id: number, updateQueueDto: UpdateQueueDtoModel): Promise<QueueModel>;
  remove(id: number): Promise<void>;
  toggleActivity?(id: number): Promise<QueueModel>;
  setActivity?(id: number, isActive: boolean): Promise<QueueModel>;
}
