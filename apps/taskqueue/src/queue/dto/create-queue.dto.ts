import { PickType } from '@nestjs/swagger';
import { QueueEntity } from '../entities/queue.entity';

export class CreateQueueDto extends PickType(QueueEntity, ["name", 'tasks'] as const) {}
