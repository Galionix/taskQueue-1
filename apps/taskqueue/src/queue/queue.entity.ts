import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { ELockStrategy, ETaskState, QueueModel, TaskModel } from '@tasks/lib';
import { forwardRef, Inject } from '@nestjs/common';

// import { type } from '../../../frontend/src/api/types';
import { TaskEntity } from '../task/task.entity';

@Entity('queue')
export class QueueEntity extends QueueModel {
  constructor(
    id: number,
    name: string,
    tasks: TaskModel['id'][],
    state: (typeof ETaskState)[keyof typeof ETaskState],
    currentTaskName: string,
    createdAt: string,
    updatedAt: string,
    schedule: string,
    lockStrategy: (typeof ELockStrategy)[keyof typeof ELockStrategy] | null,
    isActive: boolean = true
  ) {
    super(
      id,
      name,
      tasks,
      state,
      currentTaskName,
      createdAt,
      updatedAt,
      schedule,
      lockStrategy,
      isActive
    );
  }
  @ApiProperty()
  @PrimaryGeneratedColumn()
  override id!: number;
  @ApiProperty()
  @Column()
  override name!: string;

  @ApiProperty()
  @Column('simple-array', { default: '' })
  override tasks!: TaskModel['id'][];

  // ManyToMany связь с задачами
  @ManyToMany(() => TaskEntity, (task) => task.queueEntities)
  taskEntities!: TaskEntity[];

  @ApiProperty()
  @Column({
    type: 'varchar',
  })
  override state!: (typeof ETaskState)[keyof typeof ETaskState];

  @ApiProperty()
  @Column()
  override currentTaskName!: string;
  @CreateDateColumn()
  override createdAt!: string;
  @ApiProperty()
  @UpdateDateColumn()
  override updatedAt!: string;
  @ApiProperty()
  @Column()
  override schedule!: string;
  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  override lockStrategy!:
    | (typeof ELockStrategy)[keyof typeof ELockStrategy]
    | null;

  @ApiProperty()
  @Column({ type: 'boolean', default: true })
  override isActive!: boolean;
}
