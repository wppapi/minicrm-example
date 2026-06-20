import { get, post, patch, put, del } from '../api/client.js';
import { fromApiLabel }               from '../models/Label.js';
import { enc }                        from '../utils.js';

export const BusinessService = {
  async getLabels() {
    const res = await get('/business/labels');
    return (res?.data || []).map(fromApiLabel);
  },

  async createLabel(name, color) {
    return post('/business/labels', { name, color });
  },

  async updateLabel(id, name, color) {
    return patch(`/business/labels/${enc(id)}`, { name, color });
  },

  async deleteLabel(id) {
    return del(`/business/labels/${enc(id)}`);
  },

  async assignLabel(labelId, chatIds) {
    return post(`/business/labels/${enc(labelId)}/chats`, { chatIds });
  },

  async removeLabel(labelId, chatId) {
    return del(`/business/labels/${enc(labelId)}/chats/${enc(chatId)}`);
  },

  async getHours() {
    const res = await get('/business/hours');
    return res?.data || {};
  },

  async updateHours(hours) {
    return put('/business/hours', { hours });
  },
};
