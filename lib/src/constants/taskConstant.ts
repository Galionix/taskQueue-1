export enum ETaskState {
  'stopped',
  'paused',
  'error',
  'running',
  'locked',
}

export enum ELockStrategy {
  'pauseOnLock',
  'skipTask',
}

/**
 * Проверяет, является ли результат выполнения задачи пустым
 * @param result - результат выполнения задачи
 * @returns true если результат считается пустым
 */
export function isEmptyResult(result: unknown): boolean {
  // Проверяем на null, undefined
  if (result === null || result === undefined) {
    return true;
  }
  
  // Проверяем строки
  if (typeof result === 'string') {
    return result.trim() === '' || result.trim() === '0';
  }
  
  // Проверяем числа
  if (typeof result === 'number') {
    return result === 0;
  }
  
  // Проверяем массивы
  if (Array.isArray(result)) {
    return result.length === 0;
  }
  
  // Проверяем объекты
  if (typeof result === 'object') {
    return Object.keys(result).length === 0;
  }
  
  // Для других типов считаем не пустыми
  return false;
}