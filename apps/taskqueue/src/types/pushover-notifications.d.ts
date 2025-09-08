declare module 'pushover-notifications' {
  interface PushoverMessage {
    message: string;
    title?: string;
    url?: string;
    url_title?: string;
    priority?: number;
    timestamp?: number;
    sound?: string;
  }

  interface PushoverUser {
    user: string;
    token: string;
  }

  interface PushoverResult {
    status: number;
    request: string;
  }

  class Push {
    constructor(config: PushoverUser);
    send(message: PushoverMessage, callback: (err: Error | null, result: PushoverResult) => void): void;
  }

  const pushover: {
    default: typeof Push;
  };

  export = pushover;
}
