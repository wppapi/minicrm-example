import { get, post, del, upload } from '../api/client.js';
import { enc }                     from '../utils.js';

export const MessageService = {
  // ── Text & basic ──────────────────────────────────────────────────────────
  async sendText(to, text, quotedId = null) {
    return post('/send/text', { to, text, ...(quotedId && { quotedId }) });
  },

  async sendLink(to, url, title = '', description = '', quotedId = null) {
    return post('/send/link', { to, url, title, description, ...(quotedId && { quotedId }) });
  },

  async sendReaction(to, messageId, emoji) {
    return post('/send/reaction', { to, messageId, emoji });
  },

  async forward(to, messageId) {
    return post('/send/forward', { to, messageId });
  },

  async pin(to, messageId, duration = 86400) {
    return post('/send/pin', { to, messageId, duration });
  },

  async revoke(chatId, messageId) {
    return del(`/messages/${enc(chatId)}/${enc(messageId)}`);
  },

  async get(messageId) {
    return get(`/messages/${enc(messageId)}`);
  },

  // ── Presence ──────────────────────────────────────────────────────────────
  async setPresence(to, type = 'composing') {
    return post('/send/presence', { to, type });
  },

  // ── Media files ───────────────────────────────────────────────────────────
  async sendAudio(to, audioBlob, quotedId = null) {
    const form = new FormData();
    form.append('to', to);
    form.append('audio', audioBlob, 'audio.ogg');
    if (quotedId) form.append('quotedId', quotedId);
    return upload('/send/audio', form);
  },

  async sendFile(to, type, file, quotedId = null) {
    const form = new FormData();
    form.append('to', to);
    form.append('type', type);
    form.append('file', file, file.name);
    if (quotedId) form.append('quotedId', quotedId);
    return upload('/send/file', form);
  },

  async sendImage(to, file, caption = '', quotedId = null) {
    const form = new FormData();
    form.append('to', to);
    form.append('file', file, file.name);
    if (caption) form.append('caption', caption);
    if (quotedId) form.append('quotedId', quotedId);
    return upload('/send/image', form);
  },

  async sendVideo(to, file, caption = '', quotedId = null) {
    const form = new FormData();
    form.append('to', to);
    form.append('file', file, file.name);
    if (caption) form.append('caption', caption);
    if (quotedId) form.append('quotedId', quotedId);
    return upload('/send/video', form);
  },

  async sendDocument(to, file, caption = '', quotedId = null) {
    const form = new FormData();
    form.append('to', to);
    form.append('file', file, file.name);
    if (caption) form.append('caption', caption);
    if (quotedId) form.append('quotedId', quotedId);
    return upload('/send/document', form);
  },

  async sendSticker(to, file) {
    const form = new FormData();
    form.append('to', to);
    form.append('file', file, file.name);
    return upload('/send/sticker', form);
  },

  async sendGif(to, file, caption = '') {
    const form = new FormData();
    form.append('to', to);
    form.append('file', file, file.name);
    if (caption) form.append('caption', caption);
    return upload('/send/gif', form);
  },

  async sendPtv(to, file) {
    const form = new FormData();
    form.append('to', to);
    form.append('file', file, file.name);
    return upload('/send/ptv', form);
  },

  async sendBase64(to, base64, filename, mimetype) {
    return post('/send/base64', { to, base64, filename, mimetype });
  },

  // ── Interactive ───────────────────────────────────────────────────────────
  async sendPoll(to, question, options, singleChoice = false) {
    return post('/send/poll', { to, question, options, singleChoice });
  },

  async votePoll(to, messageId, selectedOptions) {
    return post('/send/poll-vote', { to, messageId, selectedOptions });
  },

  async sendButtons(to, text, footer, buttons) {
    return post('/send/buttons', { to, text, footer, buttons });
  },

  async sendList(to, title, text, buttonText, sections) {
    return post('/send/list', { to, title, text, buttonText, sections });
  },

  async sendCtaButtons(to, text, buttons) {
    return post('/send/cta-buttons', { to, text, buttons });
  },

  async sendCarousel(to, cards) {
    return post('/send/carousel', { to, cards });
  },

  async sendTable(to, title, rows) {
    return post('/send/table', { to, title, rows });
  },

  async sendImageButton(to, file, text, buttons, caption = '') {
    const form = new FormData();
    form.append('to', to);
    form.append('text', text);
    form.append('caption', caption);
    form.append('buttons', JSON.stringify(buttons));
    form.append('file', file, file.name);
    return upload('/send/image-button', form);
  },

  async sendVideoButton(to, file, text, buttons, caption = '') {
    const form = new FormData();
    form.append('to', to);
    form.append('text', text);
    form.append('caption', caption);
    form.append('buttons', JSON.stringify(buttons));
    form.append('file', file, file.name);
    return upload('/send/video-button', form);
  },

  // ── Location & contact ────────────────────────────────────────────────────
  async sendLocation(to, lat, lng, name = '', address = '') {
    return post('/send/location', { to, lat, lng, name, address });
  },

  async sendContact(to, name, phone) {
    return post('/send/contact', { to, name, phone });
  },

  // ── Commerce ──────────────────────────────────────────────────────────────
  async sendOtp(to, otp) {
    return post('/send/otp', { to, otp });
  },

  async sendPix(to, pixData) {
    return post('/send/pix', { to, ...pixData });
  },

  async sendProduct(to, productId) {
    return post('/send/product', { to, productId });
  },

  async sendCatalog(to, items) {
    return post('/send/catalog', { to, items });
  },

  async sendAiText(to, prompt, context = '') {
    return post('/send/ai-text', { to, prompt, context });
  },

  // ── Bulk ──────────────────────────────────────────────────────────────────
  async sendBulk(messages) {
    return post('/send/bulk', { messages });
  },
};
