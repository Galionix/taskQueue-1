/* eslint-disable @typescript-eslint/no-var-requires */

describe('pushover.module (auto)', () => {
  it('should load the module file without throwing', () => {
    const mod = require('./pushover.module');
    expect(mod).toBeDefined();
  });
});
