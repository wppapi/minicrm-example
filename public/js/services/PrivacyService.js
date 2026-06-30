import { get, patch } from '../api/client.js';

export const PrivacyService = {
  async getBlocked() {
    const res = await get('/privacy/blocked');
    return res?.data?.blocked || [];
  },

  async update(field, value) {
    return patch(`/privacy/${field}`, { value });
  },

  async updateMessagesTimer(duration) {
    return patch('/privacy/messages-timer', { duration });
  },

  async updateAll({ lastSeen, profilePicture, status, online, groupsAdd, readReceipts, calls, messagesTimer }) {
    const tasks = [
      lastSeen       != null && this.update('last-seen',       lastSeen),
      profilePicture != null && this.update('profile-picture', profilePicture),
      status         != null && this.update('status',          status),
      online         != null && this.update('online',          online),
      groupsAdd      != null && this.update('groups-add',      groupsAdd),
      readReceipts   != null && this.update('read-receipts',   readReceipts),
      calls          != null && this.update('calls',           calls),
      messagesTimer  != null && this.updateMessagesTimer(Number(messagesTimer)),
    ].filter(Boolean);
    return Promise.allSettled(tasks);
  },
};
