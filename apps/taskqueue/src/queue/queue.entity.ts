import {
    Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { ETaskState, QueueModel, TaskModel } from '@tasks/lib';

import { TaskEntity } from '../task/task.entity';

@Entity('queue')
export class QueueEntity extends QueueModel {
  constructor(
    id: number,
    name: string,
    tasks: TaskModel[],
    state: keyof typeof ETaskState,
    currentTaskName: string,
    createdAt: string,
    updatedAt: string
  ) {
    super(id, name, tasks, state, currentTaskName, createdAt, updatedAt);
  }
  @ApiProperty()
  @PrimaryGeneratedColumn()
  override id!: number;
  @ApiProperty()
  @Column()
  override name!: string;

  @ApiProperty()
  @OneToMany(() => TaskEntity, (task) => task.queue, {
    cascade: ['remove'],
  })
  override tasks!: TaskEntity[];

  @ApiProperty()
  @Column({
    type: 'varchar',
  })
  override state!: keyof typeof ETaskState;

  @ApiProperty()
  @Column()
  override currentTaskName!: string;
  @CreateDateColumn()
  override createdAt!: string;
  @ApiProperty()
  @UpdateDateColumn()
  override updatedAt!: string;
}
