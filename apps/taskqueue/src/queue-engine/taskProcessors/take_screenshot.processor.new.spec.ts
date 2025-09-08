jest.mock('fs');
jest.mock('child_process');
jest.mock('util');
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { ok: true } }),
  post: jest.fn().mockResolvedValue({ data: { ok: true } })
}));

import * as takeScreenshotModule from './take_screenshot.processor';
import { takeScreenshot } from './take_screenshot.processor';
import { TaskModel } from '@tasks/lib';
import * as fs from 'fs';
import { setExecAsync } from './exec-async';

const mockFs = fs as jest.Mocked<typeof fs>;

describe('takeScreenshot processor', () => {
  let processor: any;
  let mockTask: TaskModel;
  let mockStorage: { message: string; screenshotFiles?: any[] };
  let mockExecAsync: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Отключаем переменные окружения для Telegram
    delete process.env.TELEGRAM_CHAT_ID;
    delete process.env.TELEGRAM_BOT_TOKEN;

    // Мокаем execAsync через setExecAsync
    mockExecAsync = jest.fn().mockResolvedValue({ stdout: '', stderr: '' });
    setExecAsync(mockExecAsync);

    processor = takeScreenshot();
    mockTask = {
      id: 1,
      name: 'Test Screenshot Task',
      exeType: 'take_screenshot',
      payload: JSON.stringify({
        outputPath: 'C:\\screenshots\\',
        filename: 'test_{timestamp}.png',
        sendNotification: true,
      }),
      dependencies: [],
      queues: [],
      queueEntities: [],
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    } as TaskModel;
    mockStorage = {
      message: '',
      screenshotFiles: [],
    };

    // Setup default mock implementations
    // По умолчанию папка существует, файл создается успешно
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.writeFileSync.mockImplementation(() => undefined);
    mockFs.unlinkSync.mockImplementation(() => undefined);
  });

  it('should have correct processor configuration', () => {
    expect(processor.name).toBe('takeScreenshot');
    expect(processor.description).toBe(
      'Takes screenshot of all computer screens using PowerShell'
    );
    expect(processor.blocks).toEqual([]);
  });

  it('should create screenshot using PowerShell and save to task folder', async () => {
    // Мокаем так, чтобы папка не существовала, а файл создался
    mockFs.existsSync.mockReturnValueOnce(false) // Папка не существует
                    .mockReturnValueOnce(true);  // Файл скриншота существует

    const result = await processor.execute(mockTask, mockStorage);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Screenshot of all screens taken successfully');
    expect(result.data.file).toContain('task_1_Test_Screenshot_Task');
    expect(result.data.file).toContain('.png');

    // Проверяем вызов PowerShell
    expect(mockExecAsync).toHaveBeenCalledWith(
      expect.stringContaining('powershell'),
    );

    // Verify directory creation (теперь должно быть вызвано, так как папка не существует)
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('task_1_Test_Screenshot_Task'),
      { recursive: true }
    );

    // Verify storage was updated
    expect(mockStorage.message).toContain('Screenshot taken:');
    expect(mockStorage.screenshotFiles).toHaveLength(1);
  });

  it('should handle PowerShell execution errors', async () => {
    mockExecAsync.mockRejectedValue(new Error('PowerShell failed'));

    await expect(processor.execute(mockTask, mockStorage)).rejects.toThrow('Failed to take screenshot: PowerShell failed');
  });

  it('should not send notification when sendNotification is false', async () => {
    mockTask.payload = JSON.stringify({
      outputPath: 'C:\\screenshots\\',
      filename: 'test_{timestamp}.png',
      sendNotification: false,
    });

    const result = await processor.execute(mockTask, mockStorage);

    expect(result.success).toBe(true);
    expect(mockStorage.message).toBe('');
    // Когда sendNotification: false, screenshotFiles не устанавливается
    expect(mockStorage.screenshotFiles).toEqual([]);
  });

  it('should create directory if it does not exist', async () => {
    mockFs.existsSync.mockReturnValueOnce(false) // For directory check
                    .mockReturnValueOnce(true);  // For file check after creation

    await processor.execute(mockTask, mockStorage);

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('task_1_Test_Screenshot_Task'),
      { recursive: true }
    );
  });

  it('should throw error if screenshot file is not created', async () => {
    // Mock that file doesn't exist after PowerShell execution
    mockFs.existsSync.mockReturnValueOnce(true) // For directory
                    .mockReturnValueOnce(false); // For screenshot file

    await expect(processor.execute(mockTask, mockStorage)).rejects.toThrow('Screenshot file was not created');
  });

  it('should replace timestamp in filename', async () => {
    await processor.execute(mockTask, mockStorage);

    // Check that the filename contains a timestamp replacement
    const savedFile = mockStorage.screenshotFiles?.[0];
    expect(savedFile).toMatch(/test_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
  });

  it('should handle unknown error types', async () => {
    mockExecAsync.mockRejectedValue('Unknown error string');

    await expect(processor.execute(mockTask, mockStorage)).rejects.toThrow('Failed to take screenshot: Unknown error');
  });
});
