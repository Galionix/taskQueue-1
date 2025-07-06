import { PickType } from '@nestjs/swagger';
import { CreateTaskDtoModel } from '@tasks/lib';

import { TaskEntity } from './task.entity';

export class CreateTaskDto extends PickType(TaskEntity, [
  'name',
  'payload',
  'exeType',
  'dependencies',
] as const) implements CreateTaskDtoModel{}
