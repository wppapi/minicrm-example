import { get, del } from '../api/client.js';
import { enc }      from '../utils.js';

export const QueueService = {
  async list() {
    const res = await get('/queue');
    return res?.data || [];
  },

  async cancelAll() {
    return del('/queue');
  },

  async cancel(messageId) {
    return del(`/queue/${enc(messageId)}`);
  },
};
