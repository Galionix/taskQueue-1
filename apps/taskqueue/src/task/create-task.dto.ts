import { ApiProperty } from '@nestjs/swagger';
import { CreateTaskDtoModel, ExeTypes } from '@tasks/lib';

export class CreateTaskDto implements CreateTaskDtoModel {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  payload!: string;

  @ApiProperty({ enum: ExeTypes })
  exeType!: string;

  @ApiProperty({ type: [Number] })
  dependencies!: ExeTypes[];

  @ApiProperty({ type: [Number] })
  queues!: number[];
}
