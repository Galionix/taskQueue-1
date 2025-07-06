import {
    Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { ExeTypes, QueueModel, TaskModel } from '@tasks/lib';

import { QueueEntity } from '../queue/queue.entity';

@Entity('task')
export class TaskEntity extends TaskModel {
  constructor(
    id: number,
    name: string,
    exeType: string,
    payload: string,
    dependencies: keyof (typeof ExeTypes)[],
    createdAt: string,
    updatedAt: string,
    queue: QueueModel | null
  ) {
    super(
      id,
      name,
      exeType,
      payload,
      dependencies,
      createdAt,
      updatedAt,
      queue
    );
    this.queue = null;
  }
  @ApiProperty()
  @PrimaryGeneratedColumn()
  override id!: number;
  @ApiProperty()
  @Column()
  override name!: string;
  @ApiProperty()
  @Column()
  override exeType!: string;
  @ApiProperty()
  @Column({ type: 'simple-json' })
  override payload = '';
  @ApiProperty()
  @Column({ type: 'simple-enum' })
  override dependencies!: keyof (typeof ExeTypes)[];
  @ApiProperty()
  @CreateDateColumn()
  override createdAt!: string;
  @ApiProperty()
  @UpdateDateColumn()
  override updatedAt!: string;

  @ApiProperty()
  @ManyToOne('queue', 'tasks', {
    nullable: true,
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  override queue: QueueEntity | null;
}
