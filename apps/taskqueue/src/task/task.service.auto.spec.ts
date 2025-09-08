/* eslint-disable @typescript-eslint/no-var-requires */

describe('TaskService (auto)', () => {
  it('should require the task service module', () => {
    const svc = require('./task.service');
    expect(svc).toBeDefined();
  });
});
