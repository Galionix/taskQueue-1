import * as Push from 'pushover-notifications';

import { ExeTypes, ExeTypesPayloadMap, TaskModel } from '@tasks/lib';

import { taskProcessorType } from './';

console.log('Push: ', Push.default);

const payloadType = ExeTypesPayloadMap[ExeTypes.notify_with_message_from_store];

export const notifyWithMessageFromStore = (): taskProcessorType => {
  return {
    name: 'notifyWithMessageFromStore',
    description: 'Notifies with a message from the storage',
    blocks: [],
    execute: async (data: TaskModel, storage) => {
      const { sendIfEmpty, ...payload } = JSON.parse(
        data.payload
      ) as typeof payloadType;
      if (!storage.message && !sendIfEmpty) {
        return { success: true, message: 'No message found in storage' };
      }

      const p = new (Push as any).default({
        user: process.env['PUSHOVER_USER'],
        token: process.env['PUSHOVER_TOKEN'],
      });

      const msg = {
        ...payload,
        message: storage.message || payload.message, // required
      };

      p.send(msg, function (err: Error | null, result: any) {
        if (err) {
          throw err;
        }
        console.log(result);
      });
      storage.message = ''; // Clear the message after sending notification
      //   const message = storage.message || 'No message found';
      //   console.log(`Notifying with message: ${message}`);
      return {
        success: true,
        message: 'Notification sent successfully',
        data: { message: storage.message },
      };
    },
  };
};
