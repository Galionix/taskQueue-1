/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const child = require('child_process');

describe('takeScreenshot processor (auto)', () => {
  let originalExists: any;
  let originalMkdir: any;
  let originalStat: any;
  let originalExec: any;
  let takeScreenshot: any;

  beforeEach(() => {
    // preserve originals
    originalExists = fs.existsSync;
    originalMkdir = fs.mkdirSync;
    originalStat = fs.statSync;
    originalExec = child.exec;

    // provide simple function replacements
    fs.existsSync = () => true;
    fs.mkdirSync = () => undefined;
    fs.statSync = () => ({ mtime: new Date() });

    // mock child.exec so promisify(exec) used in module resolves
    child.exec = jest.fn((c: any, opts: any, cb?: any) => {
      if (typeof opts === 'function') {
        cb = opts;
      }
      if (cb) cb(null, { stdout: '' });
      return { pid: 1234 } as any;
    });

    // reset modules so our mocks are used when requiring
    jest.resetModules();
    // require module after mocks
    ({ takeScreenshot } = require('./take_screenshot_new.processor'));
  });

  afterEach(() => {
    // restore
    fs.existsSync = originalExists;
    fs.mkdirSync = originalMkdir;
    fs.statSync = originalStat;
    child.exec = originalExec;
  });

  it('throws when screenshot file not created', async () => {
    const processor = takeScreenshot();
    // simulate exec not creating file by overriding existsSync to false
    fs.existsSync = () => false;

    await expect(
      processor.execute(
        { id: 1, name: 'task', payload: JSON.stringify({ outputPath: '.', filename: 'file_{timestamp}', sendNotification: false }) } as any,
        {} as any,
      ),
    ).rejects.toThrow();
  });

  it('returns success when file exists', async () => {
    const processor = takeScreenshot();
    await expect(
      processor.execute(
        { id: 1, name: 'task', payload: JSON.stringify({ outputPath: '.', filename: 'file_{timestamp}', sendNotification: false }) } as any,
        {} as any,
      ),
    ).resolves.toBeDefined();
  });
});
