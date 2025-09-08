import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { forwardRef, Inject } from '@nestjs/common';
import { ExeTypes, QueueModel, TaskModel } from '@tasks/lib';

import { QueueEntity } from '../queue/queue.entity';

@Entity('task')
export class TaskEntity implements TaskModel {
  constructor(
    id: number,
    name: string,
    exeType: keyof typeof ExeTypes,
    payload: string,
    dependencies: ExeTypes[],
    createdAt: string,
    updatedAt: string,
    queues: QueueModel['id'][]
  ) {
    this.id = id;
    this.name = name;
    this.exeType = exeType;
    this.payload = payload;
    this.dependencies = dependencies;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    // queues будет вычисляться через геттер
  }

  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column()
  name!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  exeType!: keyof typeof ExeTypes;

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
  @ManyToMany(() => QueueEntity, (queue) => queue.taskEntities, {
    cascade: true,
  })
  @JoinTable({
    name: 'task_queues',
    joinColumn: {
      name: 'task_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'queue_id',
      referencedColumnName: 'id',
    },
  })
  queueEntities!: QueueEntity[];

  // Геттер для получения массива ID очередей
  get queues(): QueueModel['id'][] {
    return this.queueEntities ? this.queueEntities.map(queue => queue.id) : [];
  }

  // Сеттер для совместимости с моделью (не используется напрямую)
  set queues(queueIds: QueueModel['id'][]) {
    // Этот сеттер используется только для совместимости с моделью
    // Реальное управление связями происходит через queueEntities
  }
}
