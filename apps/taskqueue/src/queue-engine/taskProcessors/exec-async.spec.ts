import { execAsync, setExecAsync } from './exec-async';

describe('execAsync utility', () => {
  it('should call exec and resolve with stdout/stderr', async () => {
    const mockExec = jest.fn().mockResolvedValue({ stdout: 'ok', stderr: '' });
    setExecAsync(mockExec);
    const result = await execAsync('echo ok');
    expect(result).toEqual({ stdout: 'ok', stderr: '' });
    expect(mockExec).toHaveBeenCalledWith('echo ok');
  });

  it('should allow to set a new execAsync implementation', async () => {
    const mockExec = jest.fn().mockResolvedValue({ stdout: 'test', stderr: '' });
    setExecAsync(mockExec);
    const result = await execAsync('echo test');
    expect(result.stdout).toBe('test');
  });
});
