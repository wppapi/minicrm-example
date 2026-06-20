import { get, post } from '../api/client.js';
import { enc }       from '../utils.js';

export const ContactService = {
  async get(contactId) {
    const res = await get(`/contacts/${enc(contactId)}`);
    return res?.data || null;
  },

  async check(number) {
    const res = await get(`/contacts/check/${enc(number)}`);
    return res?.data?.exists || res?.data?.onWhatsApp || false;
  },

  async block(contactId) {
    return post(`/contacts/${enc(contactId)}/block`);
  },

  async unblock(contactId) {
    return post(`/contacts/${enc(contactId)}/unblock`);
  },
};
