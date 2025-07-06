import { PartialType } from '@nestjs/mapped-types';
import { UpdateTaskDtoModel } from '@tasks/lib';

import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) implements UpdateTaskDtoModel {}
