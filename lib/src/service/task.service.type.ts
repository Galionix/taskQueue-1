import type { DeleteResult, UpdateResult } from 'typeorm';
import { ExeTypes } from '../constants/exeTypes.js';
import { QueueModel } from './queue.service.type.js';

export class TaskModel {
  constructor(
    public id: number,
    public name: string,
    public exeType: keyof typeof ExeTypes,
    public payload: string,
    public dependencies: ExeTypes[],
    public createdAt: string,
    public updatedAt: string,
    public queues: QueueModel['id'][] // Только новый формат: массив ID очередей
  ) {}
}
export class CreateTaskDtoModel {
  constructor(
    public name: string,
    public exeType: string,
    public payload: string,
    public dependencies: ExeTypes[],
    public queues: QueueModel['id'][] // Массив ID очередей
  ) {}
}

export class UpdateTaskDtoModel {
  constructor(
    public id?: number,
    public name?: string,
    public exeType?: string,
    public payload?: string,
    public dependencies?: ExeTypes[],
    public createdAt?: string,
    public updatedAt?: string,
    public queues?: QueueModel['id'][] // Массив ID очередей
  ) {}
}
export interface ITaskService {
  create(createTaskDto: CreateTaskDtoModel): Promise<TaskModel>;
  findAll(): Promise<TaskModel[]>;
  findOne(id: number): Promise<TaskModel | null>;
  setQueueToTasks(taskIds: number[], id: number): Promise<string | TaskModel[]>;
  update(id: number, updateTaskDto: UpdateTaskDtoModel): Promise<UpdateResult>;
  remove(id: number): Promise<string | DeleteResult>;
  removeQueueFromTasks(taskIds: number[]): Promise<string | TaskModel[]>;
  findByIds(ids: number[]): Promise<TaskModel[]>;
}
