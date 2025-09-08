/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const { ScreenshotCleanupService } = require('./screenshot-cleanup.service');

describe('ScreenshotCleanupService (auto)', () => {
  let origExists: any;
  let origReaddir: any;
  let origStat: any;
  let origUnlink: any;

  beforeEach(() => {
    origExists = fs.existsSync;
    origReaddir = fs.readdirSync;
    origStat = fs.statSync;
    origUnlink = fs.unlinkSync;

    fs.existsSync = () => true;
    fs.readdirSync = () => ['a.png', 'dir'];
    fs.statSync = (p: any) => ({ isDirectory: () => String(p).endsWith('dir') } as any);
    fs.unlinkSync = () => undefined;
  });

  afterEach(() => {
    fs.existsSync = origExists;
    fs.readdirSync = origReaddir;
    fs.statSync = origStat;
    fs.unlinkSync = origUnlink;
  });

  it('getScreenshotsPath returns path', () => {
    const svc = new ScreenshotCleanupService();
    const path = svc.getScreenshotsPath();
    expect(path).toBeDefined();
  });
});
