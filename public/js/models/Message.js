// Message DTO — normalizes raw API/socket payloads into a consistent shape

/**
 * @typedef {Object} Message
 * @property {string}  id
 * @property {string}  type
 * @property {string}  [text]
 * @property {string}  [caption]
 * @property {string}  [fileName]
 * @property {string}  from
 * @property {string}  to
 * @property {boolean} fromMe
 * @property {number}  timestamp
 * @property {number}  [status]
 * @property {string}  [quotedId]
 * @property {string}  [senderName]
 * @property {boolean} [deleted]
 * @property {boolean} [edited]
 * @property {string}  [pollQuestion]
 * @property {Array}   [pollOptions]
 * @property {Array}   [buttons]
 * @property {string}  [footer]
 * @property {string}  [title]
 * @property {string}  [buttonText]
 * @property {Array}   [sections]
 * @property {number}  [lat]
 * @property {number}  [lng]
 * @property {string}  [name]
 * @property {string}  [address]
 * @property {string}  [vcardName]
 * @property {string}  [vcardPhone]
 */

export function fromApiMessage(raw) {
  return {
    id:           raw.messageId || raw.id,
    type:         raw.type || 'text',
    text:         raw.text || raw.body || null,
    caption:      raw.caption || null,
    fileName:     raw.fileName || null,
    from:         raw.from,
    to:           raw.to,
    fromMe:       Boolean(raw.fromMe),
    timestamp:    raw.timestamp,
    status:       raw.status ?? null,
    quotedId:     raw.quotedId || raw.quotedMessageId || null,
    senderName:   raw.senderName || null,
    deleted:      Boolean(raw.deleted),
    edited:       Boolean(raw.edited),
    pollQuestion: raw.pollQuestion || null,
    pollOptions:  raw.pollOptions || null,
    buttons:      raw.buttons || null,
    footer:       raw.footer || null,
    title:        raw.title || null,
    buttonText:   raw.buttonText || null,
    sections:     raw.sections || null,
    lat:          raw.lat ?? null,
    lng:          raw.lng ?? null,
    name:         raw.name || null,
    address:      raw.address || null,
    vcardName:    raw.vcardName || null,
    vcardPhone:   raw.vcardPhone || null,
  };
}

export function fromSocketMessage(data) {
  return fromApiMessage({
    ...data,
    status: data.fromMe ? 1 : undefined,
  });
}

export function fromOptimisticSend({ chatId, type, overrides }) {
  const { nowSec } = overrides;
  return {
    id:        `local-${Date.now()}`,
    type,
    fromMe:    true,
    timestamp: nowSec(),
    status:    1,
    from:      null,
    to:        chatId,
    ...overrides,
  };
}
