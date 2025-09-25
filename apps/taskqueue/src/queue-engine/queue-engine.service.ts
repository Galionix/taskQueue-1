import * as cron from 'cron';
import { connect } from 'puppeteer-real-browser';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IQueueEngineService, TaskModel } from '@tasks/lib';

import { QueueEntity } from '../queue/queue.entity';
import { QueueService } from '../queue/queue.service';
import { TaskService } from '../task/task.service';
import { taskProcessors } from './taskProcessors';
import { Browser } from 'puppeteer-core';

@Injectable()
export class QueueEngineService implements OnModuleInit, IQueueEngineService {
  private schedules: {
    [queueId: number]: {
      job: cron.CronJob;
      tasks: TaskModel[];
      storage: {
        message: string;
      };
    };
  } = {};
  private browser: Browser | null = null;
  private notificationCallback: ((message: string) => void) | null = null;

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
    this.browser = browser.browser as any;
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
      const startTime = Date.now();
      let successfulTasks = 0;
      let failedTasks = 0;
      const cleanMessages: string[] = [];

      try {
        const schedule = this.schedules[queue.id];
        if (!schedule) return;

        const { tasks } = schedule;
        if (tasks.length === 0) {
          Logger.warn(`No tasks found for queue: ${queue.id}`);
          return;
        }

        // Create temporary storage for this execution (ensure clean start)
        const storage = { message: '' };

        // process tasks one by one in sequence, awaiting each task to finish before starting the next one
        for (const task of tasks) {
          Logger.log(`Processing task: ${task.id} for queue: ${queue.id}`);
          try {
            await this.processTask(task, storage);
            successfulTasks++;
            Logger.log(`Task ${task.id} processed successfully.`);

            // Collect clean messages from task output
            if (storage.message && storage.message.trim()) {
              const taskMessages = storage.message
                .trim()
                .split('\n')
                .filter((msg) => msg.trim());
              taskMessages.forEach((msg) => {
                cleanMessages.push(msg.trim());
              });
              // Clear the storage message for next task
              storage.message = '';
            }
          } catch (error) {
            failedTasks++;
            Logger.error(`Error processing task ${task.id}:`, error);
            // Clear the storage message even on error
            storage.message = '';
          }
        }

        // Send notification about cron execution result
        if (this.notificationCallback) {
          const executionTime = Date.now() - startTime;
          const queueName = queue.name || `Queue ${queue.id}`;
          
          let message: string;
          if (cleanMessages.length > 0) {
            const cleanOutput = cleanMessages.join('\n');
            message = failedTasks === 0 
              ? `⏰ ${queueName}: ${cleanOutput}`
              : `⚠️ ${queueName}: ${cleanOutput} (${failedTasks} failed)`;
          } else {
            message = failedTasks === 0
              ? `⏰ Cron: Queue "${queueName}" completed successfully (${successfulTasks} tasks, ${executionTime}ms)`
              : `⚠️ Cron: Queue "${queueName}" completed with errors (${successfulTasks} success, ${failedTasks} failed, ${executionTime}ms)`;
          }

          this.notificationCallback(message);
        }

      } catch (error) {
        Logger.error(`Critical error in cron job for queue ${queue.id}:`, error);
        
        // Send error notification
        if (this.notificationCallback) {
          const queueName = queue.name || `Queue ${queue.id}`;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.notificationCallback(
            `❌ Cron: Queue "${queueName}" failed: ${errorMessage}`
          );
        }
      }
    });
    job.start();
    const unorderedTasks = await this.taskRepository.findByIds(
      queue.tasks || []
    );
    console.log('unorderedTasks: ', unorderedTasks);
    const tasks = queue.tasks
      .map((taskId) => {
        const task = unorderedTasks.find((t) => t.id == taskId);
        if (!task) {
          console.error(
            `Task with ID ${taskId} not found for queue: ${queue.id}`
          );
        }
        return task!;
      })
      .filter(Boolean);
    console.log('tasks: ', tasks);
    if (!tasks) {
      console.error(`No tasks found for queue: ${queue.id}`);
      return;
    }
    this.schedules[queue.id] = {
      job,
      tasks,
      storage: {
        message: '',
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
    // this.schedules
    // cancel all crons for schedules
    console.log('Cancelling all scheduled jobs...');
    Object.values(this.schedules).forEach((schedule) => {
      schedule.job.stop();
    });
    this.schedules = {}; // Clear the schedules
    console.log('Restarting Queue Engine...');
    // restart browser
    if (this.browser) {
      console.log('this.browser: ', this.browser);
      await this.browser.close();
      this.browser = null;
    }
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
    this.browser = browser.browser as any;
    browser.page.setViewport(null); // Set viewport to null to use the default size
    // Set the browser to be used in the task processors
    taskProcessors.setBrowser(browser.browser as any);
    // Logic to restart the queue engine, e.g., re-initialize schedules
    const activeQueues = await this.queueRepository.findActive();
    console.log('Re-initializing schedules for active queues:', activeQueues);

    for (const queue of activeQueues) {
      this.setupSchedule(queue);
    }
    console.log('Queue Engine restarted successfully.');
  }

  private async processTask(task: TaskModel, storage: { [key: string]: any }) {
    // taskProcessors
    const processor = taskProcessors.getProcessor(task.exeType);
    if (!processor) {
      Logger.error(`No processor found for task type: ${task.exeType}`);
      return;
    }
    // check blocked resources
    // if (processor.blocks && processor.blocks.length > 0) {
    //   // taskProcessors
    //   for (const block of processor.blocks) {
    //     if (taskProcessors.isResourceBlocked(block)) {
    //       Logger.warn(`Resource blocked: ${block}`);
    //       this.blocked = true;
    //       return;
    //     }
    //   }
    //   // If all resources are available, remove the blocked state
    //   this.blocked = false;
    // }
    // If no resources are blocked, proceed with task execution
    // if (this.blocked) {
    //   Logger.warn(`Task ${task.id} is blocked due to resource constraints.`);
    //   return;
    // }
    await processor.execute(task, storage);
  }

  /**
   * Execute all tasks of a queue once (not on schedule)
   */
  async executeQueueOnce(queueId: number): Promise<{
    success: boolean;
    executionTime: number;
    tasksExecuted: number;
    tasksSuccessful: number;
    tasksFailed: number;
    log: string[];
    cleanMessages: string[]; // Clean messages from task processors
    error?: string;
  }> {
    const startTime = Date.now();
    const log: string[] = [];

    try {
      // Get queue data
      const queues = await this.queueRepository.findAll();
      const queue = queues.find((q) => q.id === queueId);

      if (!queue) {
        throw new Error(`Queue with ID ${queueId} not found`);
      }

      log.push(`Starting execution of queue: ${queue.name} (ID: ${queueId})`);

      if (!queue.tasks || queue.tasks.length === 0) {
        log.push('No tasks found in queue');
        return {
          success: true,
          executionTime: Date.now() - startTime,
          tasksExecuted: 0,
          tasksSuccessful: 0,
          tasksFailed: 0,
          log,
          cleanMessages: [],
        };
      }

      // Get task entities
      const unorderedTasks = await this.taskRepository.findByIds(queue.tasks);
      const tasks = queue.tasks
        .map((taskId) => {
          const task = unorderedTasks.find((t) => t.id == taskId);
          if (!task) {
            log.push(`Warning: Task with ID ${taskId} not found`);
          }
          return task;
        })
        .filter(Boolean) as TaskModel[];

      log.push(`Found ${tasks.length} tasks to execute`);

      // Create temporary storage for this execution (ensure clean start)
      const storage = { message: '' };
      const cleanMessages: string[] = [];

      let successfulTasks = 0;
      let failedTasks = 0;

      // Process tasks one by one
      for (const task of tasks) {
        log.push(`Processing task: ${task.name} (ID: ${task.id})`);
        try {
          await this.processTask(task, storage);
          successfulTasks++;
          log.push(`✅ Task ${task.name} completed successfully`);

          // Add task output from storage to log and collect clean messages
          if (storage.message && storage.message.trim()) {
            const taskMessages = storage.message
              .trim()
              .split('\n')
              .filter((msg) => msg.trim());
            taskMessages.forEach((msg) => {
              log.push(`   ${msg.trim()}`);
              cleanMessages.push(msg.trim()); // Collect clean messages separately
            });
            // Clear the storage message for next task
            storage.message = '';
          }
        } catch (error) {
          failedTasks++;
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          log.push(`❌ Task ${task.name} failed: ${errorMessage}`);
          Logger.error(`Error processing task ${task.id}:`, error);
          // Clear the storage message even on error
          storage.message = '';
        }
      }

      const executionTime = Date.now() - startTime;
      log.push(
        `Execution completed. Success: ${successfulTasks}, Failed: ${failedTasks}, Time: ${executionTime}ms`
      );

      return {
        success: failedTasks === 0,
        executionTime,
        tasksExecuted: successfulTasks + failedTasks,
        tasksSuccessful: successfulTasks,
        tasksFailed: failedTasks,
        log,
        cleanMessages,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      log.push(`Fatal error: ${errorMessage}`);
      Logger.error(`Error executing queue ${queueId}:`, error);

      return {
        success: false,
        executionTime,
        tasksExecuted: 0,
        tasksSuccessful: 0,
        tasksFailed: 0,
        log,
        cleanMessages: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Set notification callback for cron job results
   */
  setNotificationCallback(callback: (message: string) => void): void {
    this.notificationCallback = callback;
  }
  // blocked = false;
}
