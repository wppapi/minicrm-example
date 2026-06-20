import { get, patch } from '../api/client.js';

export const PrivacyService = {
  async get() {
    const res = await get('/privacy');
    return res?.data || {};
  },

  async update(field, value) {
    return patch(`/privacy/${field}`, { value });
  },

  async updateAll({ lastSeen, profilePhoto, status, online, groupsAdd }) {
    return Promise.allSettled([
      this.update('last-seen',     lastSeen),
      this.update('profile-photo', profilePhoto),
      this.update('status',        status),
      this.update('online',        online),
      this.update('groups-add',    groupsAdd),
    ]);
  },
};
