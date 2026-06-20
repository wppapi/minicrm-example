import { get, post } from '../api/client.js';
import { enc }       from '../utils.js';

export const ContactService = {
  async list() {
    const res = await get('/contacts');
    return res?.data || [];
  },

  async get(contactId) {
    const res = await get(`/contacts/${enc(contactId)}`);
    return res?.data || null;
  },

  async snapshot(phone) {
    const res = await get(`/contacts/${enc(phone)}/snapshot`);
    return res?.data || null;
  },

  async getStatus(phone) {
    const res = await get(`/contacts/${enc(phone)}/status`);
    return res?.data?.status || null;
  },

  async check(number) {
    const res = await get(`/contacts/check/${enc(number)}`);
    return res?.data?.exists || res?.data?.onWhatsApp || false;
  },

  async block(contactId)   { return post(`/contacts/${enc(contactId)}/block`); },
  async unblock(contactId) { return post(`/contacts/${enc(contactId)}/unblock`); },
  async report(phone, reason = '') { return post(`/contacts/${enc(phone)}/report`, { reason }); },
};
