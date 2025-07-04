import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import type { ExeTypes } from '../../types/exeTypes';

@Entity()
export class TaskEntity {
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
