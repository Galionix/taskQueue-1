import type { ExeTypes } from '../../types/exeTypes';
import type { Task } from '../entities/task.entity';
import { Column, PrimaryGeneratedColumn } from 'typeorm';

export class CreateTaskDto implements Omit<Task, "id"> {

  @PrimaryGeneratedColumn()
  id!:number

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column()
  uniqueExeId!: string

  @Column()
  exeType!: ExeTypes

  @Column()
  notify!: boolean
}
