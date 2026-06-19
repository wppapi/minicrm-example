// ─────────────────────────────────────────────
//  miniCRM — WPP API frontend
// ─────────────────────────────────────────────

const socket = io();

// ── State ──────────────────────────────────────
const state = {
  chats: [],
  activeChatId: null,
  messages: {},       // { [chatId]: Message[] }
  reactions: {},      // { [chatId]: { [msgId]: { [emoji]: count } } }
  unread: {},         // { [chatId]: number }
  quotedMessage: null,
  pendingFile: null,  // { file: File, previewUrl: string, type: string }
  mediaRecorder: null,
  audioChunks: [],
  isRecording: false,
  reactionTarget: null, // { msgId, chatId, anchorEl }
  connected: false,
};

// ── DOM refs ────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
  app:              $('app'),
  chatList:         $('chat-list'),
  chatPlaceholder:  $('chat-placeholder'),
  chatHeader:       $('chat-header'),
  headerAvatar:     $('header-avatar'),
  headerName:       $('header-name'),
  headerStatus:     $('header-status'),
  headerParticipants: $('header-participants'),
  messages:         $('messages'),
  inputBar:         $('input-bar'),
  messageInput:     $('message-input'),
  btnSend:          $('btn-send'),
  btnAudio:         $('btn-audio'),
  btnAttach:        $('btn-attach'),
  fileInput:        $('file-input'),
  replyPreview:     $('reply-preview'),
  replyText:        $('reply-text'),
  replyCancel:      $('reply-cancel'),
  filePreview:      $('file-preview'),
  filePreviewContent: $('file-preview-content'),
  fileCancel:       $('file-cancel'),
  searchInput:      $('search-input'),
  reactionPicker:   $('reaction-picker'),
  connStatus:       $('conn-status'),
  qrModal:          $('qr-modal'),
  qrImage:          $('qr-image'),
  callModal:        $('call-modal'),
  callFrom:         $('call-from'),
  callAvatar:       $('call-avatar'),
  btnRejectCall:    $('btn-reject-call'),
};

// ── Init ────────────────────────────────────────
async function init() {
  await loadChats();
  bindEvents();
}

// ── API ─────────────────────────────────────────
async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    headers: isFormData ? {} : { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}

// ── Chats ────────────────────────────────────────
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
  const group = isGroup(chat.id);
  const div = document.createElement('div');
  div.className = 'chat-item' + (chat.id === state.activeChatId ? ' active' : '');
  div.dataset.chatId = chat.id;
  div.innerHTML = `
    <div class="chat-avatar">
      ${avatarHtml(chat)}
      ${group ? '<span class="group-badge">👥</span>' : ''}
    </div>
    <div class="chat-info">
      <div class="chat-info-top">
        <span class="chat-name">${esc(chat.name || chat.id)}</span>
        <span class="chat-time">${formatTime(chat.lastMessageTime)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="chat-preview">${esc(chat.lastMessage || '')}</span>
        ${unread ? `<span class="chat-unread">${unread}</span>` : ''}
      </div>
    </div>`;
  return div;
}

// ── Open chat ────────────────────────────────────
async function openChat(chatId) {
  state.activeChatId = chatId;
  state.unread[chatId] = 0;

  const chat = state.chats.find(c => c.id === chatId);

  els.chatPlaceholder.style.display = 'none';
  els.chatHeader.classList.remove('hidden');
  els.messages.classList.remove('hidden');
  els.inputBar.classList.remove('hidden');
  els.app.classList.add('chat-open');

  els.headerAvatar.innerHTML = avatarHtml(chat);
  els.headerName.textContent = chat?.name || chatId;
  els.headerStatus.textContent = '';

  loadAvatar(chatId, els.headerAvatar);
  els.headerParticipants.textContent = '';

  if (isGroup(chatId)) loadGroupInfo(chatId);

  document.querySelectorAll('.chat-item').forEach(el =>
    el.classList.toggle('active', el.dataset.chatId === chatId)
  );

  els.messages.innerHTML = '';

  if (!state.messages[chatId]) {
    const result = await api(`/chats/${enc(chatId)}/messages`);
    state.messages[chatId] = (result?.data || []).reverse();
  }

  renderMessages(chatId);
  scrollToBottom();

  // mark as read silently
  api(`/chats/${enc(chatId)}/read`, { method: 'POST' }).catch(() => {});
}

// ── Render messages ──────────────────────────────
function renderMessages(chatId) {
  const msgs = state.messages[chatId] || [];
  els.messages.innerHTML = '';
  let lastDay = null;
  msgs.forEach(msg => {
    const day = dayLabel(msg.timestamp);
    if (day !== lastDay) { els.messages.appendChild(daySeparator(day)); lastDay = day; }
    els.messages.appendChild(buildGroup(msg, chatId));
  });
}

function buildGroup(msg, chatId) {
  const group = document.createElement('div');
  group.className = `message-group ${msg.fromMe ? 'out' : 'in'}`;
  group.dataset.msgId = msg.id;

  // react button
  const btnReact = document.createElement('button');
  btnReact.className = 'btn-react';
  btnReact.textContent = '😊';
  btnReact.title = 'React';
  btnReact.addEventListener('click', e => {
    e.stopPropagation();
    showReactionPicker(msg.id, chatId, btnReact);
  });
  group.appendChild(btnReact);

  group.appendChild(buildBubble(msg, chatId));

  // reactions row
  const reactionsEl = buildReactionsEl(chatId, msg.id);
  if (reactionsEl) group.appendChild(reactionsEl);

  return group;
}

function buildBubble(msg, chatId) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${msg.fromMe ? 'out' : 'in'}${msg.deleted ? ' deleted' : ''}`;
  bubble.dataset.msgId = msg.id;

  let inner = '';

  // show sender name on incoming group messages
  if (!msg.fromMe && isGroup(chatId) && msg.senderName) {
    const hue = nameToHue(msg.senderName);
    inner += `<div class="sender-name" style="--hue:${hue}">${esc(msg.senderName)}</div>`;
  }

  if (msg.quotedId) {
    const q = findMessage(chatId, msg.quotedId);
    inner += `<div class="quoted" data-target="${msg.quotedId}">
      <div class="quoted-author">${q?.fromMe ? 'You' : esc(msg.senderName || msg.from || '')}</div>
      <div>${esc(q?.text || q?.type || '…')}</div>
    </div>`;
  }

  if (msg.deleted) {
    inner += `<em style="opacity:.6">This message was deleted</em>`;
  } else {
    inner += renderContent(msg, chatId);
  }

  if (msg.edited) inner += `<span class="edited-label">edited</span>`;

  const ticks = msg.fromMe ? ticksHtml(msg.status) : '';
  inner += `<span class="meta">${formatTime(msg.timestamp)}${ticks}</span>`;

  bubble.innerHTML = inner;

  // click to reply
  bubble.addEventListener('click', () => setReply(msg));

  // quoted → scroll to original
  bubble.querySelector('.quoted')?.addEventListener('click', e => {
    e.stopPropagation();
    scrollToMessage(e.currentTarget.dataset.target);
  });

  return bubble;
}

function renderContent(msg, chatId) {
  switch (msg.type) {
    case 'text':
      return esc(msg.text || '');
    case 'image':
      return `<img class="msg-img" src="/api/media/${enc(chatId)}/${msg.id}" loading="lazy" alt="image" />
              ${msg.caption ? esc(msg.caption) : ''}`;
    case 'video':
      return `<video controls src="/api/media/${enc(chatId)}/${msg.id}"></video>
              ${msg.caption ? esc(msg.caption) : ''}`;
    case 'audio':
    case 'ptt':
      return `<audio controls src="/api/media/${enc(chatId)}/${msg.id}"></audio>`;
    case 'document':
      return `<a href="/api/media/${enc(chatId)}/${msg.id}" download style="color:var(--accent)">
                📄 ${esc(msg.fileName || 'Document')}
              </a>`;
    case 'sticker':
      return `<img class="msg-img" src="/api/media/${enc(chatId)}/${msg.id}" style="width:120px" alt="sticker" />`;
    case 'poll':
      return renderPoll(msg);
    default:
      return `<em style="opacity:.6">[${esc(msg.type || 'unknown')}]</em>`;
  }
}

// ── Poll ─────────────────────────────────────────
function renderPoll(msg) {
  const options = msg.pollOptions || [];
  const total = options.reduce((s, o) => s + (o.votes || 0), 0);
  const optionsHtml = options.map(o => {
    const pct = total ? Math.round((o.votes || 0) / total * 100) : 0;
    return `<div class="poll-option">
      <div class="poll-bar" style="width:${pct}%"></div>
      <div class="poll-label"><span>${esc(o.name)}</span><span class="poll-pct">${pct}%</span></div>
    </div>`;
  }).join('');
  return `<div class="poll-question">📊 ${esc(msg.pollQuestion || 'Poll')}</div>${optionsHtml}`;
}

// ── Reactions ─────────────────────────────────────
function buildReactionsEl(chatId, msgId) {
  const r = state.reactions[chatId]?.[msgId];
  if (!r || !Object.keys(r).length) return null;

  const div = document.createElement('div');
  div.className = 'reactions';
  div.dataset.msgId = msgId;

  for (const [emoji, count] of Object.entries(r)) {
    const badge = document.createElement('div');
    badge.className = 'reaction-badge';
    badge.innerHTML = `${emoji}${count > 1 ? `<span class="r-count">${count}</span>` : ''}`;
    div.appendChild(badge);
  }
  return div;
}

function showReactionPicker(msgId, chatId, anchor) {
  state.reactionTarget = { msgId, chatId };
  const rect = anchor.getBoundingClientRect();
  els.reactionPicker.style.top  = `${rect.top - 56}px`;
  els.reactionPicker.style.left = `${rect.left - 60}px`;
  els.reactionPicker.classList.remove('hidden');
}

function hideReactionPicker() {
  els.reactionPicker.classList.add('hidden');
  state.reactionTarget = null;
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

  const result = await api('/send/text', { method: 'POST', body: JSON.stringify(body) });
  if (result?.data) {
    appendMessage(state.activeChatId, {
      id: result.data.messageId, type: 'text', text,
      fromMe: true, timestamp: nowSec(), status: 1,
      quotedId: body.quotedId || null,
    });
  }
}

// ── Send file ────────────────────────────────────
async function sendFile() {
  if (!state.pendingFile || !state.activeChatId) return;

  const { file, type } = state.pendingFile;
  const form = new FormData();
  form.append('to', state.activeChatId);
  form.append('type', type);
  form.append('file', file, file.name);
  if (state.quotedMessage) form.append('quotedId', state.quotedMessage.id);
  clearReply();
  clearFile();

  const res = await fetch('/api/send/file', { method: 'POST', body: form });
  const result = await res.json();
  if (result?.data) {
    appendMessage(state.activeChatId, {
      id: result.data.messageId, type,
      fromMe: true, timestamp: nowSec(), status: 1,
    });
  }
}

// ── Record audio ─────────────────────────────────
async function toggleRecording() {
  if (state.isRecording) { state.mediaRecorder.stop(); return; }

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
        id: result.data.messageId, type: 'audio',
        fromMe: true, timestamp: nowSec(), status: 1,
      });
    }
  };
  state.mediaRecorder.start();
  state.isRecording = true;
  els.btnAudio.classList.add('recording');
}

// ── Reply ─────────────────────────────────────────
function setReply(msg) {
  state.quotedMessage = msg;
  els.replyText.textContent = msg.text || `[${msg.type}]`;
  els.replyPreview.classList.remove('hidden');
  els.messageInput.focus();
}

function clearReply() {
  state.quotedMessage = null;
  els.replyPreview.classList.add('hidden');
}

// ── File preview ──────────────────────────────────
function handleFileSelected(file) {
  if (!file) return;
  const type = file.type.startsWith('image/') ? 'image'
             : file.type.startsWith('video/') ? 'video'
             : 'document';

  state.pendingFile = { file, type };
  els.filePreviewContent.innerHTML = type === 'image'
    ? `<img src="${URL.createObjectURL(file)}" alt="preview" /><span>${esc(file.name)}</span>`
    : `📄 ${esc(file.name)}`;
  els.filePreview.classList.remove('hidden');
}

function clearFile() {
  state.pendingFile = null;
  els.fileInput.value = '';
  els.filePreview.classList.add('hidden');
  els.filePreviewContent.innerHTML = '';
}

// ── Append message ────────────────────────────────
function appendMessage(chatId, msg) {
  if (!state.messages[chatId]) state.messages[chatId] = [];
  state.messages[chatId].push(msg);

  if (state.activeChatId === chatId) {
    const group = buildGroup(msg, chatId);
    els.messages.appendChild(group);
    scrollToBottom();
  }
}

// ── Avatar loader ─────────────────────────────────
function loadAvatar(contactId, container) {
  const img = new Image();
  img.onload = () => { container.innerHTML = ''; container.appendChild(img); };
  img.src = `/api/contacts/${enc(contactId)}/avatar`;
}

function avatarHtml(chat) {
  const name = chat?.name || chat?.id || '?';
  return `<span>${esc(name.charAt(0).toUpperCase())}</span>`;
}

// ── Socket.io — real-time events ──────────────────

socket.on('message', ({ data }) => {
  const chatId = data.fromMe ? data.to : data.from;
  if (!chatId) return;

  const msg = {
    id: data.id, type: data.type, text: data.text,
    caption: data.caption, fileName: data.fileName,
    from: data.from, to: data.to, fromMe: data.fromMe,
    timestamp: data.timestamp, status: data.fromMe ? 1 : undefined,
    quotedId: data.quotedId || null,
    pollQuestion: data.pollQuestion, pollOptions: data.pollOptions,
    senderName: data.senderName || null,
    participant: data.participant || null,
  };

  appendMessage(chatId, msg);
  updateChatPreview(chatId, msg);

  if (chatId !== state.activeChatId && !data.fromMe) {
    state.unread[chatId] = (state.unread[chatId] || 0) + 1;
    refreshChatItem(chatId);
  }
});

socket.on('message-status', ({ data }) => {
  const bubble = document.querySelector(`.bubble[data-msg-id="${data.id}"]`);
  if (bubble) {
    const tickEl = bubble.querySelector('.ticks');
    if (tickEl) tickEl.outerHTML = rawTicksHtml(data.status);
  }
  const msgs = state.messages[state.activeChatId] || [];
  const msg = msgs.find(m => m.id === data.id);
  if (msg) msg.status = data.status;
});

socket.on('presence', ({ data }) => {
  if (data.chatId !== state.activeChatId) return;
  if (data.type === 'composing')  els.headerStatus.textContent = 'typing…';
  else if (data.type === 'recording') els.headerStatus.textContent = 'recording audio…';
  else els.headerStatus.textContent = '';
});

socket.on('message-deleted', ({ data }) => {
  const chatId = data.from;
  const msg = findMessage(chatId, data.id);
  if (msg) msg.deleted = true;

  const bubble = document.querySelector(`.bubble[data-msg-id="${data.id}"]`);
  if (bubble) {
    bubble.classList.add('deleted');
    bubble.innerHTML = `<em style="opacity:.6">This message was deleted</em>
      <span class="meta">${formatTime(data.timestamp)}</span>`;
  }
});

socket.on('message-edited', ({ data }) => {
  const chatId = data.from;
  const msg = findMessage(chatId, data.id);
  if (msg) { msg.text = data.newText; msg.edited = true; }

  const bubble = document.querySelector(`.bubble[data-msg-id="${data.id}"]`);
  if (!bubble || bubble.classList.contains('deleted')) return;

  const textNode = bubble.childNodes[0];
  if (textNode?.nodeType === Node.TEXT_NODE) textNode.textContent = data.newText;
  if (!bubble.querySelector('.edited-label')) {
    const label = document.createElement('span');
    label.className = 'edited-label';
    label.textContent = 'edited';
    bubble.querySelector('.meta')?.before(label);
  }
});

socket.on('reaction', ({ data }) => {
  const chatId = data.from || data.chatId;
  if (!chatId) return;

  if (!state.reactions[chatId]) state.reactions[chatId] = {};
  if (!state.reactions[chatId][data.messageId]) state.reactions[chatId][data.messageId] = {};

  const r = state.reactions[chatId][data.messageId];
  if (data.emoji) {
    r[data.emoji] = (r[data.emoji] || 0) + 1;
  }

  // update or insert the reactions row in the DOM
  const group = document.querySelector(`.message-group[data-msg-id="${data.messageId}"]`);
  if (!group) return;
  const existing = group.querySelector('.reactions');
  const fresh = buildReactionsEl(chatId, data.messageId);
  if (existing && fresh) group.replaceChild(fresh, existing);
  else if (fresh) group.appendChild(fresh);
});

socket.on('poll-vote', ({ data }) => {
  const chatId = data.from || data.chatId;
  const msg = findMessage(chatId, data.messageId);
  if (!msg || !msg.pollOptions) return;

  data.votes?.forEach(v => {
    const opt = msg.pollOptions.find(o => o.name === v);
    if (opt) opt.votes = (opt.votes || 0) + 1;
  });

  const bubble = document.querySelector(`.bubble[data-msg-id="${data.messageId}"]`);
  if (bubble) {
    const pollEl = bubble.querySelector('.poll-question')?.parentElement;
    if (pollEl) pollEl.innerHTML = renderPoll(msg);
  }
});

socket.on('connect-event', () => {
  state.connected = true;
  els.connStatus.className = 'conn-dot connected';
  els.connStatus.title = 'Connected';
  els.qrModal.classList.add('hidden');
});

socket.on('disconnect-event', () => {
  state.connected = false;
  els.connStatus.className = 'conn-dot disconnected';
  els.connStatus.title = 'Disconnected';
});

socket.on('qr', ({ data }) => {
  els.connStatus.className = 'conn-dot connecting';
  els.connStatus.title = 'Waiting for QR scan';
  els.qrImage.src = `data:image/png;base64,${data.qr}`;
  els.qrModal.classList.remove('hidden');
});

socket.on('group-update', ({ data }) => {
  const chatId = data.from;

  // update group name in sidebar if subject changed
  if (data.action === 'subject') {
    const chat = state.chats.find(c => c.id === chatId);
    if (chat) { chat.name = data.subject; refreshChatItem(chatId); }
    if (state.activeChatId === chatId) els.headerName.textContent = data.subject;
  }

  // show a system message in the open chat for participant changes
  if (state.activeChatId === chatId) {
    const text = groupActionText(data);
    if (text) {
      const el = document.createElement('div');
      el.className = 'system-msg';
      el.textContent = text;
      els.messages.appendChild(el);
      scrollToBottom();
    }
  }
});

socket.on('call', ({ data }) => {
  els.callFrom.textContent = data.from || 'Unknown';
  els.callModal.classList.remove('hidden');
});

// ── Sidebar helpers ───────────────────────────────
function updateChatPreview(chatId, msg) {
  const chat = state.chats.find(c => c.id === chatId);
  const preview = msg.text || `[${msg.type}]`;
  if (chat) {
    chat.lastMessage = preview;
    chat.lastMessageTime = msg.timestamp;
  } else {
    state.chats.unshift({ id: chatId, name: chatId, lastMessage: preview, lastMessageTime: msg.timestamp });
  }
  refreshChatItem(chatId);
}

function refreshChatItem(chatId) {
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;

  const newItem = buildChatItem(chat);
  newItem.addEventListener('click', () => openChat(chat.id));

  const existing = els.chatList.querySelector(`[data-chat-id="${chatId}"]`);
  if (existing) els.chatList.replaceChild(newItem, existing);
  else els.chatList.prepend(newItem);

  // move to top
  els.chatList.prepend(els.chatList.querySelector(`[data-chat-id="${chatId}"]`));
}

// ── Search ────────────────────────────────────────
els.searchInput.addEventListener('input', () => {
  const q = els.searchInput.value.toLowerCase();
  renderChatList(q ? state.chats.filter(c => (c.name || c.id).toLowerCase().includes(q)) : state.chats);
});

// ── Bind all events ───────────────────────────────
function bindEvents() {
  els.messageInput.addEventListener('input', () => autoResize(els.messageInput));
  els.messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  els.btnSend.addEventListener('click', handleSend);
  els.btnAudio.addEventListener('click', toggleRecording);
  els.replyCancel.addEventListener('click', clearReply);
  els.fileCancel.addEventListener('click', clearFile);

  els.fileInput.addEventListener('change', () => handleFileSelected(els.fileInput.files[0]));

  // reaction picker — pick emoji
  els.reactionPicker.addEventListener('click', async e => {
    const emoji = e.target.closest('[data-emoji]')?.dataset.emoji;
    if (!emoji || !state.reactionTarget) return;
    const { msgId, chatId } = state.reactionTarget;
    hideReactionPicker();

    const chat = state.chats.find(c => c.id === chatId);
    await api('/send/reaction', {
      method: 'POST',
      body: JSON.stringify({ to: chatId, messageId: msgId, emoji }),
    });

    // optimistic update
    if (!state.reactions[chatId]) state.reactions[chatId] = {};
    if (!state.reactions[chatId][msgId]) state.reactions[chatId][msgId] = {};
    state.reactions[chatId][msgId][emoji] = (state.reactions[chatId][msgId][emoji] || 0) + 1;

    const group = document.querySelector(`.message-group[data-msg-id="${msgId}"]`);
    if (group) {
      const existing = group.querySelector('.reactions');
      const fresh = buildReactionsEl(chatId, msgId);
      if (existing && fresh) group.replaceChild(fresh, existing);
      else if (fresh) group.appendChild(fresh);
    }
  });

  // close reaction picker when clicking elsewhere
  document.addEventListener('click', e => {
    if (!els.reactionPicker.contains(e.target)) hideReactionPicker();
  });

  // call modal: reject
  els.btnRejectCall.addEventListener('click', () => els.callModal.classList.add('hidden'));
}

function handleSend() {
  if (state.pendingFile) sendFile();
  else sendText();
}

// ── Utilities ─────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function enc(str) { return encodeURIComponent(str); }

function nowSec() { return Math.floor(Date.now() / 1000); }

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

function ticksHtml(status) {
  return rawTicksHtml(status);
}

function rawTicksHtml(status) {
  if (status === 1) return `<span class="ticks sent">✓</span>`;
  if (status === 2) return `<span class="ticks sent">✓✓</span>`;
  if (status === 3) return `<span class="ticks delivered">✓✓</span>`;
  if (status >= 4)  return `<span class="ticks read">✓✓</span>`;
  return '';
}

function scrollToBottom() { els.messages.scrollTop = els.messages.scrollHeight; }

function scrollToMessage(msgId) {
  document.querySelector(`[data-msg-id="${msgId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function findMessage(chatId, msgId) {
  return (state.messages[chatId] || []).find(m => m.id === msgId);
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── Group helpers ─────────────────────────────────

function isGroup(chatId) {
  return String(chatId).endsWith('@g.us');
}

async function loadGroupInfo(chatId) {
  try {
    const result = await api(`/groups/${enc(chatId)}`);
    const group = result?.data;
    if (!group) return;

    const count = group.participants?.length || 0;
    els.headerParticipants.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
  } catch {
    // non-critical — silently skip
  }
}

// Maps a group action to a human-readable system message
function groupActionText({ action, participants = [], subject }) {
  const names = participants.join(', ');
  switch (action) {
    case 'add':      return `${names} joined the group`;
    case 'remove':   return `${names} left the group`;
    case 'promote':  return `${names} is now an admin`;
    case 'demote':   return `${names} is no longer an admin`;
    case 'subject':  return `Group name changed to "${subject}"`;
    case 'description': return 'Group description updated';
    case 'restrict': return 'Only admins can send messages now';
    default:         return null;
  }
}

// Derives a consistent hue (0–360) from a name string for colored sender labels
function nameToHue(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

// ── Start ─────────────────────────────────────────
init();
