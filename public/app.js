// ─────────────────────────────────────────────
//  miniCRM — WPP API frontend
// ─────────────────────────────────────────────

const ICONS = {
  user:        `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  users:       `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  fileText:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  barChart:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  slash:       `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
  mapPin:      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  phone:       `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 8.72 19.79 19.79 0 0 1 1.92 0a2 2 0 0 1 1.99-2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
};

const socket = io();

// ── State ──────────────────────────────────────
const state = {
  chats: [],
  activeChatId: null,
  messages: {},
  reactions: {},
  unread: {},
  quotedMessage: null,
  pendingFile: null,
  mediaRecorder: null,
  audioChunks: [],
  isRecording: false,
  reactionTarget: null,
  connected: false,
  filter: 'all',
  // tracks pin/archive/mute per chat for context menu toggle
  chatMeta: {},
  // context menu target
  contextTarget: null,
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
  headerInfoClick:  $('header-info-click'),
  messages:         $('messages'),
  inputBar:         $('input-bar'),
  messageInput:     $('message-input'),
  btnSend:          $('btn-send'),
  btnAudio:         $('btn-audio'),
  btnAttach:        $('btn-attach'),
  fileInput:        $('file-input'),
  attachMenu:       $('attach-menu'),
  replyPreview:     $('reply-preview'),
  replyText:        $('reply-text'),
  replyCancel:      $('reply-cancel'),
  filePreview:      $('file-preview'),
  filePreviewContent: $('file-preview-content'),
  fileCancel:       $('file-cancel'),
  searchInput:      $('search-input'),
  reactionPicker:   $('reaction-picker'),
  contextMenu:      $('context-menu'),
  connStatus:       $('conn-status'),
  // modals
  qrModal:          $('qr-modal'),
  qrImage:          $('qr-image'),
  callModal:        $('call-modal'),
  callFrom:         $('call-from'),
  btnRejectCall:    $('btn-reject-call'),
  createGroupModal:      $('create-group-modal'),
  newGroupName:          $('new-group-name'),
  newGroupParticipants:  $('new-group-participants'),
  btnCancelCreateGroup:  $('btn-cancel-create-group'),
  btnConfirmCreateGroup: $('btn-confirm-create-group'),
  acceptInviteModal:     $('accept-invite-modal'),
  inviteCodeInput:       $('invite-code-input'),
  btnCancelAcceptInvite: $('btn-cancel-accept-invite'),
  btnConfirmAcceptInvite:$('btn-confirm-accept-invite'),
  pollModal:        $('poll-modal'),
  pollQuestion:     $('poll-question'),
  pollOptionsList:  $('poll-options-list'),
  pollSingleChoice: $('poll-single-choice'),
  btnAddPollOption: $('btn-add-poll-option'),
  btnCancelPoll:    $('btn-cancel-poll'),
  btnConfirmPoll:   $('btn-confirm-poll'),
  buttonsModal:     $('buttons-modal'),
  buttonsText:      $('buttons-text'),
  buttonsFooter:    $('buttons-footer'),
  buttonsList:      $('buttons-list'),
  btnAddButton:     $('btn-add-button'),
  btnCancelButtons: $('btn-cancel-buttons'),
  btnConfirmButtons:$('btn-confirm-buttons'),
  listModal:        $('list-modal'),
  listTitle:        $('list-title'),
  listText:         $('list-text'),
  listButtonText:   $('list-button-text'),
  listSections:     $('list-sections'),
  btnAddSection:    $('btn-add-section'),
  btnCancelList:    $('btn-cancel-list'),
  btnConfirmList:   $('btn-confirm-list'),
  locationModal:    $('location-modal'),
  locLat:           $('loc-lat'),
  locLng:           $('loc-lng'),
  locName:          $('loc-name'),
  locAddress:       $('loc-address'),
  btnUseLocation:   $('btn-use-location'),
  btnCancelLocation:$('btn-cancel-location'),
  btnConfirmLocation:$('btn-confirm-location'),
  contactModal:     $('contact-modal'),
  contactName:      $('contact-name'),
  contactPhone:     $('contact-phone'),
  btnCancelContact: $('btn-cancel-contact'),
  btnConfirmContact:$('btn-confirm-contact'),
  checkNumberModal:  $('check-number-modal'),
  checkNumberInput:  $('check-number-input'),
  checkNumberResult: $('check-number-result'),
  btnCancelCheckNumber: $('btn-cancel-check-number'),
  btnConfirmCheckNumber:$('btn-confirm-check-number'),
  btnOpenCheckNumber:   $('btn-open-check-number'),
  muteModal:        $('mute-modal'),
  btnCancelMute:    $('btn-cancel-mute'),
  // group panel (right)
  btnGroupInfo:       $('btn-group-info'),
  groupPanel:         $('group-panel'),
  btnCloseGroupPanel: $('btn-close-group-panel'),
  gpAvatar:           $('gp-avatar'),
  gpName:             $('gp-name'),
  gpDescription:      $('gp-description'),
  gpLabels:           $('gp-labels'),
  btnEditName:        $('btn-edit-name'),
  gpNameEdit:         $('gp-name-edit'),
  gpNameInput:        $('gp-name-input'),
  btnSaveName:        $('btn-save-name'),
  btnCancelName:      $('btn-cancel-name'),
  btnEditDesc:        $('btn-edit-desc'),
  gpDescEdit:         $('gp-desc-edit'),
  gpDescInput:        $('gp-desc-input'),
  btnSaveDesc:        $('btn-save-desc'),
  btnCancelDesc:      $('btn-cancel-desc'),
  gpRestrictToggle:   $('gp-restrict-toggle'),
  gpInviteLink:       $('gp-invite-link'),
  btnLoadInvite:      $('btn-load-invite'),
  btnCopyInvite:      $('btn-copy-invite'),
  btnRevokeInvite:    $('btn-revoke-invite'),
  gpAddInput:         $('gp-add-input'),
  btnAddParticipant:  $('btn-add-participant'),
  gpParticipantsList: $('gp-participants-list'),
  gpParticipantsLabel:$('gp-participants-label'),
  btnLeaveGroup:      $('btn-leave-group'),
  // contact panel (right)
  contactPanel:           $('contact-panel'),
  btnCloseContactPanel:   $('btn-close-contact-panel'),
  cpAvatar:               $('cp-avatar'),
  cpName:                 $('cp-name'),
  cpNumber:               $('cp-number'),
  cpLabels:               $('cp-labels'),
  btnBlockContact:        $('btn-block-contact'),
  // left panels
  businessPanel:    $('business-panel'),
  privacyPanel:     $('privacy-panel'),
  instancePanel:    $('instance-panel'),
  labelsList:       $('labels-list'),
  newLabelName:     $('new-label-name'),
  newLabelColor:    $('new-label-color'),
  btnCreateLabel:   $('btn-create-label'),
  hoursList:        $('hours-list'),
  btnSaveHours:     $('btn-save-hours'),
  privLastSeen:     $('priv-last-seen'),
  privProfilePhoto: $('priv-profile-photo'),
  privStatus:       $('priv-status'),
  privOnline:       $('priv-online'),
  privGroupsAdd:    $('priv-groups-add'),
  btnSavePrivacy:   $('btn-save-privacy'),
  instanceStatusDisplay: $('instance-status-display'),
  btnRefreshStatus: $('btn-refresh-status'),
  btnFetchQr:       $('btn-fetch-qr'),
  instanceQr:       $('instance-qr'),
  btnRestartInstance:$('btn-restart-instance'),
  btnLogoutInstance: $('btn-logout-instance'),
};

// ── Init ────────────────────────────────────────
async function init() {
  bindEvents(); // always bind first — doesn't depend on network
  try { await loadChats(); } catch (e) { console.error('loadChats failed:', e); }
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
  let list = chats;
  if (state.filter === 'unread') list = chats.filter(c => (state.unread[c.id] || 0) > 0);
  if (state.filter === 'groups') list = chats.filter(c => isGroup(c.id));
  list.forEach(chat => {
    const item = buildChatItem(chat);
    item.addEventListener('click', () => openChat(chat.id));
    item.addEventListener('contextmenu', e => showContextMenu(e, chat));
    els.chatList.appendChild(item);
  });
}

function buildChatItem(chat) {
  const unread = state.unread[chat.id] || 0;
  const group = isGroup(chat.id);
  const div = document.createElement('div');
  div.className = 'chat-item' + (chat.id === state.activeChatId ? ' active' : '');
  div.dataset.chatId = chat.id;

  const { bg, fg } = avatarColors(chat.name || chat.id);
  const initial = (chat.name || chat.id || '?').charAt(0).toUpperCase();
  const timeStr = chatTimeLabel(chat.lastMessageTime);
  const hasUnread = unread > 0;
  const meta = state.chatMeta[chat.id] || {};

  div.innerHTML = `
    <div class="chat-avatar" style="background:${bg};color:${fg}">
      ${initial}
      ${group ? `<span class="group-badge">${ICONS.users}</span>` : ''}
    </div>
    <div class="chat-info">
      <div class="chat-info-top">
        <span class="chat-name">
          ${meta.pinned ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>` : ''}
          ${esc(chat.name || chat.id)}
        </span>
        <span class="chat-time ${hasUnread ? 'unread-time' : ''}">${timeStr}</span>
      </div>
      <div class="chat-bottom">
        <span class="chat-preview">${buildPreview(chat)}</span>
        ${meta.muted ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.4;flex-shrink:0"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>` : ''}
        ${hasUnread ? `<span class="chat-unread">${unread}</span>` : ''}
      </div>
    </div>`;
  return div;
}

function buildPreview(chat) {
  if (!chat.lastMessage) return '';
  const sender = chat.lastSender ? `<span class="preview-sender">${esc(chat.lastSender)}: </span>` : '';
  return sender + esc(chat.lastMessage);
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

  const { bg, fg } = avatarColors(chat?.name || chatId);
  const initial = (chat?.name || chatId || '?').charAt(0).toUpperCase();
  els.headerAvatar.style.background = bg;
  els.headerAvatar.style.color = fg;
  els.headerAvatar.textContent = initial;
  els.headerName.textContent = chat?.name || chatId;
  els.headerStatus.textContent = '';
  els.headerParticipants.textContent = '';

  loadAvatar(chatId, els.headerAvatar);

  if (isGroup(chatId)) {
    els.btnGroupInfo.classList.remove('hidden');
    els.groupPanel.classList.add('hidden');
    els.contactPanel.classList.add('hidden');
    loadGroupInfo(chatId);
  } else {
    els.btnGroupInfo.classList.add('hidden');
    els.groupPanel.classList.add('hidden');
  }

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

  const btnReact = document.createElement('button');
  btnReact.className = 'btn-react';
  btnReact.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
  btnReact.title = 'React';
  btnReact.addEventListener('click', e => {
    e.stopPropagation();
    showReactionPicker(msg.id, chatId, btnReact);
  });
  group.appendChild(btnReact);

  const bubble = buildBubble(msg, chatId);

  // right-click on own messages to revoke
  if (msg.fromMe) {
    bubble.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      showMessageContextMenu(e, msg, chatId);
    });
  }

  group.appendChild(bubble);

  const reactionsEl = buildReactionsEl(chatId, msg.id);
  if (reactionsEl) group.appendChild(reactionsEl);

  return group;
}

function buildBubble(msg, chatId) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${msg.fromMe ? 'out' : 'in'}${msg.deleted ? ' deleted' : ''}`;
  bubble.dataset.msgId = msg.id;

  let inner = '';

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
    inner += `<span class="deleted-msg">${ICONS.slash} This message was deleted</span>`;
  } else {
    inner += renderContent(msg, chatId);
  }

  if (msg.edited) inner += `<span class="edited-label">edited</span>`;

  const ticks = msg.fromMe ? ticksHtml(msg.status) : '';
  inner += `<span class="meta">${formatTime(msg.timestamp)}${ticks}</span>`;

  bubble.innerHTML = inner;
  bubble.addEventListener('click', () => setReply(msg));
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
              ${msg.caption ? `<div>${esc(msg.caption)}</div>` : ''}`;
    case 'video':
      return `<video controls src="/api/media/${enc(chatId)}/${msg.id}"></video>
              ${msg.caption ? `<div>${esc(msg.caption)}</div>` : ''}`;
    case 'audio':
    case 'ptt':
      return `<audio controls src="/api/media/${enc(chatId)}/${msg.id}"></audio>`;
    case 'document':
      return `<a href="/api/media/${enc(chatId)}/${msg.id}" download class="doc-link">
                ${ICONS.fileText} ${esc(msg.fileName || 'Document')}
              </a>`;
    case 'sticker':
      return `<img class="msg-img" src="/api/media/${enc(chatId)}/${msg.id}" style="width:120px" alt="sticker" />`;
    case 'poll':
      return renderPoll(msg);
    case 'buttons':
      return renderButtons(msg);
    case 'list':
      return renderList(msg);
    case 'location':
      return renderLocation(msg);
    case 'vcard':
      return renderContact(msg);
    default:
      return `<em style="opacity:.6">[${esc(msg.type || 'unknown')}]</em>`;
  }
}

// ── Special message renderers ─────────────────────

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
  return `<div class="poll-question">${ICONS.barChart} ${esc(msg.pollQuestion || 'Poll')}</div>${optionsHtml}`;
}

function renderButtons(msg) {
  const btns = (msg.buttons || []).map(b =>
    `<div class="msg-button">${esc(b.text || b.displayText || b)}</div>`
  ).join('');
  return `<div>${esc(msg.text || '')}</div>${btns}${msg.footer ? `<div class="msg-footer">${esc(msg.footer)}</div>` : ''}`;
}

function renderList(msg) {
  const sections = (msg.sections || []).map(s => {
    const rows = (s.rows || []).map(r =>
      `<div class="list-row">${esc(r.title || r)}</div>`
    ).join('');
    return `<div class="list-section-title">${esc(s.title || '')}</div>${rows}`;
  }).join('');
  return `<div>${esc(msg.title || msg.text || '')}</div>
          <div class="list-button">${esc(msg.buttonText || 'See options')}</div>
          <div class="list-sections">${sections}</div>`;
}

function renderLocation(msg) {
  const label = msg.name || `${msg.lat}, ${msg.lng}`;
  const mapsUrl = `https://www.google.com/maps?q=${msg.lat},${msg.lng}`;
  return `<a href="${mapsUrl}" target="_blank" rel="noopener" class="location-link">
    ${ICONS.mapPin} ${esc(label)}${msg.address ? `<br><small>${esc(msg.address)}</small>` : ''}
  </a>`;
}

function renderContact(msg) {
  return `<div class="vcard-preview">
    <div class="vcard-icon">${ICONS.phone}</div>
    <div><strong>${esc(msg.vcardName || 'Contact')}</strong><br><small>${esc(msg.vcardPhone || '')}</small></div>
  </div>`;
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

// ── Context menu (right-click on chat) ────────────
function showContextMenu(e, chat) {
  e.preventDefault();
  e.stopPropagation();
  state.contextTarget = chat;

  const meta = state.chatMeta[chat.id] || {};
  $('ctx-pin-label').textContent = meta.pinned ? 'Unpin' : 'Pin';
  $('ctx-archive-label').textContent = meta.archived ? 'Unarchive' : 'Archive';
  $('ctx-mute-label').textContent = meta.muted ? 'Unmute' : 'Mute';

  const menu = els.contextMenu;
  menu.style.top  = `${Math.min(e.clientY, window.innerHeight - 220)}px`;
  menu.style.left = `${Math.min(e.clientX, window.innerWidth - 180)}px`;
  menu.classList.remove('hidden');
}

function hideContextMenu() {
  els.contextMenu.classList.add('hidden');
  state.contextTarget = null;
}

// Message context menu (right-click on own bubble)
let _msgCtxTimeout = null;
function showMessageContextMenu(e, msg, chatId) {
  const menu = document.createElement('div');
  menu.className = 'msg-context-menu';
  menu.style.top  = `${Math.min(e.clientY, window.innerHeight - 80)}px`;
  menu.style.left = `${Math.min(e.clientX, window.innerWidth - 140)}px`;
  menu.innerHTML = `<button class="ctx-item danger">
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
    Delete for everyone
  </button>`;
  document.body.appendChild(menu);

  menu.querySelector('button').addEventListener('click', async () => {
    document.body.removeChild(menu);
    await api(`/messages/${enc(chatId)}/${enc(msg.id)}`, { method: 'DELETE' });
    const bubble = document.querySelector(`.bubble[data-msg-id="${msg.id}"]`);
    if (bubble) {
      bubble.classList.add('deleted');
      bubble.innerHTML = `<span class="deleted-msg">${ICONS.slash} You deleted this message</span>
        <span class="meta">${formatTime(msg.timestamp)}</span>`;
    }
  });

  const removeSelf = () => {
    if (document.body.contains(menu)) document.body.removeChild(menu);
    document.removeEventListener('click', removeSelf);
  };
  setTimeout(() => document.addEventListener('click', removeSelf), 50);
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
  clearReply(); clearFile();
  const res = await fetch('/api/send/file', { method: 'POST', body: form });
  const result = await res.json();
  if (result?.data) {
    appendMessage(state.activeChatId, { id: result.data.messageId, type, fromMe: true, timestamp: nowSec(), status: 1 });
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
      appendMessage(state.activeChatId, { id: result.data.messageId, type: 'audio', fromMe: true, timestamp: nowSec(), status: 1 });
    }
  };
  state.mediaRecorder.start();
  state.isRecording = true;
  els.btnAudio.classList.add('recording');
}

// ── Send Poll ─────────────────────────────────────
function openPollModal() {
  els.pollQuestion.value = '';
  els.pollOptionsList.innerHTML = '';
  els.pollSingleChoice.checked = false;
  addPollOption(); addPollOption();
  els.pollModal.classList.remove('hidden');
}

function addPollOption() {
  const input = document.createElement('input');
  input.type = 'text'; input.className = 'field-input'; input.placeholder = `Option ${els.pollOptionsList.children.length + 1}`;
  els.pollOptionsList.appendChild(input);
}

async function sendPoll() {
  const question = els.pollQuestion.value.trim();
  const options = Array.from(els.pollOptionsList.querySelectorAll('input')).map(i => i.value.trim()).filter(Boolean);
  if (!question || options.length < 2 || !state.activeChatId) return;
  els.pollModal.classList.add('hidden');
  const result = await api('/send/poll', {
    method: 'POST',
    body: JSON.stringify({ to: state.activeChatId, question, options, singleChoice: els.pollSingleChoice.checked }),
  });
  if (result?.data) {
    appendMessage(state.activeChatId, {
      id: result.data.messageId, type: 'poll',
      pollQuestion: question, pollOptions: options.map(n => ({ name: n, votes: 0 })),
      fromMe: true, timestamp: nowSec(), status: 1,
    });
  }
}

// ── Send Buttons ──────────────────────────────────
function openButtonsModal() {
  els.buttonsText.value = ''; els.buttonsFooter.value = '';
  els.buttonsList.innerHTML = '';
  addButton(); addButton();
  els.buttonsModal.classList.remove('hidden');
}

function addButton() {
  if (els.buttonsList.children.length >= 3) return;
  const input = document.createElement('input');
  input.type = 'text'; input.className = 'field-input'; input.placeholder = `Button ${els.buttonsList.children.length + 1} label`;
  els.buttonsList.appendChild(input);
}

async function sendButtons() {
  const text = els.buttonsText.value.trim();
  if (!text || !state.activeChatId) return;
  const buttons = Array.from(els.buttonsList.querySelectorAll('input'))
    .map(i => i.value.trim()).filter(Boolean)
    .map((label, i) => ({ id: `btn${i}`, text: label, displayText: label }));
  if (!buttons.length) return;
  els.buttonsModal.classList.add('hidden');
  const result = await api('/send/buttons', {
    method: 'POST',
    body: JSON.stringify({ to: state.activeChatId, text, footer: els.buttonsFooter.value.trim(), buttons }),
  });
  if (result?.data) {
    appendMessage(state.activeChatId, {
      id: result.data.messageId, type: 'buttons', text, buttons,
      fromMe: true, timestamp: nowSec(), status: 1,
    });
  }
}

// ── Send List ─────────────────────────────────────
function openListModal() {
  els.listTitle.value = ''; els.listText.value = ''; els.listButtonText.value = 'See options';
  els.listSections.innerHTML = '';
  addListSection();
  els.listModal.classList.remove('hidden');
}

function addListSection() {
  const idx = els.listSections.children.length;
  const wrap = document.createElement('div');
  wrap.className = 'list-section-block';
  wrap.innerHTML = `
    <input class="field-input section-title-input" type="text" placeholder="Section ${idx + 1} title" />
    <div class="section-rows"></div>
    <button type="button" class="btn-secondary btn-sm" style="align-self:flex-start;margin-top:4px">+ Add row</button>`;
  wrap.querySelector('button').addEventListener('click', () => {
    const rowWrap = document.createElement('div');
    rowWrap.style.display = 'flex'; rowWrap.style.gap = '6px';
    const ri = document.createElement('input');
    ri.type = 'text'; ri.className = 'field-input'; ri.placeholder = 'Row title'; ri.style.flex = '1';
    rowWrap.appendChild(ri);
    wrap.querySelector('.section-rows').appendChild(rowWrap);
  });
  // add 2 default rows
  for (let i = 0; i < 2; i++) {
    const rowWrap = document.createElement('div');
    rowWrap.style.display = 'flex'; rowWrap.style.gap = '6px';
    const ri = document.createElement('input');
    ri.type = 'text'; ri.className = 'field-input'; ri.placeholder = `Row ${i + 1}`; ri.style.flex = '1';
    rowWrap.appendChild(ri);
    wrap.querySelector('.section-rows').appendChild(rowWrap);
  }
  els.listSections.appendChild(wrap);
}

async function sendList() {
  const title = els.listTitle.value.trim();
  const text = els.listText.value.trim();
  const buttonText = els.listButtonText.value.trim() || 'See options';
  if (!title || !text || !state.activeChatId) return;

  const sections = Array.from(els.listSections.querySelectorAll('.list-section-block')).map(block => ({
    title: block.querySelector('.section-title-input').value.trim(),
    rows: Array.from(block.querySelectorAll('.section-rows input'))
      .map((inp, i) => ({ id: `row${i}`, title: inp.value.trim() }))
      .filter(r => r.title),
  })).filter(s => s.rows.length);

  if (!sections.length) return;
  els.listModal.classList.add('hidden');

  const result = await api('/send/list', {
    method: 'POST',
    body: JSON.stringify({ to: state.activeChatId, title, text, buttonText, sections }),
  });
  if (result?.data) {
    appendMessage(state.activeChatId, {
      id: result.data.messageId, type: 'list', title, text, buttonText, sections,
      fromMe: true, timestamp: nowSec(), status: 1,
    });
  }
}

// ── Send Location ─────────────────────────────────
function openLocationModal() {
  els.locLat.value = ''; els.locLng.value = '';
  els.locName.value = ''; els.locAddress.value = '';
  els.locationModal.classList.remove('hidden');
}

async function sendLocation() {
  const lat = parseFloat(els.locLat.value);
  const lng = parseFloat(els.locLng.value);
  if (isNaN(lat) || isNaN(lng) || !state.activeChatId) return;
  const name = els.locName.value.trim();
  const address = els.locAddress.value.trim();
  els.locationModal.classList.add('hidden');
  const result = await api('/send/location', {
    method: 'POST',
    body: JSON.stringify({ to: state.activeChatId, lat, lng, name, address }),
  });
  if (result?.data) {
    appendMessage(state.activeChatId, { id: result.data.messageId, type: 'location', lat, lng, name, address, fromMe: true, timestamp: nowSec(), status: 1 });
  }
}

// ── Send Contact card ─────────────────────────────
function openContactCardModal() {
  els.contactName.value = ''; els.contactPhone.value = '';
  els.contactModal.classList.remove('hidden');
}

async function sendContactCard() {
  const name = els.contactName.value.trim();
  const phone = els.contactPhone.value.trim();
  if (!name || !phone || !state.activeChatId) return;
  els.contactModal.classList.add('hidden');
  const result = await api('/send/contact', {
    method: 'POST',
    body: JSON.stringify({ to: state.activeChatId, name, phone }),
  });
  if (result?.data) {
    appendMessage(state.activeChatId, { id: result.data.messageId, type: 'vcard', vcardName: name, vcardPhone: phone, fromMe: true, timestamp: nowSec(), status: 1 });
  }
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
    : `${ICONS.fileText} ${esc(file.name)}`;
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
    els.messages.appendChild(buildGroup(msg, chatId));
    scrollToBottom();
  }
}

// ── Avatar ────────────────────────────────────────
function loadAvatar(contactId, container) {
  const img = new Image();
  img.onload = () => { container.innerHTML = ''; container.appendChild(img); };
  img.src = `/api/contacts/${enc(contactId)}/avatar`;
}

function avatarColors(str) {
  const PALETTES = [
    { bg: '#d9534f', fg: '#fff' }, { bg: '#5cb85c', fg: '#fff' },
    { bg: '#5bc0de', fg: '#fff' }, { bg: '#f0ad4e', fg: '#fff' },
    { bg: '#9b59b6', fg: '#fff' }, { bg: '#1abc9c', fg: '#fff' },
    { bg: '#e67e22', fg: '#fff' }, { bg: '#3498db', fg: '#fff' },
    { bg: '#e91e8c', fg: '#fff' }, { bg: '#00897b', fg: '#fff' },
    { bg: '#8e44ad', fg: '#fff' }, { bg: '#c0392b', fg: '#fff' },
  ];
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return PALETTES[Math.abs(h) % PALETTES.length];
}

function chatTimeLabel(ts) {
  if (!ts) return '';
  const d = ts > 1e10 ? new Date(ts) : new Date(ts * 1000);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
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
  const msg = findMessage(state.activeChatId, data.id);
  if (msg) msg.status = data.status;
});

socket.on('presence', ({ data }) => {
  if (data.chatId !== state.activeChatId) return;
  if (data.type === 'composing')       els.headerStatus.textContent = 'typing…';
  else if (data.type === 'recording')  els.headerStatus.textContent = 'recording audio…';
  else                                  els.headerStatus.textContent = '';
});

socket.on('message-deleted', ({ data }) => {
  const chatId = data.from;
  const msg = findMessage(chatId, data.id);
  if (msg) msg.deleted = true;
  const bubble = document.querySelector(`.bubble[data-msg-id="${data.id}"]`);
  if (bubble) {
    bubble.classList.add('deleted');
    bubble.innerHTML = `<span class="deleted-msg">${ICONS.slash} This message was deleted</span>
      <span class="meta">${formatTime(data.timestamp)}</span>`;
  }
});

socket.on('message-edited', ({ data }) => {
  const msg = findMessage(data.from, data.id);
  if (msg) { msg.text = data.newText; msg.edited = true; }
  const bubble = document.querySelector(`.bubble[data-msg-id="${data.id}"]`);
  if (!bubble || bubble.classList.contains('deleted')) return;
  const textNode = bubble.childNodes[0];
  if (textNode?.nodeType === Node.TEXT_NODE) textNode.textContent = data.newText;
  if (!bubble.querySelector('.edited-label')) {
    const label = document.createElement('span');
    label.className = 'edited-label'; label.textContent = 'edited';
    bubble.querySelector('.meta')?.before(label);
  }
});

socket.on('reaction', ({ data }) => {
  const chatId = data.from || data.chatId;
  if (!chatId) return;
  if (!state.reactions[chatId]) state.reactions[chatId] = {};
  if (!state.reactions[chatId][data.messageId]) state.reactions[chatId][data.messageId] = {};
  const r = state.reactions[chatId][data.messageId];
  if (data.emoji) r[data.emoji] = (r[data.emoji] || 0) + 1;
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
    const pollEl = bubble.querySelector('.poll-question');
    if (pollEl) pollEl.parentElement.innerHTML = renderPoll(msg);
  }
});

socket.on('connect-event', () => {
  state.connected = true;
  els.connStatus.className = 'conn-dot connected';
  els.connStatus.title = 'Connected';
  els.qrModal.classList.add('hidden');
  if (els.instanceStatusDisplay) els.instanceStatusDisplay.textContent = 'Connected';
});

socket.on('disconnect-event', () => {
  state.connected = false;
  els.connStatus.className = 'conn-dot disconnected';
  els.connStatus.title = 'Disconnected';
  if (els.instanceStatusDisplay) els.instanceStatusDisplay.textContent = 'Disconnected';
});

socket.on('qr', ({ data }) => {
  els.connStatus.className = 'conn-dot connecting';
  els.connStatus.title = 'Waiting for QR scan';
  els.qrImage.src = `data:image/png;base64,${data.qr}`;
  els.qrModal.classList.remove('hidden');
});

socket.on('group-update', ({ data }) => {
  const chatId = data.from;
  if (data.action === 'subject') {
    const chat = state.chats.find(c => c.id === chatId);
    if (chat) { chat.name = data.subject; refreshChatItem(chatId); }
    if (state.activeChatId === chatId) els.headerName.textContent = data.subject;
  }
  if (state.activeChatId === chatId) {
    const text = groupActionText(data);
    if (text) {
      const el = document.createElement('div');
      el.className = 'system-msg'; el.textContent = text;
      els.messages.appendChild(el); scrollToBottom();
    }
  }
});

socket.on('call', ({ data }) => {
  els.callFrom.textContent = data.from || 'Unknown';
  els.callModal.classList.remove('hidden');
});

socket.on('chat-upsert', ({ data }) => {
  const chatId = data.id;
  const existing = state.chats.find(c => c.id === chatId);
  if (existing) {
    if (data.name) existing.name = data.name;
    if (data.lastMessage) existing.lastMessage = data.lastMessage;
    if (data.lastMessageTime) existing.lastMessageTime = data.lastMessageTime;
    refreshChatItem(chatId);
  } else {
    state.chats.unshift({ id: chatId, name: data.name || chatId, ...data });
    renderChatList(state.chats);
  }
});

socket.on('contact-update', ({ data }) => {
  const chatId = data.id;
  const chat = state.chats.find(c => c.id === chatId);
  if (chat && data.name) {
    chat.name = data.name;
    refreshChatItem(chatId);
    if (state.activeChatId === chatId) els.headerName.textContent = data.name;
  }
});

socket.on('blocklist-update', ({ data }) => {
  showToast(data.action === 'block' ? `Contact blocked` : `Contact unblocked`);
});

socket.on('label-association', ({ data }) => {
  const chatId = data.chatId;
  if (state.activeChatId === chatId && !isGroup(chatId)) {
    // refresh contact panel labels if open
    if (!els.contactPanel.classList.contains('hidden')) {
      loadLabelsForContact(chatId);
    }
  }
});

socket.on('chat-status', ({ data }) => {
  if (data.chatId !== state.activeChatId) return;
  if (data.status === 'composing') els.headerStatus.textContent = 'typing…';
  else if (data.status === 'recording') els.headerStatus.textContent = 'recording audio…';
  else els.headerStatus.textContent = '';
});

// ── Toast notification ────────────────────────────
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => document.body.removeChild(toast), 300); }, 3000);
}

// ── Sidebar helpers ───────────────────────────────
function updateChatPreview(chatId, msg) {
  const preview = msg.text || `[${msg.type}]`;
  const sender = isGroup(chatId) && msg.senderName ? msg.senderName : null;
  const chat = state.chats.find(c => c.id === chatId);
  if (chat) { chat.lastMessage = preview; chat.lastMessageTime = msg.timestamp; chat.lastSender = sender; }
  else { state.chats.unshift({ id: chatId, name: chatId, lastMessage: preview, lastMessageTime: msg.timestamp, lastSender: sender }); }
  refreshChatItem(chatId);
}

function refreshChatItem(chatId) {
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;
  const newItem = buildChatItem(chat);
  newItem.addEventListener('click', () => openChat(chat.id));
  newItem.addEventListener('contextmenu', e => showContextMenu(e, chat));
  const existing = els.chatList.querySelector(`[data-chat-id="${chatId}"]`);
  if (existing) els.chatList.replaceChild(newItem, existing);
  else els.chatList.prepend(newItem);
  els.chatList.prepend(els.chatList.querySelector(`[data-chat-id="${chatId}"]`));
}

// ── Business panel ────────────────────────────────
let _labels = [];

async function loadBusinessPanel() {
  await loadLabels();
  await loadBusinessHours();
}

async function loadLabels() {
  const result = await api('/business/labels');
  _labels = result?.data || [];
  renderLabelsList();
}

function renderLabelsList() {
  els.labelsList.innerHTML = '';
  _labels.forEach(label => {
    const item = document.createElement('div');
    item.className = 'label-item';
    item.innerHTML = `
      <span class="label-dot" style="background:${esc(label.color || '#aaa')}"></span>
      <span style="flex:1">${esc(label.name)}</span>
      <button class="btn-icon-sm" data-action="delete-label" data-id="${label.id}" title="Delete">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>`;
    item.querySelector('[data-action="delete-label"]').addEventListener('click', async () => {
      await api(`/business/labels/${label.id}`, { method: 'DELETE' });
      loadLabels();
    });
    els.labelsList.appendChild(item);
  });
}

async function loadLabelsForContact(chatId) {
  if (!els.cpLabels) return;
  els.cpLabels.innerHTML = '';
  _labels.forEach(label => {
    const chip = document.createElement('div');
    chip.className = 'label-chip';
    chip.style.background = label.color || '#aaa';
    chip.textContent = label.name;
    chip.title = 'Click to assign/remove';
    chip.addEventListener('click', async () => {
      await api(`/business/labels/${label.id}/chats`, {
        method: 'POST', body: JSON.stringify({ chatIds: [chatId] }),
      });
      showToast(`Label "${label.name}" assigned`);
    });
    els.cpLabels.appendChild(chip);
  });
}

async function loadLabelsForGroup(chatId) {
  if (!els.gpLabels) return;
  els.gpLabels.innerHTML = '';
  _labels.forEach(label => {
    const chip = document.createElement('div');
    chip.className = 'label-chip';
    chip.style.background = label.color || '#aaa';
    chip.textContent = label.name;
    chip.title = 'Click to assign/remove';
    chip.addEventListener('click', async () => {
      await api(`/business/labels/${label.id}/chats`, {
        method: 'POST', body: JSON.stringify({ chatIds: [chatId] }),
      });
      showToast(`Label "${label.name}" assigned`);
    });
    els.gpLabels.appendChild(chip);
  });
}

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

async function loadBusinessHours() {
  const result = await api('/business/hours');
  const hours = result?.data || {};
  els.hoursList.innerHTML = '';
  DAYS.forEach((day, i) => {
    const dayData = hours[i] || {};
    const row = document.createElement('div');
    row.className = 'hours-row';
    row.innerHTML = `
      <label class="toggle hours-day-toggle">
        <input type="checkbox" data-day="${i}" ${dayData.open ? 'checked' : ''} />
        <span class="toggle-slider"></span>
      </label>
      <span class="hours-day-name">${day}</span>
      <input type="time" class="field-time" data-day="${i}" data-type="open" value="${dayData.openTime || '09:00'}" />
      <span>—</span>
      <input type="time" class="field-time" data-day="${i}" data-type="close" value="${dayData.closeTime || '18:00'}" />`;
    els.hoursList.appendChild(row);
  });
}

async function saveBusinessHours() {
  const hours = {};
  els.hoursList.querySelectorAll('.hours-row').forEach(row => {
    const day = row.querySelector('[data-day]').dataset.day;
    const open = row.querySelector('[type="checkbox"]').checked;
    const openTime = row.querySelector('[data-type="open"]').value;
    const closeTime = row.querySelector('[data-type="close"]').value;
    hours[day] = { open, openTime, closeTime };
  });
  await api('/business/hours', { method: 'PUT', body: JSON.stringify({ hours }) });
  showToast('Business hours saved');
}

// ── Privacy panel ─────────────────────────────────
async function loadPrivacyPanel() {
  const result = await api('/privacy');
  const p = result?.data || {};
  if (p.lastSeen)     els.privLastSeen.value     = p.lastSeen;
  if (p.profilePhoto) els.privProfilePhoto.value  = p.profilePhoto;
  if (p.status)       els.privStatus.value        = p.status;
  if (p.online)       els.privOnline.value        = p.online;
  if (p.groupsAdd)    els.privGroupsAdd.value     = p.groupsAdd;
}

async function savePrivacy() {
  const fields = [
    { path: '/privacy/last-seen',     key: 'lastSeen',    el: els.privLastSeen },
    { path: '/privacy/profile-photo', key: 'profilePhoto', el: els.privProfilePhoto },
    { path: '/privacy/status',        key: 'status',      el: els.privStatus },
    { path: '/privacy/online',        key: 'online',      el: els.privOnline },
    { path: '/privacy/groups-add',    key: 'groupsAdd',   el: els.privGroupsAdd },
  ];
  await Promise.all(fields.map(f =>
    api(f.path, { method: 'PATCH', body: JSON.stringify({ value: f.el.value }) }).catch(() => {})
  ));
  showToast('Privacy settings saved');
}

// ── Instance panel ────────────────────────────────
async function refreshInstanceStatus() {
  try {
    const result = await api('/instance/status');
    els.instanceStatusDisplay.textContent = result?.data?.status || result?.status || 'Unknown';
  } catch {
    els.instanceStatusDisplay.textContent = 'Error';
  }
}

// ── Contact info panel ────────────────────────────
async function openContactPanel(chatId) {
  if (!chatId || isGroup(chatId)) return;
  const contactId = chatId;

  const { bg, fg } = avatarColors(contactId);
  els.cpAvatar.style.background = bg;
  els.cpAvatar.style.color = fg;
  els.cpAvatar.textContent = contactId.charAt(0).toUpperCase();
  loadAvatar(contactId, els.cpAvatar);

  els.cpName.textContent = state.chats.find(c => c.id === contactId)?.name || contactId;
  els.cpNumber.textContent = contactId.replace('@s.whatsapp.net', '').replace('@c.us', '');

  // labels
  await loadLabels();
  loadLabelsForContact(contactId);

  // block/unblock button
  els.btnBlockContact.textContent = 'Block contact';
  els.btnBlockContact.onclick = async () => {
    if (!confirm('Block this contact?')) return;
    await api(`/contacts/${enc(contactId)}/block`, { method: 'POST' });
    showToast('Contact blocked');
  };

  els.contactPanel.classList.remove('hidden');
  els.groupPanel.classList.add('hidden');
}

// ── Search ────────────────────────────────────────
els.searchInput.addEventListener('input', () => {
  const q = els.searchInput.value.toLowerCase();
  renderChatList(q ? state.chats.filter(c => (c.name || c.id).toLowerCase().includes(q)) : state.chats);
});

// ── Filter chips ──────────────────────────────────
document.querySelectorAll('.filter-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    state.filter = btn.dataset.filter;
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderChatList(state.chats);
  });
});

// ── Left nav panel switching ──────────────────────
function openLeftPanel(name) {
  ['business', 'privacy', 'instance'].forEach(p => {
    const panel = $(`${p}-panel`);
    if (panel) panel.classList[p === name ? 'remove' : 'add']('hidden');
  });
  document.querySelectorAll('.nav-btn[data-panel]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panel === name);
  });
  if (name === 'business') loadBusinessPanel().catch(() => {});
  if (name === 'privacy')  loadPrivacyPanel().catch(() => {});
  if (name === 'instance') refreshInstanceStatus().catch(() => {});
}

function closeAllLeftPanels() {
  ['business', 'privacy', 'instance'].forEach(p => {
    const panel = $(`${p}-panel`);
    if (panel) panel.classList.add('hidden');
  });
  document.querySelectorAll('.nav-btn[data-panel]').forEach(btn => btn.classList.remove('active'));
}

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

  // header click → open contact/group info
  els.headerInfoClick?.addEventListener('click', () => {
    if (!state.activeChatId) return;
    if (isGroup(state.activeChatId)) openGroupPanel(state.activeChatId);
    else openContactPanel(state.activeChatId);
  });

  // ── Attach menu ──
  els.btnAttach.addEventListener('click', e => {
    e.stopPropagation();
    const rect = els.btnAttach.getBoundingClientRect();
    els.attachMenu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    els.attachMenu.style.left   = `${rect.left}px`;
    els.attachMenu.classList.toggle('hidden');
  });
  els.attachMenu.querySelectorAll('.attach-item').forEach(btn => {
    btn.addEventListener('click', () => {
      els.attachMenu.classList.add('hidden');
      const type = btn.dataset.type;
      if (type === 'file')     els.fileInput.click();
      if (type === 'poll')     openPollModal();
      if (type === 'buttons')  openButtonsModal();
      if (type === 'list')     openListModal();
      if (type === 'location') openLocationModal();
      if (type === 'contact')  openContactCardModal();
    });
  });
  document.addEventListener('click', e => {
    if (!els.attachMenu.contains(e.target) && e.target !== els.btnAttach) {
      els.attachMenu.classList.add('hidden');
    }
  });

  // ── Poll modal ──
  els.btnAddPollOption.addEventListener('click', addPollOption);
  els.btnCancelPoll.addEventListener('click', () => els.pollModal.classList.add('hidden'));
  els.btnConfirmPoll.addEventListener('click', sendPoll);

  // ── Buttons modal ──
  els.btnAddButton.addEventListener('click', addButton);
  els.btnCancelButtons.addEventListener('click', () => els.buttonsModal.classList.add('hidden'));
  els.btnConfirmButtons.addEventListener('click', sendButtons);

  // ── List modal ──
  els.btnAddSection.addEventListener('click', addListSection);
  els.btnCancelList.addEventListener('click', () => els.listModal.classList.add('hidden'));
  els.btnConfirmList.addEventListener('click', sendList);

  // ── Location modal ──
  els.btnUseLocation.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(pos => {
      els.locLat.value = pos.coords.latitude;
      els.locLng.value = pos.coords.longitude;
    }, () => showToast('Could not get location'));
  });
  els.btnCancelLocation.addEventListener('click', () => els.locationModal.classList.add('hidden'));
  els.btnConfirmLocation.addEventListener('click', sendLocation);

  // ── Contact card modal ──
  els.btnCancelContact.addEventListener('click', () => els.contactModal.classList.add('hidden'));
  els.btnConfirmContact.addEventListener('click', sendContactCard);

  // ── Check number modal ──
  els.btnOpenCheckNumber?.addEventListener('click', () => {
    els.checkNumberInput.value = '';
    els.checkNumberResult.classList.add('hidden');
    els.checkNumberResult.textContent = '';
    els.checkNumberModal.classList.remove('hidden');
  });
  els.btnCancelCheckNumber?.addEventListener('click', () => els.checkNumberModal.classList.add('hidden'));
  els.btnConfirmCheckNumber?.addEventListener('click', async () => {
    const number = els.checkNumberInput.value.trim();
    if (!number) return;
    els.checkNumberResult.textContent = 'Checking…';
    els.checkNumberResult.classList.remove('hidden');
    try {
      const result = await api(`/contacts/check/${enc(number)}`);
      const onWA = result?.data?.exists || result?.data?.onWhatsApp;
      els.checkNumberResult.textContent = onWA
        ? `+${number} is on WhatsApp`
        : `+${number} is NOT on WhatsApp`;
      els.checkNumberResult.className = `check-result ${onWA ? 'ok' : 'nok'}`;
    } catch {
      els.checkNumberResult.textContent = 'Error checking number';
    }
  });

  // ── Mute modal ──
  document.querySelectorAll('.mute-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      els.muteModal.classList.add('hidden');
      const chatId = state._muteTarget;
      if (!chatId) return;
      const seconds = parseInt(btn.dataset.seconds);
      await api(`/chats/${enc(chatId)}/mute`, { method: 'POST', body: JSON.stringify({ duration: seconds }) });
      state.chatMeta[chatId] = { ...state.chatMeta[chatId], muted: true };
      refreshChatItem(chatId);
    });
  });
  els.btnCancelMute?.addEventListener('click', () => els.muteModal.classList.add('hidden'));

  // ── Context menu (chat list right-click) ──
  els.contextMenu.querySelectorAll('.ctx-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      const chat = state.contextTarget;
      if (!chat) return;
      hideContextMenu();
      const action = btn.dataset.action;
      const meta = state.chatMeta[chat.id] || {};
      if (action === 'pin') {
        if (meta.pinned) {
          await api(`/chats/${enc(chat.id)}/unpin`, { method: 'POST' });
          state.chatMeta[chat.id] = { ...meta, pinned: false };
        } else {
          await api(`/chats/${enc(chat.id)}/pin`, { method: 'POST' });
          state.chatMeta[chat.id] = { ...meta, pinned: true };
        }
        refreshChatItem(chat.id);
      } else if (action === 'archive') {
        if (meta.archived) {
          await api(`/chats/${enc(chat.id)}/unarchive`, { method: 'POST' });
          state.chatMeta[chat.id] = { ...meta, archived: false };
        } else {
          await api(`/chats/${enc(chat.id)}/archive`, { method: 'POST' });
          state.chatMeta[chat.id] = { ...meta, archived: true };
        }
        refreshChatItem(chat.id);
      } else if (action === 'mute') {
        if (meta.muted) {
          await api(`/chats/${enc(chat.id)}/unmute`, { method: 'POST' });
          state.chatMeta[chat.id] = { ...meta, muted: false };
          refreshChatItem(chat.id);
        } else {
          state._muteTarget = chat.id;
          els.muteModal.classList.remove('hidden');
        }
      } else if (action === 'clear') {
        if (!confirm('Clear all messages in this chat?')) return;
        await api(`/chats/${enc(chat.id)}/messages`, { method: 'DELETE' });
        state.messages[chat.id] = [];
        if (state.activeChatId === chat.id) els.messages.innerHTML = '';
      } else if (action === 'delete') {
        if (!confirm('Delete this chat? This cannot be undone.')) return;
        await api(`/chats/${enc(chat.id)}`, { method: 'DELETE' });
        state.chats = state.chats.filter(c => c.id !== chat.id);
        const el = els.chatList.querySelector(`[data-chat-id="${chat.id}"]`);
        if (el) el.remove();
        if (state.activeChatId === chat.id) {
          state.activeChatId = null;
          els.chatPlaceholder.style.display = '';
          els.chatHeader.classList.add('hidden');
          els.messages.classList.add('hidden');
          els.inputBar.classList.add('hidden');
        }
      }
    });
  });

  document.addEventListener('click', e => {
    if (!els.contextMenu.contains(e.target)) hideContextMenu();
  });

  // ── Reaction picker ──
  els.reactionPicker.addEventListener('click', async e => {
    const emoji = e.target.closest('[data-emoji]')?.dataset.emoji;
    if (!emoji || !state.reactionTarget) return;
    const { msgId, chatId } = state.reactionTarget;
    hideReactionPicker();
    await api('/send/reaction', { method: 'POST', body: JSON.stringify({ to: chatId, messageId: msgId, emoji }) });
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
  document.addEventListener('click', e => {
    if (!els.reactionPicker.contains(e.target)) hideReactionPicker();
  });

  // ── Call modal ──
  els.btnRejectCall.addEventListener('click', () => els.callModal.classList.add('hidden'));

  // ── Create group ──
  els.btnNewGroup.addEventListener('click', () => els.createGroupModal.classList.remove('hidden'));
  els.btnCancelCreateGroup.addEventListener('click', () => {
    els.createGroupModal.classList.add('hidden');
    els.newGroupName.value = ''; els.newGroupParticipants.value = '';
  });
  els.btnConfirmCreateGroup.addEventListener('click', async () => {
    const name = els.newGroupName.value.trim();
    if (!name) return;
    const participants = els.newGroupParticipants.value.split('\n').map(s => s.trim()).filter(Boolean);
    const result = await api('/groups', { method: 'POST', body: JSON.stringify({ name, participants }) });
    if (result?.data?.groupId) {
      els.createGroupModal.classList.add('hidden');
      els.newGroupName.value = ''; els.newGroupParticipants.value = '';
      await loadChats();
      openChat(result.data.groupId);
    }
  });

  // ── Accept invite ──
  els.btnAcceptInvite.addEventListener('click', () => els.acceptInviteModal.classList.remove('hidden'));
  els.btnCancelAcceptInvite.addEventListener('click', () => {
    els.acceptInviteModal.classList.add('hidden'); els.inviteCodeInput.value = '';
  });
  els.btnConfirmAcceptInvite.addEventListener('click', async () => {
    const inviteCode = els.inviteCodeInput.value.trim();
    if (!inviteCode) return;
    await api('/groups/invite/accept', { method: 'POST', body: JSON.stringify({ inviteCode }) });
    els.acceptInviteModal.classList.add('hidden'); els.inviteCodeInput.value = '';
    await loadChats();
  });

  // ── Left nav buttons ──
  document.querySelectorAll('.nav-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelName = btn.dataset.panel;
      if (panelName === 'chats') { closeAllLeftPanels(); return; }
      const panel = $(`${panelName}-panel`);
      const alreadyOpen = panel && !panel.classList.contains('hidden');
      closeAllLeftPanels();
      if (!alreadyOpen) openLeftPanel(panelName);
    });
  });

  // Left panel close buttons
  document.querySelectorAll('.lp-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelName = btn.dataset.panel;
      $(`${panelName}-panel`)?.classList.add('hidden');
      document.querySelector(`.nav-btn[data-panel="${panelName}"]`)?.classList.remove('active');
    });
  });

  // ── Business: create label ──
  els.btnCreateLabel?.addEventListener('click', async () => {
    const name = els.newLabelName.value.trim();
    if (!name) return;
    const color = els.newLabelColor.value;
    await api('/business/labels', { method: 'POST', body: JSON.stringify({ name, color }) });
    els.newLabelName.value = '';
    loadLabels();
  });

  // ── Business: save hours ──
  els.btnSaveHours?.addEventListener('click', saveBusinessHours);

  // ── Privacy: save ──
  els.btnSavePrivacy?.addEventListener('click', savePrivacy);

  // ── Instance panel ──
  els.btnRefreshStatus?.addEventListener('click', refreshInstanceStatus);
  els.btnFetchQr?.addEventListener('click', async () => {
    try {
      const result = await api('/instance/qr');
      const qrData = result?.data?.qr;
      if (qrData) {
        els.instanceQr.src = `data:image/png;base64,${qrData}`;
        els.instanceQr.classList.remove('hidden');
      } else {
        showToast('QR not available — instance may already be connected');
      }
    } catch { showToast('Error fetching QR'); }
  });
  els.btnRestartInstance?.addEventListener('click', async () => {
    if (!confirm('Restart the WhatsApp connection?')) return;
    await api('/instance/restart', { method: 'POST' });
    showToast('Restarting connection…');
    els.connStatus.className = 'conn-dot connecting';
  });
  els.btnLogoutInstance?.addEventListener('click', async () => {
    if (!confirm('Disconnect and log out? You will need to scan QR again.')) return;
    await api('/instance/logout', { method: 'POST' });
    showToast('Logged out');
    state.connected = false;
    els.connStatus.className = 'conn-dot disconnected';
  });

  // ── Group panel ──
  els.btnGroupInfo.addEventListener('click', () => openGroupPanel(state.activeChatId));
  els.btnCloseGroupPanel.addEventListener('click', () => els.groupPanel.classList.add('hidden'));
  els.btnCloseContactPanel?.addEventListener('click', () => els.contactPanel.classList.add('hidden'));

  els.btnEditName.addEventListener('click', () => {
    els.gpNameInput.value = els.gpName.textContent;
    els.gpNameEdit.classList.remove('hidden'); els.gpNameInput.focus();
  });
  els.btnCancelName.addEventListener('click', () => els.gpNameEdit.classList.add('hidden'));
  els.btnSaveName.addEventListener('click', async () => {
    const subject = els.gpNameInput.value.trim();
    if (!subject) return;
    await api(`/groups/${enc(state.activeChatId)}/subject`, { method: 'PATCH', body: JSON.stringify({ subject }) });
    els.gpName.textContent = subject;
    els.headerName.textContent = subject;
    const chat = state.chats.find(c => c.id === state.activeChatId);
    if (chat) { chat.name = subject; refreshChatItem(state.activeChatId); }
    els.gpNameEdit.classList.add('hidden');
  });

  els.btnEditDesc.addEventListener('click', () => {
    els.gpDescInput.value = els.gpDescription.textContent === 'No description' ? '' : els.gpDescription.textContent;
    els.gpDescEdit.classList.remove('hidden'); els.gpDescInput.focus();
  });
  els.btnCancelDesc.addEventListener('click', () => els.gpDescEdit.classList.add('hidden'));
  els.btnSaveDesc.addEventListener('click', async () => {
    const description = els.gpDescInput.value.trim();
    await api(`/groups/${enc(state.activeChatId)}/description`, { method: 'PATCH', body: JSON.stringify({ description }) });
    els.gpDescription.textContent = description || 'No description';
    els.gpDescription.classList.toggle('gp-muted', !description);
    els.gpDescEdit.classList.add('hidden');
  });

  els.gpRestrictToggle.addEventListener('change', async () => {
    const announce = els.gpRestrictToggle.checked ? 'true' : 'false';
    await api(`/groups/${enc(state.activeChatId)}/settings`, { method: 'PATCH', body: JSON.stringify({ announce }) });
  });

  els.btnLoadInvite.addEventListener('click', async () => {
    const result = await api(`/groups/${enc(state.activeChatId)}/invite`);
    const link = result?.data?.inviteUrl || result?.data?.link || '';
    els.gpInviteLink.textContent = link || 'Unavailable';
    els.btnLoadInvite.classList.add('hidden');
    if (link) {
      els.btnCopyInvite.classList.remove('hidden');
      els.btnRevokeInvite.classList.remove('hidden');
    }
  });
  els.btnCopyInvite.addEventListener('click', () => {
    navigator.clipboard.writeText(els.gpInviteLink.textContent);
    els.btnCopyInvite.textContent = 'Copied!';
    setTimeout(() => { els.btnCopyInvite.textContent = 'Copy'; }, 2000);
  });
  els.btnRevokeInvite.addEventListener('click', async () => {
    if (!confirm('Revoke the current invite link?')) return;
    await api(`/groups/${enc(state.activeChatId)}/invite`, { method: 'DELETE' });
    els.gpInviteLink.textContent = '—';
    els.btnCopyInvite.classList.add('hidden');
    els.btnRevokeInvite.classList.add('hidden');
    els.btnLoadInvite.classList.remove('hidden');
    els.btnLoadInvite.textContent = 'Get new link';
  });

  els.btnAddParticipant.addEventListener('click', async () => {
    const number = els.gpAddInput.value.trim();
    if (!number) return;
    await api(`/groups/${enc(state.activeChatId)}/participants`, {
      method: 'POST', body: JSON.stringify({ participants: [number] }),
    });
    els.gpAddInput.value = '';
    openGroupPanel(state.activeChatId);
  });

  els.btnLeaveGroup.addEventListener('click', async () => {
    if (!confirm('Leave this group?')) return;
    await api(`/groups/${enc(state.activeChatId)}/leave`, { method: 'POST' });
    els.groupPanel.classList.add('hidden');
    els.chatHeader.classList.add('hidden');
    els.messages.classList.add('hidden');
    els.inputBar.classList.add('hidden');
    els.chatPlaceholder.style.display = '';
    state.activeChatId = null;
    await loadChats();
  });
}

function handleSend() {
  if (state.pendingFile) sendFile();
  else sendText();
}

// ── Group helpers ─────────────────────────────────
function isGroup(chatId) { return String(chatId).endsWith('@g.us'); }

async function loadGroupInfo(chatId) {
  try {
    const result = await api(`/groups/${enc(chatId)}`);
    const group = result?.data;
    if (!group) return;
    const count = group.participants?.length || 0;
    els.headerParticipants.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
    state._groupInfo = group;
  } catch {}
}

async function openGroupPanel(chatId) {
  if (!chatId || !isGroup(chatId)) return;
  const result = await api(`/groups/${enc(chatId)}`);
  const group = result?.data;
  if (!group) return;
  state._groupInfo = group;

  els.gpName.textContent = group.subject || chatId;
  els.gpDescription.textContent = group.description || 'No description';
  els.gpDescription.classList.toggle('gp-muted', !group.description);
  els.gpRestrictToggle.checked = group.announce === true || group.announce === 'true';

  els.gpInviteLink.textContent = '—';
  els.btnLoadInvite.classList.remove('hidden');
  els.btnLoadInvite.textContent = 'Get link';
  els.btnCopyInvite.classList.add('hidden');
  els.btnRevokeInvite.classList.add('hidden');
  els.gpNameEdit.classList.add('hidden');
  els.gpDescEdit.classList.add('hidden');

  const { bg, fg } = avatarColors(group.subject || chatId);
  els.gpAvatar.style.background = bg; els.gpAvatar.style.color = fg;
  els.gpAvatar.textContent = (group.subject || chatId).charAt(0).toUpperCase();

  const participants = group.participants || [];
  els.gpParticipantsLabel.textContent = `Participants (${participants.length})`;
  renderParticipants(participants, chatId);

  await loadLabels();
  loadLabelsForGroup(chatId);

  els.groupPanel.classList.remove('hidden');
  els.contactPanel.classList.add('hidden');
}

function renderParticipants(participants, chatId) {
  els.gpParticipantsList.innerHTML = '';
  participants.forEach(p => {
    const jid  = typeof p === 'string' ? p : p.id;
    const role = p.role || p.admin || null;
    const name = jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    const hue  = nameToHue(name);
    const item = document.createElement('div');
    item.className = 'participant-item';
    item.innerHTML = `
      <div class="participant-avatar" style="--hue:${hue};background:hsl(${hue},40%,25%);color:hsl(${hue},70%,70%)">
        ${name.charAt(0).toUpperCase()}
      </div>
      <div class="participant-info">
        <div class="participant-name">${esc(name)}</div>
        <div class="participant-role ${role ? 'visible' : ''}">${role === 'superadmin' ? 'Super admin' : role === 'admin' ? 'Admin' : ''}</div>
      </div>
      <div class="participant-actions">
        ${role ? `<button data-action="demote" data-jid="${esc(jid)}">Remove admin</button>` : `<button data-action="promote" data-jid="${esc(jid)}">Make admin</button>`}
        <button data-action="remove" data-jid="${esc(jid)}" class="danger">Remove</button>
      </div>`;
    item.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => handleParticipantAction(btn.dataset.action, btn.dataset.jid, chatId));
    });
    els.gpParticipantsList.appendChild(item);
  });
}

async function handleParticipantAction(action, participantJid, chatId) {
  const participant = participantJid;
  if (action === 'remove') {
    if (!confirm(`Remove ${participant.replace('@s.whatsapp.net', '')} from the group?`)) return;
    await api(`/groups/${enc(chatId)}/participants`, { method: 'DELETE', body: JSON.stringify({ participants: [participant] }) });
  } else if (action === 'promote') {
    await api(`/groups/${enc(chatId)}/admins`, { method: 'POST', body: JSON.stringify({ participants: [participant] }) });
  } else if (action === 'demote') {
    await api(`/groups/${enc(chatId)}/admins`, { method: 'DELETE', body: JSON.stringify({ participants: [participant] }) });
  }
  openGroupPanel(chatId);
}

function groupActionText({ action, participants = [], subject }) {
  const names = participants.join(', ');
  switch (action) {
    case 'add':          return `${names} joined the group`;
    case 'remove':       return `${names} left the group`;
    case 'promote':      return `${names} is now an admin`;
    case 'demote':       return `${names} is no longer an admin`;
    case 'subject':      return `Group name changed to "${subject}"`;
    case 'description':  return 'Group description updated';
    case 'restrict':     return 'Only admins can send messages now';
    default:             return null;
  }
}

// ── Utilities ─────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function enc(str)    { return encodeURIComponent(str); }
function nowSec()    { return Math.floor(Date.now() / 1000); }
function nameToHue(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
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
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
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

function ticksHtml(status) { return rawTicksHtml(status); }
function rawTicksHtml(status) {
  if (status === 1)  return `<span class="ticks sent">✓</span>`;
  if (status === 2)  return `<span class="ticks sent">✓✓</span>`;
  if (status === 3)  return `<span class="ticks delivered">✓✓</span>`;
  if (status >= 4)   return `<span class="ticks read">✓✓</span>`;
  return '';
}

function scrollToBottom()    { els.messages.scrollTop = els.messages.scrollHeight; }
function scrollToMessage(id) { document.querySelector(`[data-msg-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function findMessage(chatId, msgId) { return (state.messages[chatId] || []).find(m => m.id === msgId); }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }

// ── Start ─────────────────────────────────────────
init();
