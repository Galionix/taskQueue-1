import * as cron from 'cron';
import * as fs from 'fs';
import { connect } from 'puppeteer-real-browser';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IQueueEngineService, TaskModel } from '@tasks/lib';
import { closeEmptyTabs } from './utils/browser-cleanup.utils';

import { QueueEntity } from '../queue/queue.entity';
import { QueueService } from '../queue/queue.service';
import { TaskService } from '../task/task.service';
import { BrowserService } from '../browser/browser.service';
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
  private browsers: Map<string, Browser> = new Map();
  private notificationCallback: ((message: string) => void) | null = null;

  constructor(
    private readonly queueRepository: QueueService,
    private readonly taskRepository: TaskService,
    private readonly browserService: BrowserService
  ) {}

  async onModuleInit() {
    await this.initializeBrowsers();
    
    const activeQueues = await this.queueRepository.findActive();
    console.log('activeQueues: ', activeQueues);

    for (const queue of activeQueues) {
      await this.setupSchedule(queue);
    }
  }

  private async initializeBrowsers() {
    console.log('🚀 Initializing browsers from database...');
    
    // Always start with default browser
    console.log('🌐 Starting default browser...');
    try {
      const defaultBrowser = await connect({
        headless: false,
        args: [
          '--disable-session-crashed-bubble',
          '--hide-crash-restore-bubble',
          '--disable-infobars',
          '--restore-last-session',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ],
        customConfig: {
          userDataDir: 'C:\\Users\\galio\\AppData\\Local\\Google\\Chrome\\User Data\\Default',
        },
        connectOption: {},
      });
      this.browsers.set('default', defaultBrowser.browser as any);
      defaultBrowser.page.setViewport(null);
      
      // Clean up empty tabs after browser initialization
      await closeEmptyTabs(defaultBrowser.browser as any);
      
      // Set the default browser for task processors (для совместимости)
      taskProcessors.setBrowser(defaultBrowser.browser as any);
      console.log('✅ Default browser started');
    } catch (error) {
      console.error('❌ Failed to start default browser:', error);
      throw error;
    }

    // Get active browsers from database
    try {
      const activeBrowsers = await this.browserService.findActive();
      console.log(`📋 Found ${activeBrowsers.length} active browsers in database`);

      for (const browserConfig of activeBrowsers) {
        console.log(`🌐 Starting browser: ${browserConfig.name}...`);
        try {
          const profileDir = `C:\\Users\\galio\\AppData\\Local\\Google\\Chrome\\User Data\\${browserConfig.name}`;
          
          // Create directory if it doesn't exist
          if (!fs.existsSync(profileDir)) {
            console.log(`📁 Creating profile directory: ${profileDir}`);
            fs.mkdirSync(profileDir, { recursive: true });
          }

          const browser = await connect({
            headless: false,
            args: [
              '--disable-session-crashed-bubble',
              '--hide-crash-restore-bubble',
              '--disable-infobars',
              '--restore-last-session',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-features=TranslateUI',
              '--disable-ipc-flooding-protection'
            ],
            customConfig: {
              userDataDir: profileDir,
            },
            connectOption: {},
          });
          
          this.browsers.set(browserConfig.name, browser.browser as any);
          browser.page.setViewport(null);
          
          // Clean up empty tabs after browser initialization
          await closeEmptyTabs(browser.browser as any);
          
          console.log(`✅ Browser ${browserConfig.name} started successfully`);
        } catch (error) {
          console.error(`❌ Failed to start browser ${browserConfig.name}:`, error);
          console.log(`⚠️ Continuing without ${browserConfig.name} browser...`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load browsers from database:', error);
      console.log('⚠️ Continuing with only default browser...');
    }

    console.log(`🎯 Total browsers initialized: ${this.browsers.size}`);
    console.log(`🔧 Available browsers: ${Array.from(this.browsers.keys()).join(', ')}`);
    
    // Pass all browsers to task processors
    taskProcessors.setBrowsers(this.browsers);
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
    // restart browsers
    for (const [accountName, browser] of this.browsers) {
      console.log(`Closing browser for account: ${accountName}`);
      await browser.close();
    }
    this.browsers.clear();
    await this.initializeBrowsers();
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

  /**
   * Get browser instance by account name
   */
  getBrowser(accountName: string = 'default'): Browser | null {
    return this.browsers.get(accountName) || null;
  }

  /**
   * Get available browser accounts
   */
  getAvailableBrowsers(): string[] {
    return Array.from(this.browsers.keys());
  }
  // blocked = false;
}
