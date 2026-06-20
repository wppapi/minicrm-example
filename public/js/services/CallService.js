import { post } from '../api/client.js';

export const CallService = {
  async createLink(options = {}) {
    const res = await post('/calls/link', options);
    return res?.data?.link || null;
  },
};
