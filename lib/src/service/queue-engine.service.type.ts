/*
@Controller('queue-engine')
export class QueueEngineController {
  constructor(private readonly queueEngineService: QueueEngineService) { }


  // restart queueEngine() {

  @Post('restart')
  async restartQueueEngine() {
    await this.queueEngineService.restart();
  }
}
*/
export interface IQueueEngineService {
  restart(): Promise<void>;
  executeQueueOnce(queueId: number): Promise<{
    success: boolean;
    executionTime: number;
    tasksExecuted: number;
    tasksSuccessful: number;
    tasksFailed: number;
    log: string[];
    error?: string;
  }>;
}
