import { PickType } from '@nestjs/swagger';

import { QueueEntity } from './queue.entity';

export class CreateQueueDto extends PickType(QueueEntity, [
  'name',
  'tasks',
  'schedule',
] as const) {}
