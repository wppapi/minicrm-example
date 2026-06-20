import { get, post, patch } from '../api/client.js';

export const InstanceService = {
  async getStatus() {
    const res = await get('/instance/status');
    return res?.data?.status || res?.status || 'unknown';
  },

  async getQr() {
    const res = await get('/instance/qr');
    return res?.data?.qr || null;
  },

  async connect()    { return post('/instance/connect'); },
  async disconnect() { return post('/instance/disconnect'); },
  async logout()     { return post('/instance/logout'); },
  async restart()    { return post('/instance/restart'); },

  async pairingCode(phone) {
    return post('/instance/pairing-code', { phone });
  },

  async getProfile() {
    const res = await get('/instance/profile');
    return res?.data || null;
  },

  async updateProfile(fields) {
    return patch('/instance/profile', fields);
  },

  async updateProfilePicture(url) {
    return patch('/profile/picture', { url });
  },
};
