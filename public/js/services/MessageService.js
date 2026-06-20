import { post, del, upload } from '../api/client.js';
import { enc }               from '../utils.js';

export const MessageService = {
  async sendText(to, text, quotedId = null) {
    return post('/send/text', { to, text, ...(quotedId && { quotedId }) });
  },

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

  async sendReaction(to, messageId, emoji) {
    return post('/send/reaction', { to, messageId, emoji });
  },

  async sendPoll(to, question, options, singleChoice = false) {
    return post('/send/poll', { to, question, options, singleChoice });
  },

  async sendButtons(to, text, footer, buttons) {
    return post('/send/buttons', { to, text, footer, buttons });
  },

  async sendList(to, title, text, buttonText, sections) {
    return post('/send/list', { to, title, text, buttonText, sections });
  },

  async sendLocation(to, lat, lng, name = '', address = '') {
    return post('/send/location', { to, lat, lng, name, address });
  },

  async sendContact(to, name, phone) {
    return post('/send/contact', { to, name, phone });
  },

  async revoke(chatId, messageId) {
    return del(`/messages/${enc(chatId)}/${enc(messageId)}`);
  },
};
