// Group DTO

/**
 * @typedef {Object} Group
 * @property {string}    id
 * @property {string}    subject
 * @property {string}    [description]
 * @property {boolean}   announce   - only admins can send
 * @property {Participant[]} participants
 */

/**
 * @typedef {Object} Participant
 * @property {string} id
 * @property {string|null} role  - 'admin' | 'superadmin' | null
 */

export function fromApiGroup(raw) {
  return {
    id:          raw.id,
    subject:     raw.subject || raw.name || '',
    description: raw.description || null,
    announce:    raw.announce === true || raw.announce === 'true',
    participants: (raw.participants || []).map(fromApiParticipant),
  };
}

export function fromApiParticipant(raw) {
  if (typeof raw === 'string') return { id: raw, phone: null, role: null };
  const phone = raw.phone
    ? raw.phone.replace('@s.whatsapp.net', '').replace('@lid', '')
    : null;
  return {
    id:    raw.id,
    phone,
    role:  raw.admin || raw.role || null,
  };
}
