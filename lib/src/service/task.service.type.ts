import type { DeleteResult } from 'typeorm';
import { ExeTypes } from '../constants/exeTypes.js';
import { QueueModel } from './queue.service.type.js';

export class TaskModel {
  constructor(
    public id: number,
    public name: string,
    public exeType: string,
    public payload: string,
    public dependencies: keyof typeof ExeTypes[],
    public createdAt: string,
    public updatedAt: string,
    public queue: QueueModel | null
  ) {}
}

export class CreateTaskDtoModel {
  constructor(
     public name: string,
    public exeType: string,
    public payload: string,
    public dependencies: keyof typeof ExeTypes[],
  ){}
}
export class UpdateTaskDtoModel {
  constructor(
    public id?: number,
    public name?: string,
    public exeType?: string,
    public payload?: string,
    public dependencies?: keyof typeof ExeTypes[],
    public createdAt?: string,
    public updatedAt?: string,
    public queue?: QueueModel | null
  ) {}
}
export interface ITaskService {
  create(createTaskDto: CreateTaskDtoModel): Promise<TaskModel>;
  findAll(): Promise<TaskModel[]>;
  findOne(id: number): Promise<string>;
  update(id: number, updateTaskDto: UpdateTaskDtoModel): Promise<string>;
  remove(id: number): Promise<string | DeleteResult>;
}
