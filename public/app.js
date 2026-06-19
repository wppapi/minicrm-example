// ─────────────────────────────────────────────
//  miniCRM — WPP API frontend
// ─────────────────────────────────────────────

const socket = io();

// ── State ──────────────────────────────────────
const state = {
  chats: [],          // list of chats from the API
  activeChatId: null, // JID of the open conversation
  messages: {},       // { [chatId]: Message[] }
  unread: {},         // { [chatId]: number }
  quotedMessage: null,// message being replied to
  mediaRecorder: null,
  audioChunks: [],
  isRecording: false,
};

// ── DOM refs ────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
  chatList:     $('chat-list'),
  chatPlaceholder: $('chat-placeholder'),
  chatHeader:   $('chat-header'),
  headerAvatar: $('header-avatar'),
  headerName:   $('header-name'),
  headerStatus: $('header-status'),
  messages:     $('messages'),
  inputBar:     $('input-bar'),
  messageInput: $('message-input'),
  btnSend:      $('btn-send'),
  btnAudio:     $('btn-audio'),
  replyPreview: $('reply-preview'),
  replyText:    $('reply-text'),
  replyCancel:  $('reply-cancel'),
  searchInput:  $('search-input'),
};

// ── Init ────────────────────────────────────────
async function init() {
  await loadChats();
  bindEvents();
}

// ── API helpers ─────────────────────────────────
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}

// ── Load chat list ───────────────────────────────
async function loadChats() {
  const result = await api('/chats');
  state.chats = result?.data || [];
  renderChatList(state.chats);
}

function renderChatList(chats) {
  els.chatList.innerHTML = '';
  chats.forEach(chat => {
    const item = buildChatItem(chat);
    item.addEventListener('click', () => openChat(chat.id));
    els.chatList.appendChild(item);
  });
}

function buildChatItem(chat) {
  const unread = state.unread[chat.id] || 0;
  const div = document.createElement('div');
  div.className = 'chat-item' + (chat.id === state.activeChatId ? ' active' : '');
  div.dataset.chatId = chat.id;

  div.innerHTML = `
    <div class="chat-avatar">${avatarHtml(chat)}</div>
    <div class="chat-info">
      <div class="chat-info-top">
        <span class="chat-name">${escHtml(chat.name || chat.id)}</span>
        <span class="chat-time">${formatTime(chat.lastMessageTime)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="chat-preview">${escHtml(chat.lastMessage || '')}</span>
        ${unread ? `<span class="chat-unread">${unread}</span>` : ''}
      </div>
    </div>
  `;
  return div;
}

// ── Open a conversation ──────────────────────────
async function openChat(chatId) {
  state.activeChatId = chatId;
  state.unread[chatId] = 0;

  const chat = state.chats.find(c => c.id === chatId);

  // show header and input bar
  els.chatPlaceholder.style.display = 'none';
  els.chatHeader.style.display = 'flex';
  els.messages.style.display = 'flex';
  els.inputBar.style.display = 'flex';

  els.headerAvatar.innerHTML = avatarHtml(chat);
  els.headerName.textContent = chat?.name || chatId;
  els.headerStatus.textContent = '';

  // mark active in sidebar
  document.querySelectorAll('.chat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.chatId === chatId);
  });

  els.messages.innerHTML = '';

  if (!state.messages[chatId]) {
    const result = await api(`/chats/${encodeURIComponent(chatId)}/messages`);
    state.messages[chatId] = (result?.data || []).reverse();
  }

  renderMessages(chatId);
  scrollToBottom();
}

// ── Render all messages for a chat ──────────────
function renderMessages(chatId) {
  const msgs = state.messages[chatId] || [];
  els.messages.innerHTML = '';
  let lastDay = null;

  msgs.forEach(msg => {
    const day = dayLabel(msg.timestamp);
    if (day !== lastDay) {
      els.messages.appendChild(daySeparator(day));
      lastDay = day;
    }
    els.messages.appendChild(buildBubble(msg, chatId));
  });
}

function buildBubble(msg, chatId) {
  const group = document.createElement('div');
  group.className = `message-group ${msg.fromMe ? 'out' : 'in'}`;
  group.dataset.msgId = msg.id;

  const bubble = document.createElement('div');
  bubble.className = `bubble ${msg.fromMe ? 'out' : 'in'}${msg.deleted ? ' deleted' : ''}`;
  bubble.dataset.msgId = msg.id;

  let inner = '';

  // quoted message
  if (msg.quotedId) {
    const quoted = findMessage(chatId, msg.quotedId);
    inner += `<div class="quoted" data-target="${msg.quotedId}">
      <div class="quoted-author">${quoted?.fromMe ? 'You' : escHtml(msg.from || '')}</div>
      <div>${escHtml(quoted?.text || quoted?.type || '…')}</div>
    </div>`;
  }

  // content
  if (msg.deleted) {
    inner += `<span style="opacity:0.6">🚫 This message was deleted</span>`;
  } else if (msg.type === 'text') {
    inner += escHtml(msg.text || '');
  } else if (msg.type === 'image') {
    inner += `<img src="/api/media/${encodeURIComponent(chatId)}/${msg.id}" loading="lazy" alt="image" />`;
    if (msg.caption) inner += escHtml(msg.caption);
  } else if (msg.type === 'video') {
    inner += `<video controls src="/api/media/${encodeURIComponent(chatId)}/${msg.id}"></video>`;
    if (msg.caption) inner += escHtml(msg.caption);
  } else if (msg.type === 'audio' || msg.type === 'ptt') {
    inner += `<audio controls src="/api/media/${encodeURIComponent(chatId)}/${msg.id}"></audio>`;
  } else if (msg.type === 'document') {
    inner += `<a href="/api/media/${encodeURIComponent(chatId)}/${msg.id}" download style="color:var(--accent)">📄 ${escHtml(msg.fileName || 'Document')}</a>`;
  } else if (msg.type === 'sticker') {
    inner += `<img src="/api/media/${encodeURIComponent(chatId)}/${msg.id}" style="width:120px" alt="sticker" />`;
  } else {
    inner += `<span style="opacity:0.6">[${escHtml(msg.type || 'unknown')}]</span>`;
  }

  if (msg.edited) {
    inner += `<span class="edited-label">edited</span>`;
  }

  // meta: time + ticks
  const ticks = msg.fromMe ? ticksHtml(msg.status) : '';
  inner += `<span class="meta">${formatTime(msg.timestamp)}${ticks}</span>`;

  bubble.innerHTML = inner;

  // click to reply
  bubble.addEventListener('click', () => setReply(msg));

  // click quoted to scroll to original
  bubble.querySelector('.quoted')?.addEventListener('click', e => {
    e.stopPropagation();
    scrollToMessage(e.currentTarget.dataset.target);
  });

  group.appendChild(bubble);
  return group;
}

function ticksHtml(status) {
  // status: 1=pending, 2=server, 3=delivered, 4=read, 5=played
  if (status === 1) return `<span class="ticks sent">🕐</span>`;
  if (status === 2) return `<span class="ticks sent">✓</span>`;
  if (status === 3) return `<span class="ticks delivered">✓✓</span>`;
  if (status >= 4) return `<span class="ticks read">✓✓</span>`;
  return '';
}

// ── Send text ────────────────────────────────────
async function sendText() {
  const text = els.messageInput.value.trim();
  if (!text || !state.activeChatId) return;

  els.messageInput.value = '';
  autoResize(els.messageInput);

  const body = { to: state.activeChatId, text };
  if (state.quotedMessage) body.quotedId = state.quotedMessage.id;
  clearReply();

  const result = await api('/send/text', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (result?.data) {
    appendMessage(state.activeChatId, {
      id: result.data.messageId,
      type: 'text',
      text,
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      status: 1,
      quotedId: body.quotedId || null,
    });
  }
}

// ── Record & send audio ──────────────────────────
async function toggleRecording() {
  if (state.isRecording) {
    state.mediaRecorder.stop();
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  state.audioChunks = [];
  state.mediaRecorder = new MediaRecorder(stream);

  state.mediaRecorder.ondataavailable = e => state.audioChunks.push(e.data);

  state.mediaRecorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    els.btnAudio.classList.remove('recording');
    state.isRecording = false;

    const blob = new Blob(state.audioChunks, { type: 'audio/ogg; codecs=opus' });
    const form = new FormData();
    form.append('to', state.activeChatId);
    form.append('audio', blob, 'audio.ogg');
    if (state.quotedMessage) form.append('quotedId', state.quotedMessage.id);
    clearReply();

    const res = await fetch('/api/send/audio', { method: 'POST', body: form });
    const result = await res.json();

    if (result?.data) {
      appendMessage(state.activeChatId, {
        id: result.data.messageId,
        type: 'audio',
        fromMe: true,
        timestamp: Math.floor(Date.now() / 1000),
        status: 1,
      });
    }
  };

  state.mediaRecorder.start();
  state.isRecording = true;
  els.btnAudio.classList.add('recording');
}

// ── Reply ────────────────────────────────────────
function setReply(msg) {
  state.quotedMessage = msg;
  els.replyText.textContent = msg.text || `[${msg.type}]`;
  els.replyPreview.classList.add('visible');
  els.messageInput.focus();
}

function clearReply() {
  state.quotedMessage = null;
  els.replyPreview.classList.remove('visible');
  els.replyText.textContent = '';
}

// ── Append a new message to an open chat ─────────
function appendMessage(chatId, msg) {
  if (!state.messages[chatId]) state.messages[chatId] = [];
  state.messages[chatId].push(msg);

  if (state.activeChatId === chatId) {
    const bubble = buildBubble(msg, chatId);
    els.messages.appendChild(bubble);
    scrollToBottom();
  }
}

// ── Socket.io — real-time events ─────────────────

// New message received
socket.on('message', ({ instanceId, data }) => {
  const chatId = data.fromMe ? data.to : data.from;
  if (!chatId) return;

  const msg = {
    id: data.id,
    type: data.type,
    text: data.text,
    caption: data.caption,
    fileName: data.fileName,
    from: data.from,
    to: data.to,
    fromMe: data.fromMe,
    timestamp: data.timestamp,
    status: data.fromMe ? 1 : undefined,
    quotedId: data.quotedId || null,
    mediaUrl: data.mediaUrl || null,
  };

  appendMessage(chatId, msg);

  // update sidebar preview
  updateChatPreview(chatId, msg);

  // increment unread if this chat isn't open
  if (chatId !== state.activeChatId && !data.fromMe) {
    state.unread[chatId] = (state.unread[chatId] || 0) + 1;
    refreshChatItem(chatId);
  }
});

// Message status update (ticks)
socket.on('message-status', ({ data }) => {
  const bubble = document.querySelector(`.bubble[data-msg-id="${data.id}"]`);
  if (!bubble) return;

  const ticks = bubble.querySelector('.ticks');
  if (ticks) ticks.outerHTML = ticksHtml(data.status).replace('<span', '<span');

  // update in memory
  const chatId = state.activeChatId;
  const msgs = state.messages[chatId] || [];
  const msg = msgs.find(m => m.id === data.id);
  if (msg) msg.status = data.status;
});

// Typing / online presence
socket.on('presence', ({ data }) => {
  if (data.chatId !== state.activeChatId) return;

  if (data.type === 'composing') {
    els.headerStatus.textContent = 'typing…';
  } else if (data.type === 'recording') {
    els.headerStatus.textContent = 'recording audio…';
  } else {
    els.headerStatus.textContent = '';
  }
});

// Message deleted by sender
socket.on('message-deleted', ({ data }) => {
  const chatId = data.from;
  const msgs = state.messages[chatId] || [];
  const msg = msgs.find(m => m.id === data.id);
  if (msg) msg.deleted = true;

  // update the bubble if visible
  const bubble = document.querySelector(`.bubble[data-msg-id="${data.id}"]`);
  if (bubble) {
    bubble.classList.add('deleted');
    bubble.innerHTML = `<span style="opacity:0.6">🚫 This message was deleted</span>
      <span class="meta">${formatTime(data.timestamp)}</span>`;
  }
});

// Message edited by sender
socket.on('message-edited', ({ data }) => {
  const chatId = data.from;
  const msgs = state.messages[chatId] || [];
  const msg = msgs.find(m => m.id === data.id);
  if (msg) { msg.text = data.newText; msg.edited = true; }

  const bubble = document.querySelector(`.bubble[data-msg-id="${data.id}"]`);
  if (!bubble) return;

  // replace text node content and append edited label
  const textNode = bubble.childNodes[0];
  if (textNode?.nodeType === Node.TEXT_NODE) textNode.textContent = data.newText;
  if (!bubble.querySelector('.edited-label')) {
    const label = document.createElement('span');
    label.className = 'edited-label';
    label.textContent = 'edited';
    bubble.querySelector('.meta')?.before(label);
  }
});

// ── Sidebar helpers ──────────────────────────────
function updateChatPreview(chatId, msg) {
  const chat = state.chats.find(c => c.id === chatId);
  if (chat) {
    chat.lastMessage = msg.text || `[${msg.type}]`;
    chat.lastMessageTime = msg.timestamp;
  } else {
    // new chat — add to list
    state.chats.unshift({ id: chatId, name: chatId, lastMessage: msg.text || `[${msg.type}]`, lastMessageTime: msg.timestamp });
  }
  refreshChatItem(chatId);
}

function refreshChatItem(chatId) {
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;

  const existing = els.chatList.querySelector(`[data-chat-id="${chatId}"]`);
  const newItem = buildChatItem(chat);
  newItem.addEventListener('click', () => openChat(chat.id));

  if (existing) {
    els.chatList.replaceChild(newItem, existing);
    // move to top if not already
    els.chatList.prepend(newItem);
  } else {
    els.chatList.prepend(newItem);
  }
}

// ── Search ───────────────────────────────────────
els.searchInput.addEventListener('input', () => {
  const q = els.searchInput.value.toLowerCase();
  const filtered = q
    ? state.chats.filter(c => (c.name || c.id).toLowerCase().includes(q))
    : state.chats;
  renderChatList(filtered);
});

// ── Input auto-resize & send on Enter ────────────
function bindEvents() {
  els.messageInput.addEventListener('input', () => autoResize(els.messageInput));

  els.messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  });

  els.btnSend.addEventListener('click', sendText);
  els.btnAudio.addEventListener('click', toggleRecording);
  els.replyCancel.addEventListener('click', clearReply);
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── Utilities ────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(ts) {
  if (!ts) return '';
  const d = ts > 1e10 ? new Date(ts) : new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(ts) {
  if (!ts) return '';
  const d = ts > 1e10 ? new Date(ts) : new Date(ts * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' });
}

function daySeparator(label) {
  const div = document.createElement('div');
  div.className = 'day-separator';
  div.innerHTML = `<span>${label}</span>`;
  return div;
}

function scrollToBottom() {
  els.messages.scrollTop = els.messages.scrollHeight;
}

function scrollToMessage(msgId) {
  const el = document.querySelector(`[data-msg-id="${msgId}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function avatarHtml(chat) {
  if (chat?.avatar) return `<img src="${chat.avatar}" alt="" />`;
  const name = chat?.name || chat?.id || '?';
  return escHtml(name.charAt(0).toUpperCase());
}

function findMessage(chatId, msgId) {
  return (state.messages[chatId] || []).find(m => m.id === msgId);
}

// ── Start ────────────────────────────────────────
init();
