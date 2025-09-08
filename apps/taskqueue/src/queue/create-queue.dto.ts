import { PickType } from '@nestjs/swagger';

import { QueueEntity } from './queue.entity';

export class CreateQueueDto extends PickType(QueueEntity, [
  'name',
  'tasks',
  'schedule',
  'lockStrategy',
  'isActive',
] as const) {}
