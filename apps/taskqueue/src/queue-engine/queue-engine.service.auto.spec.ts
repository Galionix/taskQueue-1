/* eslint-disable @typescript-eslint/no-var-requires */

describe('QueueEngineService (auto)', () => {
  let svc: any;
  const mockQueueRepo: any = {
    findAll: jest.fn(),
    findActive: jest.fn(),
  };
  const mockTaskRepo: any = {
    findByIds: jest.fn(),
  };

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    mockQueueRepo.findAll.mockClear();
    mockTaskRepo.findByIds.mockClear();

    // simple processor that records execution
    const fakeProcessor = {
      execute: jest.fn(async (task: any, storage: any) => {
        if (task.fail) throw new Error('proc fail');
        if (task.message) storage.message = task.message;
      }),
    };

    // inject a minimal taskProcessors with getProcessor
    jest.doMock('./taskProcessors', () => ({
      taskProcessors: {
        getProcessor: () => fakeProcessor,
        setBrowser: () => {},
      },
    }));

    const Mod = require('./queue-engine.service');
    svc = new Mod.QueueEngineService(mockQueueRepo, mockTaskRepo);
  });

  it('returns error when queue not found', async () => {
    mockQueueRepo.findAll.mockResolvedValue([]);
    const res = await svc.executeQueueOnce(999);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not found/i);
  });

  it('executes tasks and records success and logs', async () => {
    const queue = { id: 1, name: 'Q', tasks: [1, 2] };
    const t1 = { id: 1, name: 'T1', message: 'ok' };
    const t2 = { id: 2, name: 'T2' };
    mockQueueRepo.findAll.mockResolvedValue([queue]);
    mockTaskRepo.findByIds.mockResolvedValue([t1, t2]);

    const res = await svc.executeQueueOnce(1);
    expect(res.success).toBe(true);
    expect(res.tasksExecuted).toBe(2);
    expect(res.log.some((l: string) => l.includes('Starting execution'))).toBe(true);
  });

  it('handles processor failure per task', async () => {
    const queue = { id: 2, name: 'Q2', tasks: [3] };
    const t3 = { id: 3, name: 'T3', fail: true };
    mockQueueRepo.findAll.mockResolvedValue([queue]);
    mockTaskRepo.findByIds.mockResolvedValue([t3]);
    const res = await svc.executeQueueOnce(2);
    expect(res.success).toBe(false);
    expect(res.tasksFailed).toBe(1);
  });
});
