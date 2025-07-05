import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import type { ExeTypes } from '../../types/exeTypes';
import { ApiProperty } from '@nestjs/swagger';
import { TaskEntity } from '../../task/entities/task.entity';


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
