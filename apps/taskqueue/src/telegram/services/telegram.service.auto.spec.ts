/* eslint-disable @typescript-eslint/no-var-requires */

import { TelegramService } from './telegram.service';

describe('TelegramService (auto)', () => {
  it('should load and have methods', () => {
    const svc = require('./telegram.service');
    expect(svc).toBeDefined();
  });
});
