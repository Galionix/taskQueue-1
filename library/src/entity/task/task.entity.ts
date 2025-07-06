import {
    Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';

import { QueueEntity } from '../queue/queue.entity';

import type { ExeTypes } from '../../constants/exeTypes';
@Entity('task')
export class TaskEntity {
  constructor() {
    this.queue = null;
  }
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;
  @ApiProperty()
  @Column()
  name!: string;
  @ApiProperty()
  @Column()
  exeType!: string;
  @ApiProperty()
  @Column({ type: 'simple-json' })
  payload = '';
  @ApiProperty()
  @Column({ type: 'simple-enum' })
  dependencies!: ExeTypes[];
  @ApiProperty()
  @CreateDateColumn()
  createdAt!: string;
  @ApiProperty()
  @UpdateDateColumn()
  updatedAt!: string;

  @ApiProperty()
  @ManyToOne('queue', 'tasks', {
    nullable: true,
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  queue: QueueEntity | null;
}
