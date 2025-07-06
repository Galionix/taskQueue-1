import {
    Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';

// import { ApiProperty } from '@nestjs/swagger';
import { TaskEntity } from '../task/task.entity';

// import type { ExeTypes } from '../../constants/exeTypes';
@Entity("queue")
export class QueueEntity {

    @ApiProperty()

    @PrimaryGeneratedColumn()
    id!:number
    @ApiProperty()
    @Column()
    name!: string;

    @ApiProperty()
    @OneToMany(() => TaskEntity, (task) => task.queue, {
      cascade: ["remove"],
    })
    tasks!: TaskEntity[];

    @ApiProperty()
    @Column()
    state!: string;

    @ApiProperty()
    @Column()
    currentTaskName!: string;
    @CreateDateColumn()
    createdAt!: string
    @ApiProperty()

    @UpdateDateColumn()
    updatedAt!: string
}
