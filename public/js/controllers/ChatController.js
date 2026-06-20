import { state }                         from '../state.js';
import { ChatService }                   from '../services/ChatService.js';
import { fromApiChat }                   from '../models/Chat.js';
import { renderChatList, refreshChatItem } from '../ui/ChatListView.js';
import { renderMessages }                from '../ui/MessageView.js';
import { loadAvatar, isGroup, showToast } from '../utils.js';

// Callbacks injected by app.js so this controller stays decoupled from DOM wiring
let _callbacks = {};
export function init(callbacks) { _callbacks = callbacks; }

export async function loadChats() {
  try {
    state.chats = await ChatService.list();
  } catch (e) {
    console.error('Failed to load chats:', e);
    state.chats = [];
  }
  renderChatList(
    document.getElementById('chat-list'),
    { onOpen: openChat, onContext: _callbacks.onChatContext }
  );
}

export async function openChat(chatId) {
  state.activeChatId = chatId;
  state.unread[chatId] = 0;

  let chat = state.chats.find(c => c.id === chatId);
  if (!chat) {
    chat = { id: chatId, name: chatId };
    // try to resolve name for groups not in chat list
    if (isGroup(chatId)) {
      try {
        const { GroupService } = await import('../services/GroupService.js');
        const g = await GroupService.get(chatId);
        if (g?.subject) chat.name = g.subject;
      } catch {}
    }
    state.chats.push(chat);
  }

  // reveal chat UI
  document.getElementById('chat-placeholder').style.display = 'none';
  document.getElementById('chat-header').classList.remove('hidden');
  document.getElementById('messages').classList.remove('hidden');
  document.getElementById('input-bar').classList.remove('hidden');
  document.getElementById('app').classList.add('chat-open');

  // header
  const { avatarColors } = await import('../utils.js');
  const { bg, fg } = avatarColors(chat.name || chatId);
  const initial    = (chat.name || chatId || '?').charAt(0).toUpperCase();
  const headerAvatar = document.getElementById('header-avatar');
  headerAvatar.style.background = bg;
  headerAvatar.style.color = fg;
  headerAvatar.textContent = initial;
  document.getElementById('header-name').textContent = chat.name || chatId;
  document.getElementById('header-status').textContent = '';
  document.getElementById('header-participants').textContent = '';
  loadAvatar(chatId, headerAvatar);

  // group vs contact
  const btnGroupInfo = document.getElementById('btn-group-info');
  if (isGroup(chatId)) {
    btnGroupInfo.classList.remove('hidden');
    document.getElementById('contact-panel').classList.add('hidden');
    await _loadGroupParticipantCount(chatId);
  } else {
    btnGroupInfo.classList.add('hidden');
    document.getElementById('group-panel').classList.add('hidden');
  }

  // highlight sidebar item
  document.querySelectorAll('.chat-item').forEach(el =>
    el.classList.toggle('active', el.dataset.chatId === chatId)
  );

  // messages
  const messagesEl = document.getElementById('messages');
  messagesEl.innerHTML = '';
  if (!state.messages[chatId]) {
    try {
      state.messages[chatId] = await ChatService.getMessages(chatId);
    } catch { state.messages[chatId] = []; }
  }
  renderMessages(chatId, messagesEl, _callbacks.messageCallbacks);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  ChatService.markRead(chatId).catch(() => {});
}

export function updateChatPreview(chatId, msg) {
  const preview = msg.text || `[${msg.type}]`;
  const sender  = isGroup(chatId) && msg.senderName ? msg.senderName : null;
  const chat    = state.chats.find(c => c.id === chatId);
  if (chat) {
    chat.lastMessage     = preview;
    chat.lastMessageTime = msg.timestamp;
    chat.lastSender      = sender;
  } else {
    state.chats.unshift(fromApiChat({ id: chatId, name: chatId, lastMessage: { text: preview, timestamp: msg.timestamp, senderName: sender } }));
  }
  refreshChatItem(
    chatId,
    document.getElementById('chat-list'),
    { onOpen: openChat, onContext: _callbacks.onChatContext }
  );
}

async function _loadGroupParticipantCount(chatId) {
  try {
    const { GroupService } = await import('../services/GroupService.js');
    const group = await GroupService.get(chatId);
    if (!group) return;
    state._groupInfo = group;
    const count = group.participants?.length || 0;
    document.getElementById('header-participants').textContent =
      `${count} participant${count !== 1 ? 's' : ''}`;
  } catch {}
}
