import { takeScreenshot } from './take_screenshot.processor';
import { TaskEntity } from '../../task/task.entity';
import * as fs from 'fs';
import { exec } from 'child_process';

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExec = exec as jest.MockedFunction<typeof exec>;

describe('takeScreenshot processor', () => {
  let processor: any;
  let mockTask: TaskEntity;
  let mockStorage: { message: string };

  beforeEach(() => {
    // Reset all modules
    jest.clearAllMocks();

    processor = takeScreenshot();

    mockTask = {
      id: 1,
      name: 'Test Screenshot Task',
      exeType: 'take_screenshot',
      payload: JSON.stringify({
        outputPath: 'C:\\screenshots\\',
        filename: 'test_{timestamp}.png',
        allScreens: true,
        sendNotification: true,
      }),
      dependencies: [],
      queues: [], // Массив ID очередей
      queueEntities: [], // Массив объектов очередей
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    } as TaskEntity;

    mockStorage = { message: '' };

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.writeFileSync.mockImplementation(() => undefined);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
    expect(processor.name).toBe('takeScreenshot');
    expect(processor.description).toBe(
      'Takes screenshots of all computer screens'
    );
    expect(processor.blocks).toEqual([]);
  });

  describe('execute', () => {
    it('should take screenshots of all screens when allScreens is true', async () => {
      const mockScreenshots = [
        Buffer.from('screenshot1'),
        Buffer.from('screenshot2'),
      ];
      screenshot.all.mockResolvedValue(mockScreenshots);

      const result = await processor.execute(mockTask, mockStorage);

      expect(screenshot.all).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.data.screensCount).toBe(2);
      expect(result.data.files).toHaveLength(2);
      expect(mockStorage.message).toContain('Screenshots taken: 2 screens');
    });

    it('should take screenshot of main screen when allScreens is false', async () => {
      const singleScreenPayload = JSON.stringify({
        outputPath: 'C:\\screenshots\\',
        filename: 'single_{timestamp}.png',
        allScreens: false,
        sendNotification: true,
      });

      mockTask.payload = singleScreenPayload;
      const mockScreenshotBuffer = Buffer.from('single screenshot');
      screenshot.mockResolvedValue(mockScreenshotBuffer);

      const result = await processor.execute(mockTask, mockStorage);

      expect(screenshot).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.data.screensCount).toBe(1);
      expect(result.data.file).toBeDefined();
      expect(mockStorage.message).toContain('Screenshot taken:');
    });

    it('should create output directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      const mockScreenshots = [Buffer.from('screenshot1')];
      screenshot.all.mockResolvedValue(mockScreenshots);

      await processor.execute(mockTask, mockStorage);

      expect(mockFs.existsSync).toHaveBeenCalledWith('C:\\screenshots\\task_1_Test_Screenshot_Task');
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('C:\\screenshots\\task_1_Test_Screenshot_Task', {
        recursive: true,
      });
    });

    it('should not add notification message when sendNotification is false', async () => {
      const payloadWithoutNotification = JSON.stringify({
        outputPath: 'C:\\screenshots\\',
        filename: 'test_{timestamp}.png',
        allScreens: false,
        sendNotification: false,
      });

      mockTask.payload = payloadWithoutNotification;
      const mockScreenshotBuffer = Buffer.from('screenshot');
      screenshot.mockResolvedValue(mockScreenshotBuffer);

      await processor.execute(mockTask, mockStorage);

      expect(mockStorage.message).toBe('');
    });

    it('should append to existing storage message', async () => {
      mockStorage.message = 'Previous message';
      const mockScreenshots = [Buffer.from('screenshot1')];
      screenshot.all.mockResolvedValue(mockScreenshots);

      await processor.execute(mockTask, mockStorage);

      expect(mockStorage.message).toBe(
        'Previous message\nScreenshots taken: 1 screens saved to C:\\screenshots\\task_1_Test_Screenshot_Task'
      );
    });

    it('should handle screenshot errors gracefully', async () => {
      const error = new Error('Screenshot failed');
      screenshot.all.mockRejectedValue(error);

      await expect(processor.execute(mockTask, mockStorage)).rejects.toThrow(
        'Failed to take screenshot: Screenshot failed'
      );
    });

    it('should handle unknown errors gracefully', async () => {
      screenshot.all.mockRejectedValue('Unknown error');

      await expect(processor.execute(mockTask, mockStorage)).rejects.toThrow(
        'Failed to take screenshot: Unknown error'
      );
    });

    it('should replace {timestamp} placeholder in filename', async () => {
      const mockScreenshots = [Buffer.from('screenshot1')];
      screenshot.all.mockResolvedValue(mockScreenshots);

      await processor.execute(mockTask, mockStorage);

      // Check that writeFileSync was called with a filename containing timestamp instead of {timestamp}
      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const filePath = writeCall[0] as string;
      expect(filePath).toMatch(/test_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/); // Should contain formatted timestamp
      expect(filePath).not.toContain('{timestamp}');
    });

    it('should handle multiple screens with proper naming', async () => {
      const mockScreenshots = [
        Buffer.from('screen1'),
        Buffer.from('screen2'),
        Buffer.from('screen3'),
      ];
      screenshot.all.mockResolvedValue(mockScreenshots);

      await processor.execute(mockTask, mockStorage);

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3);

      // Check that each file has proper screen numbering
      const filePaths = mockFs.writeFileSync.mock.calls.map(
        (call) => call[0] as string
      );
      expect(filePaths[0]).toContain('_screen1.png');
      expect(filePaths[1]).toContain('_screen2.png');
      expect(filePaths[2]).toContain('_screen3.png');
    });
  });
});
