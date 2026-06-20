import { get, post, del } from '../api/client.js';
import { fromApiChat }    from '../models/Chat.js';
import { fromApiMessage } from '../models/Message.js';
import { enc }            from '../utils.js';

export const ChatService = {
  async list() {
    const res = await get('/chats', { limit: 50 });
    return (res?.data || []).map(fromApiChat);
  },

  async getMessages(chatId, limit = 50) {
    const res = await get(`/chats/${enc(chatId)}/messages`, { limit });
    return (res?.data || []).reverse().map(fromApiMessage);
  },

  async markRead(chatId) {
    return post(`/chats/${enc(chatId)}/read`);
  },

  async archive(chatId)   { return post(`/chats/${enc(chatId)}/archive`); },
  async unarchive(chatId) { return post(`/chats/${enc(chatId)}/unarchive`); },
  async pin(chatId)       { return post(`/chats/${enc(chatId)}/pin`); },
  async unpin(chatId)     { return post(`/chats/${enc(chatId)}/unpin`); },

  async mute(chatId, durationSeconds) {
    return post(`/chats/${enc(chatId)}/mute`, { duration: durationSeconds });
  },

  async unmute(chatId) { return post(`/chats/${enc(chatId)}/unmute`); },

  async delete(chatId) { return del(`/chats/${enc(chatId)}`); },

  async clearMessages(chatId) { return del(`/chats/${enc(chatId)}/messages`); },
};
