/* eslint-disable @typescript-eslint/no-var-requires */

describe('DocsModule (auto)', () => {
  it('should import module file', () => {
    const mod = require('./docs.module');
    expect(mod).toBeDefined();
  });
});
