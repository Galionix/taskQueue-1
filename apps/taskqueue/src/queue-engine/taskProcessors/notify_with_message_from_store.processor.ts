import * as Push from 'pushover-notifications';

import { ExeTypes, ExeTypesPayloadMap } from '@tasks/lib';

import { TaskEntity } from '../../task/task.entity';
import { taskProcessorType } from './';

console.log('Push: ', Push.default);

const payloadType = ExeTypesPayloadMap[ExeTypes.notify_with_message_from_store];

export const notifyWithMessageFromStore = (): taskProcessorType => {
  return {
    name: 'notifyWithMessageFromStore',
    description: 'Notifies with a message from the storage',
    blocks: [],
    execute: async (data: TaskEntity, storage) => {
      const { sendIfEmpty, ...payload } = JSON.parse(
        data.payload
      ) as typeof payloadType;
      if (!storage.message && !sendIfEmpty) {
        return { success: true, message: 'No message found in storage' };
      }

      const p = new Push.default({
        user: process.env['PUSHOVER_USER'],
        token: process.env['PUSHOVER_TOKEN'],
      });

      const msg = {
        ...payload,
        message: storage.message || payload.message, // required

      };

      p.send(msg, function (err, result) {
        if (err) {
          throw err;
        }

        console.log(result);
      });

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
