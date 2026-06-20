import { get, post, patch, del } from '../api/client.js';
import { enc }                   from '../utils.js';

export const ChannelService = {
  async list() {
    const res = await get('/newsletter');
    return res?.data || [];
  },

  async get(channelId) {
    const res = await get(`/newsletter/${enc(channelId)}`);
    return res?.data || null;
  },

  async find(query) {
    const res = await post('/newsletter/find', { query });
    return res?.data || [];
  },

  async create(name, description = '') {
    return post('/newsletter', { name, description });
  },

  async update(channelId, fields) {
    return patch(`/newsletter/${enc(channelId)}`, fields);
  },

  async delete(channelId) {
    return del(`/newsletter/${enc(channelId)}`);
  },

  async follow(channelId)   { return post(`/newsletter/${enc(channelId)}/follow`); },
  async unfollow(channelId) { return post(`/newsletter/${enc(channelId)}/unfollow`); },
  async mute(channelId)     { return post(`/newsletter/${enc(channelId)}/mute`); },
  async unmute(channelId)   { return post(`/newsletter/${enc(channelId)}/unmute`); },

  async transfer(channelId, phone) {
    return post(`/newsletter/${enc(channelId)}/transfer`, { phone });
  },
};
