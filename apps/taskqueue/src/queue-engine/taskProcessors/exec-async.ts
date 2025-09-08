import { exec } from 'child_process';
import { promisify } from 'util';

let execAsync = promisify(exec);

// Для тестов - позволяем переопределить execAsync
export const setExecAsync = (mockFn: any) => {
  execAsync = mockFn;
};

export { execAsync };
