// Chat DTO — normalizes raw API payload

/**
 * @typedef {Object} Chat
 * @property {string}  id
 * @property {string}  name
 * @property {string}  [lastMessage]
 * @property {string}  [lastSender]
 * @property {number}  [lastMessageTime]
 * @property {boolean} [isGroup]
 */

export function fromApiChat(raw) {
  return {
    id:              raw.id,
    name:            raw.name || raw.subject || raw.id,
    lastMessage:     raw.lastMessage?.text || raw.lastMessage || null,
    lastSender:      raw.lastMessage?.senderName || null,
    lastMessageTime: raw.lastMessage?.timestamp || raw.timestamp || null,
    isGroup:         String(raw.id).endsWith('@g.us'),
  };
}
