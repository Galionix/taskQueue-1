/**
 * Utility functions for converting cron expressions to human-readable format
 */
export class CronUtils {
  /**
   * Convert a cron expression to human-readable Russian text
   * Format: minute hour day month dayOfWeek
   * @param cronExpression - Standard cron expression (e.g., "0 9 * * 1-5")
   * @returns Human-readable description in Russian
   */
  static toHumanReadable(cronExpression: string): string {
    try {
      const parts = cronExpression.trim().split(/\s+/);
      
      if (parts.length !== 5) {
        return cronExpression; // Return original if not standard format
      }

      const [minute, hour, day, month, dayOfWeek] = parts;

      // Build readable description
      const timeDescription = this.getTimeDescription(minute, hour);
      const dayDescription = this.getDayDescription(day, month, dayOfWeek);

      return `${timeDescription}${dayDescription}`;
    } catch (error) {
      // If parsing fails, return original cron expression
      return cronExpression;
    }
  }

  private static getTimeDescription(minute: string, hour: string): string {
    if (minute === '*' && hour === '*') {
      return 'каждую минуту';
    }
    
    // Handle hour intervals (e.g., */5 = every 5 hours)
    if (hour.includes('/')) {
      const interval = hour.split('/')[1];
      const minuteText = minute === '0' ? '' : ` в ${minute} минут`;
      return `каждые ${interval} часов${minuteText}`;
    }
    
    if (hour === '*') {
      if (minute === '0') {
        return 'каждый час';
      } else if (minute.includes('/')) {
        const interval = minute.split('/')[1];
        return `каждые ${interval} минут`;
      } else if (minute.includes(',')) {
        const minutes = minute.split(',').join(', ');
        return `в ${minutes} минут каждого часа`;
      } else {
        return `в ${minute} минут каждого часа`;
      }
    }

    // Handle specific hours with comma separation
    if (hour.includes(',')) {
      const hours = hour.split(',').map(h => `${h}:${minute.padStart(2, '0')}`).join(', ');
      return `в ${hours}`;
    }
    
    // Specific time
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);
    return `в ${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
  }

  private static getDayDescription(day: string, month: string, dayOfWeek: string): string {
    // Check day of week first (0 = Sunday, 1 = Monday, etc.)
    if (dayOfWeek !== '*') {
      const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
      
      if (dayOfWeek.includes(',')) {
        const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)]).join(', ');
        return ` по ${days}`;
      }
      
      if (dayOfWeek.includes('-')) {
        const [start, end] = dayOfWeek.split('-').map(d => parseInt(d));
        return ` с ${dayNames[start]} по ${dayNames[end]}`;
      }
      
      if (dayOfWeek === '1-5') {
        return ' по будням';
      }
      
      if (dayOfWeek === '6,0' || dayOfWeek === '0,6') {
        return ' по выходным';
      }
      
      const dayNum = parseInt(dayOfWeek);
      return ` по ${dayNames[dayNum]}`;
    }

    // Check specific day of month
    if (day !== '*') {
      if (day.includes(',')) {
        const days = day.split(',').join(', ');
        return ` ${days} числа каждого месяца`;
      }
      
      if (day.includes('/')) {
        const interval = day.split('/')[1];
        return ` каждые ${interval} дней`;
      }
      
      return ` ${day} числа каждого месяца`;
    }

    // Check month
    if (month !== '*') {
      const monthNames = [
        '', 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
      ];
      
      if (month.includes(',')) {
        const months = month.split(',').map(m => monthNames[parseInt(m)]).join(', ');
        return ` в ${months}`;
      }
      
      const monthNum = parseInt(month);
      return ` в ${monthNames[monthNum]}`;
    }

    return ' каждый день';
  }

  /**
   * Get next execution time description
   * @param cronExpression - Cron expression
   * @returns Description of when it will run next
   */
  static getNextExecutionDescription(cronExpression: string): string {
    // This would require a cron parser library for accurate next execution time
    // For now, just return the human readable format
    return this.toHumanReadable(cronExpression);
  }
}
