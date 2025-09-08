export class PushoverWebhookDto {
  user!: string;
  device?: string;
  action!: string;
  acked?: number;
  acked_at?: number;
  acked_by?: string;
  acked_by_device?: string;
  receipt?: string;
  message?: string;
  app?: string;
  token?: string;
}
