import * as cron from 'cron';
import { connect } from 'puppeteer-real-browser';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IQueueEngineService } from '@tasks/lib';

import { QueueEntity } from '../queue/queue.entity';
import { QueueService } from '../queue/queue.service';
import { TaskEntity } from '../task/task.entity';
import { TaskService } from '../task/task.service';
import { taskProcessors } from './taskProcessors';

@Injectable()
export class QueueEngineService implements OnModuleInit, IQueueEngineService {
  private schedules: {
    [queueId: number]: {
      job: cron.CronJob;
      tasks: TaskEntity[];
      storage: {
        message: string;
      };
    };
  } = {};
  constructor(
    private readonly queueRepository: QueueService,
    private readonly taskRepository: TaskService
  ) {}

  async onModuleInit() {
    // open browser for puppeteer. we need to configure it so it will remember all creds we set earlier
    const browser = await connect({
      headless: false, // Set to false if you want to see the browser

      // args: ['--no-sandbox', '--disable-setuid-sandbox'],
      customConfig: {
        // executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Adjust this path as needed
        userDataDir:
          'C:\\Users\\galio\\AppData\\Local\\Google\\Chrome\\User Data\\Default', // Directory to store user data
      },
      connectOption: {},
      // defaultViewport: null, // Use the default viewport size
    });
    browser.page.setViewport(null); // Set viewport to null to use the default size
    // Set the browser to be used in the task processors
    taskProcessors.setBrowser(browser.browser as any);
    const activeQueues = await this.queueRepository.findActive();
    console.log('activeQueues: ', activeQueues);

    for (const queue of activeQueues) {
      await this.setupSchedule(queue);
    }
  }

  private async setupSchedule(queue: QueueEntity) {
    const cronString = queue.schedule;
    const validation = cron.validateCronExpression(cronString);
    console.log(`Is the cron expression valid? ${validation.valid}`);
    if (!validation.valid) {
      console.error(`Validation error: ${validation.error}`);
    }
    // for testing purposes, we will log the cron string
    console.log(
      `Setting up schedule for queue: ${queue.id} with cron: ${cronString}`
    );
    const job = new cron.CronJob(cronString, async () => {
      Logger.log(`Cron job triggered for queue: ${queue.id}`);
      // Logger.log('this.schedules: ', this.schedules);
      const schedule = this.schedules[queue.id];
      if (!schedule) return;

      const { tasks } = schedule;
      if (tasks.length === 0) {
        Logger.warn(`No tasks found for queue: ${queue.id}`);
        return;
      }

      // process tasks one by one in sequence, awaiting each task to finish before starting the next one
      for (const task of tasks) {
        Logger.log(`Processing task: ${task.id} for queue: ${queue.id}`);
        try {
          await this.processTask(task, schedule.storage);
          Logger.log(`Task ${task.id} processed successfully.`);
        } catch (error) {
          // free all task resources
          const processor = taskProcessors.getProcessor(task.exeType);
          if (processor && processor.blocks) {
            for (const block of processor.blocks) {
              taskProcessors.removeBlockedResource(block);
            }
          }

          this.blocked = false;
          Logger.log(`Task ${task.id} is no longer blocked.`);
          Logger.error(`Error processing task ${task.id}:`, error);
        }
      }
    });
    job.start();
    const tasks = await this.taskRepository.findByIds(queue.tasks || []);
    if (!tasks) {
      console.error(`No tasks found for queue: ${queue.id}`);
      return;
    }
    this.schedules[queue.id] = {
      job,
      tasks,
      storage: {
        message: ''
      }, // Initialize storage for this queue
    };
    console.log(`Schedule for queue ${queue.id} set up successfully.`);

    // show schedules and tasks data
    Object.entries(this.schedules).forEach(([queueId, schedule]) => {
      console.log(`Queue ID: ${queueId}`);
      schedule.tasks.forEach((task) => {
        console.log(task);
      });
    });
  }

  async restart() {
    console.log('Restarting Queue Engine...');
    // Logic to restart the queue engine, e.g., re-initialize schedules
    const activeQueues = await this.queueRepository.findActive();
    console.log('Re-initializing schedules for active queues:', activeQueues);

    for (const queue of activeQueues) {
      this.setupSchedule(queue);
    }
    console.log('Queue Engine restarted successfully.');
  }

  private async processTask(task: TaskEntity, storage: { [key: string]: any }) {
    // taskProcessors
    const processor = taskProcessors.getProcessor(task.exeType);
    if (!processor) {
      Logger.error(`No processor found for task type: ${task.exeType}`);
      return;
    }
    // check blocked resources
    if (processor.blocks && processor.blocks.length > 0) {
      // taskProcessors
      for (const block of processor.blocks) {
        if (taskProcessors.isResourceBlocked(block)) {
          Logger.warn(`Resource blocked: ${block}`);
          this.blocked = true;
          return;
        }
      }
      // If all resources are available, remove the blocked state
      this.blocked = false;
    }
    // If no resources are blocked, proceed with task execution
    if (this.blocked) {
      Logger.warn(`Task ${task.id} is blocked due to resource constraints.`);
      return;
    }
    await processor.execute(task, storage);
  }
  blocked = false;
}
