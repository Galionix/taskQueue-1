export enum ETaskState {
  'stopped',
  'paused',
  'error',
  'running',
  'locked',
}

export enum ELockStrategy {
  'pauseOnLock',
  'skipTask',
}