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
    exeType: keyof typeof ExeTypes,
    payload: string,
    dependencies: ExeTypes[],
    createdAt: string,
    updatedAt: string,
    queue: QueueModel['id'] | null
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
  @Column({ type: 'varchar' })
  override exeType!: keyof typeof ExeTypes;
  @ApiProperty()
  @Column({ type: 'simple-json' })
  override payload = '';
  @ApiProperty()
  @Column({ type: 'simple-enum' })
  override dependencies!: ExeTypes[];
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
  override queue: QueueEntity['id'] | null;
}
