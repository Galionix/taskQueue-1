import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import type { ExeTypes } from '../../types/exeTypes';
import { ApiProperty } from '@nestjs/swagger';
import { QueueEntity } from '../../queue/entities/queue.entity';

@Entity("task")
export class TaskEntity {
  constructor() {
    this.queue = null
  }
  @ApiProperty()

  @PrimaryGeneratedColumn()
  id!:number
  @ApiProperty()
  @Column()
  name!: string;
  @ApiProperty()
  @Column()
  exeType!: string
  @ApiProperty()
  @Column({type: 'simple-json'})
  payload = "";
  @ApiProperty()
  @Column({type: 'simple-enum'})
  dependencies!: ExeTypes[];
  @ApiProperty()

  @CreateDateColumn()
  createdAt!: string
  @ApiProperty()

  @UpdateDateColumn()
  updatedAt!: string

  @ApiProperty()
  @ManyToOne(
    "queue",
    "tasks",
    {
      nullable: true,
      onDelete: "CASCADE",
      orphanedRowAction: "delete",
    }
  )
  queue: QueueEntity | null;
}
