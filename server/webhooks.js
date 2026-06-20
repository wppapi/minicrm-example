const axios = require('axios');

const { WPP_API_URL, INSTANCE_TOKEN, INSTANCE_ID, PUBLIC_HOST } = process.env;

// baseURL already includes the instance prefix — all proxy routes use relative paths
const wpp = axios.create({
  baseURL: `${WPP_API_URL || 'https://api.wpp-api.io'}/instances/${INSTANCE_ID}`,
  headers: { 'x-instance-token': INSTANCE_TOKEN },
});

const WEBHOOK_EVENTS = [
  { event: 'on-message',           path: 'message' },
  { event: 'on-message-status',    path: 'message-status' },
  { event: 'on-message-deleted',   path: 'message-deleted' },
  { event: 'on-message-edited',    path: 'message-edited' },
  { event: 'on-presence',          path: 'presence' },
  { event: 'on-reaction',          path: 'reaction' },
  { event: 'on-connect',           path: 'connect' },
  { event: 'on-disconnect',        path: 'disconnect' },
  { event: 'on-qr',                path: 'qr' },
  { event: 'on-poll-vote',         path: 'poll-vote' },
  { event: 'on-call',              path: 'call' },
  { event: 'on-group-update',      path: 'group-update' },
  { event: 'on-chat-upsert',       path: 'chat-upsert' },
  { event: 'on-contact-update',    path: 'contact-update' },
  { event: 'on-blocklist-update',  path: 'blocklist-update' },
  { event: 'on-label-association', path: 'label-association' },
  { event: 'on-chat-status',       path: 'chat-status' },
];

async function registerWebhooks() {
  if (!PUBLIC_HOST || PUBLIC_HOST.startsWith('localhost')) {
    console.warn('PUBLIC_HOST not set or is localhost — skipping webhook registration.');
    return;
  }

  const baseUrl = `https://${PUBLIC_HOST}/webhook`;

  for (const { event, path } of WEBHOOK_EVENTS) {
    try {
      await wpp.patch(`/webhooks/${event}`, { url: `${baseUrl}/${path}` });
      console.log(`  ✔ ${event} → ${baseUrl}/${path}`);
    } catch (err) {
      const reason = err.response?.data?.error?.message || err.message;
      console.warn(`  ✖ Failed to register ${event}: ${reason}`);
    }
  }
}

module.exports = { registerWebhooks, wpp };
