import { get } from '../api/client.js';
import { enc } from '../utils.js';

// LID (Linked ID) is a privacy-preserving WhatsApp identifier used in groups
// instead of the real phone number. This module resolves LIDs to phone numbers
// by querying the contacts API, with an in-memory cache to avoid redundant requests.

const cache = new Map();

export function isLid(id) {
  return typeof id === 'string' && id.endsWith('@lid');
}

export async function resolveLid(lid) {
  if (cache.has(lid)) return cache.get(lid);

  try {
    // snapshot returns { phone, jid, exists, ... } — best endpoint for LID resolution
    const data = await get(`/contacts/${enc(lid)}/snapshot`);
    const contact = data?.data || data;
    const rawPhone = contact?.phone
      || contact?.jid?.replace('@s.whatsapp.net', '')
      || contact?.phoneNumber;
    const result = rawPhone && !rawPhone.endsWith('@lid') ? rawPhone : null;
    cache.set(lid, result);
    return result;
  } catch {
    cache.set(lid, null);
    return null;
  }
}
