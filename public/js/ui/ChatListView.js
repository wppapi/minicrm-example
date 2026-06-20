import { state }                                 from '../state.js';
import { esc, avatarColors, chatTimeLabel, ICONS, isGroup } from '../utils.js';

export function buildChatItem(chat, { onOpen, onContext } = {}) {
  const unread = state.unread[chat.id] || 0;
  const meta   = state.chatMeta[chat.id] || {};
  const group  = isGroup(chat.id);
  const { bg, fg } = avatarColors(chat.name || chat.id);
  const initial    = (chat.name || chat.id || '?').charAt(0).toUpperCase();

  const div = document.createElement('div');
  div.className = 'chat-item' + (chat.id === state.activeChatId ? ' active' : '');
  div.dataset.chatId = chat.id;
  div.innerHTML = `
    <div class="chat-avatar" style="background:${bg};color:${fg}">
      ${initial}
      ${group ? `<span class="group-badge">${ICONS.users}</span>` : ''}
    </div>
    <div class="chat-info">
      <div class="chat-info-top">
        <span class="chat-name">
          ${meta.pinned ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5;vertical-align:middle"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>` : ''}
          ${esc(chat.name || chat.id)}
        </span>
        <span class="chat-time ${unread ? 'unread-time' : ''}">${chatTimeLabel(chat.lastMessageTime)}</span>
      </div>
      <div class="chat-bottom">
        <span class="chat-preview">${buildPreview(chat)}</span>
        ${meta.muted ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.4;flex-shrink:0"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>` : ''}
        ${unread ? `<span class="chat-unread">${unread}</span>` : ''}
      </div>
    </div>`;

  if (onOpen)    div.addEventListener('click', () => onOpen(chat.id));
  if (onContext) div.addEventListener('contextmenu', e => { e.preventDefault(); onContext(e, chat); });
  return div;
}

export function buildPreview(chat) {
  if (!chat.lastMessage) return '';
  const sender = chat.lastSender
    ? `<span class="preview-sender">${esc(chat.lastSender)}: </span>`
    : '';
  return sender + esc(chat.lastMessage);
}

export function renderChatList(chatListEl, { onOpen, onContext } = {}) {
  chatListEl.innerHTML = '';
  let list = state.chats;
  if (state.filter === 'unread') list = list.filter(c => (state.unread[c.id] || 0) > 0);
  if (state.filter === 'groups') list = list.filter(c => isGroup(c.id));
  list.forEach(chat => chatListEl.appendChild(buildChatItem(chat, { onOpen, onContext })));
}

export function refreshChatItem(chatId, chatListEl, { onOpen, onContext } = {}) {
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;
  const next = buildChatItem(chat, { onOpen, onContext });
  const current = chatListEl.querySelector(`[data-chat-id="${chatId}"]`);
  if (current) chatListEl.replaceChild(next, current);
  else chatListEl.prepend(next);
  chatListEl.prepend(chatListEl.querySelector(`[data-chat-id="${chatId}"]`));
}
