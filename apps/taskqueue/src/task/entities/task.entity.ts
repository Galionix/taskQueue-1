import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import type { ExeTypes } from '../../types/exeTypes';
import { ApiProperty } from '@nestjs/swagger';

@Entity("task")
export class TaskEntity {
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
}
