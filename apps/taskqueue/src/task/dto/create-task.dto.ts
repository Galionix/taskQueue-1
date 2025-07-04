import { TaskEntity } from '../entities/task.entity';
import { PickType } from '@nestjs/swagger';

export class CreateTaskDto extends PickType(TaskEntity, ["name", 'payload', 'exeType', 'dependencies'] as const) {}
