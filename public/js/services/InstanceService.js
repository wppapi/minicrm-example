import { get, post } from '../api/client.js';

export const InstanceService = {
  async getStatus() {
    const res = await get('/instance/status');
    return res?.data?.status || res?.status || 'unknown';
  },

  async getQr() {
    const res = await get('/instance/qr');
    return res?.data?.qr || null;
  },

  async logout() {
    return post('/instance/logout');
  },

  async restart() {
    return post('/instance/restart');
  },
};
