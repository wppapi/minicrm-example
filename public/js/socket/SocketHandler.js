import { state }                          from '../state.js';
import { fromSocketMessage }              from '../models/Message.js';
import { updateChatPreview, openChat }    from '../controllers/ChatController.js';
import { groupActionText }                from '../controllers/GroupController.js';
import { renderPoll, updateReactionsInDom,
         appendMessage, updateTicksInDom,
         markBubbleDeleted, markBubbleEdited } from '../ui/MessageView.js';
import { refreshChatItem }                from '../ui/ChatListView.js';
import { showToast }                      from '../utils.js';

// `io` is a global loaded via the non-module <script> in index.html
export const socket = io();  // eslint-disable-line no-undef

export function setupSocketHandlers(messageCallbacks) {
  // ── Incoming message ──────────────────────────────────
  socket.on('message', ({ data }) => {
    const chatId = data.fromMe ? data.to : data.from;
    if (!chatId) return;
    const msg = fromSocketMessage(data);
    appendMessage(chatId, msg, document.getElementById('messages'), messageCallbacks);
    updateChatPreview(chatId, msg);
    if (chatId !== state.activeChatId && !data.fromMe) {
      state.unread[chatId] = (state.unread[chatId] || 0) + 1;
      refreshChatItem(chatId, document.getElementById('chat-list'), { onOpen: openChat });
    }
  });

  // ── Message status (tick update) ─────────────────────
  socket.on('message-status', ({ data }) => {
    updateTicksInDom(data.id, data.status);
    const msg = (state.messages[state.activeChatId] || []).find(m => m.id === data.id);
    if (msg) msg.status = data.status;
  });

  // ── Typing / recording presence ───────────────────────
  socket.on('presence', ({ data }) => {
    if (data.chatId !== state.activeChatId) return;
    const el = document.getElementById('header-status');
    if (data.type === 'composing')  el.textContent = 'typing…';
    else if (data.type === 'recording') el.textContent = 'recording audio…';
    else                             el.textContent = '';
  });

  // ── Chat status (same as presence, alternate event) ───
  socket.on('chat-status', ({ data }) => {
    if (data.chatId !== state.activeChatId) return;
    const el = document.getElementById('header-status');
    if (data.status === 'composing')  el.textContent = 'typing…';
    else if (data.status === 'recording') el.textContent = 'recording audio…';
    else                              el.textContent = '';
  });

  // ── Deleted message ───────────────────────────────────
  socket.on('message-deleted', ({ data }) => {
    const msg = (state.messages[data.from] || []).find(m => m.id === data.id);
    if (msg) msg.deleted = true;
    markBubbleDeleted(data.id, data.timestamp);
  });

  // ── Edited message ────────────────────────────────────
  socket.on('message-edited', ({ data }) => {
    const msg = (state.messages[data.from] || []).find(m => m.id === data.id);
    if (msg) { msg.text = data.newText; msg.edited = true; }
    markBubbleEdited(data.id, data.newText);
  });

  // ── Reaction ──────────────────────────────────────────
  socket.on('reaction', ({ data }) => {
    const chatId = data.from || data.chatId;
    if (!chatId || !data.emoji) return;
    if (!state.reactions[chatId]) state.reactions[chatId] = {};
    if (!state.reactions[chatId][data.messageId]) state.reactions[chatId][data.messageId] = {};
    state.reactions[chatId][data.messageId][data.emoji] =
      (state.reactions[chatId][data.messageId][data.emoji] || 0) + 1;
    updateReactionsInDom(chatId, data.messageId);
  });

  // ── Poll vote ─────────────────────────────────────────
  socket.on('poll-vote', ({ data }) => {
    const chatId = data.from || data.chatId;
    const msg    = (state.messages[chatId] || []).find(m => m.id === data.messageId);
    if (!msg?.pollOptions) return;
    (data.votes || []).forEach(v => {
      const opt = msg.pollOptions.find(o => o.name === v);
      if (opt) opt.votes = (opt.votes || 0) + 1;
    });
    const bubble = document.querySelector(`.bubble[data-msg-id="${data.messageId}"]`);
    if (bubble) {
      const pollEl = bubble.querySelector('.poll-question');
      if (pollEl) pollEl.parentElement.innerHTML = renderPoll(msg);
    }
  });

  // ── Connection events ─────────────────────────────────
  socket.on('connect-event', () => {
    state.connected = true;
    const dot = document.getElementById('conn-status');
    dot.className = 'conn-dot connected'; dot.title = 'Connected';
    document.getElementById('qr-modal').classList.add('hidden');
    const statusEl = document.getElementById('instance-status-display');
    if (statusEl) statusEl.textContent = 'Connected';
  });

  socket.on('disconnect-event', () => {
    state.connected = false;
    const dot = document.getElementById('conn-status');
    dot.className = 'conn-dot disconnected'; dot.title = 'Disconnected';
    const statusEl = document.getElementById('instance-status-display');
    if (statusEl) statusEl.textContent = 'Disconnected';
  });

  socket.on('qr', ({ data }) => {
    const dot = document.getElementById('conn-status');
    dot.className = 'conn-dot connecting'; dot.title = 'Waiting for QR scan';
    document.getElementById('qr-image').src = `data:image/png;base64,${data.qr}`;
    document.getElementById('qr-modal').classList.remove('hidden');
  });

  // ── Group update ──────────────────────────────────────
  socket.on('group-update', ({ data }) => {
    const chatId = data.from;
    if (data.action === 'subject') {
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) { chat.name = data.subject; refreshChatItem(chatId, document.getElementById('chat-list'), { onOpen: openChat }); }
      if (state.activeChatId === chatId) document.getElementById('header-name').textContent = data.subject;
    }
    if (state.activeChatId === chatId) {
      const text = groupActionText(data);
      if (text) {
        const el = document.createElement('div');
        el.className = 'system-msg'; el.textContent = text;
        const msgEl = document.getElementById('messages');
        msgEl.appendChild(el); msgEl.scrollTop = msgEl.scrollHeight;
      }
    }
  });

  // ── Incoming call ─────────────────────────────────────
  socket.on('call', ({ data }) => {
    document.getElementById('call-from').textContent = data.from || 'Unknown';
    document.getElementById('call-modal').classList.remove('hidden');
  });

  // ── Chat upsert (new chat or update) ──────────────────
  socket.on('chat-upsert', ({ data }) => {
    const existing = state.chats.find(c => c.id === data.id);
    if (existing) {
      if (data.name) existing.name = data.name;
      refreshChatItem(data.id, document.getElementById('chat-list'), { onOpen: openChat });
    } else {
      state.chats.unshift({ id: data.id, name: data.name || data.id });
      import('../ui/ChatListView.js').then(({ renderChatList }) => {
        renderChatList(document.getElementById('chat-list'), { onOpen: openChat });
      });
    }
  });

  // ── Contact update ────────────────────────────────────
  socket.on('contact-update', ({ data }) => {
    const chat = state.chats.find(c => c.id === data.id);
    if (chat && data.name) {
      chat.name = data.name;
      refreshChatItem(data.id, document.getElementById('chat-list'), { onOpen: openChat });
      if (state.activeChatId === data.id) document.getElementById('header-name').textContent = data.name;
    }
  });

  // ── Blocklist update ──────────────────────────────────
  socket.on('blocklist-update', ({ data }) => {
    showToast(data.action === 'block' ? 'Contact blocked' : 'Contact unblocked');
  });

  // ── Label association ─────────────────────────────────
  socket.on('label-association', ({ data }) => {
    showToast(`Label updated for chat`);
  });
}
