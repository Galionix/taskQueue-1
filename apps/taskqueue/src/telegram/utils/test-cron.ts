import { CronUtils } from './cron.utils';

// Test common cron expressions
const tests = [
  '0 */5 * * *',     // Every 5 hours
  '0 9 * * 1-5',     // 9 AM weekdays  
  '0 0 * * *',       // Daily at midnight
  '*/15 * * * *',    // Every 15 minutes
  '0 12 1 * *',      // First day of month at noon
  '0 8,12,16 * * *', // 8 AM, 12 PM, 4 PM daily
  '0 */2 * * *',     // Every 2 hours
  '0 9 * * 0,6',     // 9 AM on weekends
  '30 */3 * * *',    // Every 3 hours at 30 minutes past
  '0 9-17 * * 1-5',  // Every hour from 9 to 17 on weekdays
];

console.log('Testing CronUtils.toHumanReadable():');
console.log('=====================================');

tests.forEach(cron => {
  try {
    const readable = CronUtils.toHumanReadable(cron);
    console.log(`${cron.padEnd(20)} -> ${readable}`);
  } catch (e) {
    console.log(`${cron.padEnd(20)} -> ERROR: ${e.message}`);
  }
});
