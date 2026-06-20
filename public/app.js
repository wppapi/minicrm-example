// ─────────────────────────────────────────────────────────
//  miniCRM — Entry point
//  Imports all modules, wires DOM events, bootstraps the app.
// ─────────────────────────────────────────────────────────

import { state }            from './js/state.js';
import { autoResize, isGroup, showToast } from './js/utils.js';
import { renderChatList }   from './js/ui/ChatListView.js';

import * as Chat            from './js/controllers/ChatController.js';
import * as Send            from './js/controllers/SendController.js';
import * as Groups          from './js/controllers/GroupController.js';
import * as Contacts        from './js/controllers/ContactController.js';
import * as Business        from './js/controllers/BusinessController.js';
import * as Privacy         from './js/controllers/PrivacyController.js';
import * as Instance        from './js/controllers/InstanceController.js';

import { setupSocketHandlers } from './js/socket/SocketHandler.js';

// ── Message bubble callbacks (passed down to view) ────────
const messageCallbacks = {
  onReply:  msg => Send.setReply(msg),
  onReact:  (msgId, chatId, anchor) => showReactionPicker(msgId, chatId, anchor),
  onRevoke: (e, msg, chatId) => Send.revokeMessage(e, msg, chatId),
};

// ── Init ──────────────────────────────────────────────────
function init() {
  // Give ChatController its callbacks before first load
  Chat.init({
    onChatContext: showContextMenu,
    messageCallbacks,
  });

  setupSocketHandlers(messageCallbacks);
  bindEvents();
  Chat.loadChats();
}

// ── DOM event bindings ────────────────────────────────────
function bindEvents() {
  const $ = id => document.getElementById(id);

  // Message input
  const input = $('message-input');
  input.addEventListener('input', () => autoResize(input));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });
  $('btn-send').addEventListener('click', handleSend);
  $('btn-audio').addEventListener('click', () => Send.toggleRecording(messageCallbacks));

  // Reply / edit / file strip
  $('reply-cancel').addEventListener('click', Send.clearReply);
  $('file-cancel').addEventListener('click', Send.clearFile);
  $('file-input').addEventListener('change', e => Send.handleFileSelected(e.target.files[0]));

  // Header info click → open contact / group panel
  $('header-info-click').addEventListener('click', () => {
    if (!state.activeChatId) return;
    if (isGroup(state.activeChatId)) Groups.openGroupPanel(state.activeChatId);
    else Contacts.openContactPanel(state.activeChatId);
  });

  // ── Attach menu ──────────────────────────────────────
  const attachMenu = $('attach-menu');
  $('btn-attach').addEventListener('click', e => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    attachMenu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    attachMenu.style.left   = `${rect.left}px`;
    attachMenu.classList.toggle('hidden');
  });
  attachMenu.querySelectorAll('.attach-item').forEach(btn => {
    btn.addEventListener('click', () => {
      attachMenu.classList.add('hidden');
      const actions = {
        file:     () => $('file-input').click(),
        poll:     openPollModal,
        buttons:  openButtonsModal,
        list:     openListModal,
        location: openLocationModal,
        contact:  openContactCardModal,
      };
      actions[btn.dataset.type]?.();
    });
  });
  document.addEventListener('click', e => {
    if (!attachMenu.contains(e.target) && e.target !== $('btn-attach'))
      attachMenu.classList.add('hidden');
  });

  // ── Poll modal ───────────────────────────────────────
  $('btn-add-poll-option').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'field-input';
    input.placeholder = `Option ${$('poll-options-list').children.length + 1}`;
    $('poll-options-list').appendChild(input);
  });
  $('btn-cancel-poll').addEventListener('click',  () => $('poll-modal').classList.add('hidden'));
  $('btn-confirm-poll').addEventListener('click', () => Send.sendPoll(messageCallbacks));

  // ── Buttons modal ────────────────────────────────────
  $('btn-add-button').addEventListener('click', () => {
    if ($('buttons-list').children.length >= 3) return;
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'field-input';
    input.placeholder = `Button ${$('buttons-list').children.length + 1} label`;
    $('buttons-list').appendChild(input);
  });
  $('btn-cancel-buttons').addEventListener('click',  () => $('buttons-modal').classList.add('hidden'));
  $('btn-confirm-buttons').addEventListener('click', () => Send.sendButtons(messageCallbacks));

  // ── List modal ───────────────────────────────────────
  $('btn-add-section').addEventListener('click', addListSection);
  $('btn-cancel-list').addEventListener('click',  () => $('list-modal').classList.add('hidden'));
  $('btn-confirm-list').addEventListener('click', () => Send.sendList(messageCallbacks));

  // ── Location modal ───────────────────────────────────
  $('btn-use-location').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(
      pos => { $('loc-lat').value = pos.coords.latitude; $('loc-lng').value = pos.coords.longitude; },
      ()  => showToast('Could not get location')
    );
  });
  $('btn-cancel-location').addEventListener('click',  () => $('location-modal').classList.add('hidden'));
  $('btn-confirm-location').addEventListener('click', () => Send.sendLocation(messageCallbacks));

  // ── Contact card modal ───────────────────────────────
  $('btn-cancel-contact').addEventListener('click',  () => $('contact-modal').classList.add('hidden'));
  $('btn-confirm-contact').addEventListener('click', () => Send.sendContactCard(messageCallbacks));

  // ── Check number modal ───────────────────────────────
  $('btn-open-check-number').addEventListener('click', () => {
    $('check-number-input').value = '';
    $('check-number-result').classList.add('hidden');
    $('check-number-modal').classList.remove('hidden');
  });
  $('btn-cancel-check-number').addEventListener('click', () => $('check-number-modal').classList.add('hidden'));
  $('btn-confirm-check-number').addEventListener('click', Contacts.checkNumber);

  // ── Call modal ───────────────────────────────────────
  $('btn-reject-call').addEventListener('click', () => $('call-modal').classList.add('hidden'));

  // ── Create group modal ───────────────────────────────
  $('btn-new-group').addEventListener('click', () => $('create-group-modal').classList.remove('hidden'));
  $('btn-cancel-create-group').addEventListener('click', () => {
    $('create-group-modal').classList.add('hidden');
    $('new-group-name').value = ''; $('new-group-participants').value = '';
  });
  $('btn-confirm-create-group').addEventListener('click', async () => {
    const { GroupService } = await import('./js/services/GroupService.js');
    const name = $('new-group-name').value.trim();
    if (!name) return;
    const participants = $('new-group-participants').value.split('\n').map(s => s.trim()).filter(Boolean);
    try {
      const res = await GroupService.create(name, participants);
      $('create-group-modal').classList.add('hidden');
      $('new-group-name').value = ''; $('new-group-participants').value = '';
      await Chat.loadChats();
      if (res?.data?.groupId) Chat.openChat(res.data.groupId);
    } catch (e) { showToast(e.message); }
  });

  // ── Accept invite modal ──────────────────────────────
  $('btn-accept-invite').addEventListener('click', () => $('accept-invite-modal').classList.remove('hidden'));
  $('btn-cancel-accept-invite').addEventListener('click', () => {
    $('accept-invite-modal').classList.add('hidden'); $('invite-code-input').value = '';
  });
  $('btn-confirm-accept-invite').addEventListener('click', async () => {
    const { GroupService } = await import('./js/services/GroupService.js');
    const inviteCode = $('invite-code-input').value.trim();
    if (!inviteCode) return;
    try {
      await GroupService.acceptInvite(inviteCode);
      $('accept-invite-modal').classList.add('hidden'); $('invite-code-input').value = '';
      await Chat.loadChats();
    } catch (e) { showToast(e.message); }
  });

  // ── Mute modal ───────────────────────────────────────
  document.querySelectorAll('.mute-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      $('mute-modal').classList.add('hidden');
      const chatId = state._muteTarget;
      if (!chatId) return;
      const { ChatService } = await import('./js/services/ChatService.js');
      await ChatService.mute(chatId, parseInt(btn.dataset.seconds));
      state.chatMeta[chatId] = { ...state.chatMeta[chatId], muted: true };
      const { refreshChatItem } = await import('./js/ui/ChatListView.js');
      refreshChatItem(chatId, $('chat-list'), { onOpen: Chat.openChat, onContext: showContextMenu });
    });
  });
  $('btn-cancel-mute').addEventListener('click', () => $('mute-modal').classList.add('hidden'));

  // ── Chat list right-click context menu ───────────────
  $('context-menu').querySelectorAll('.ctx-item').forEach(btn => {
    btn.addEventListener('click', () => handleContextAction(btn.dataset.action));
  });
  document.addEventListener('click', e => {
    if (!$('context-menu').contains(e.target)) hideContextMenu();
  });

  // ── Reaction picker ──────────────────────────────────
  $('reaction-picker').addEventListener('click', async e => {
    const emoji = e.target.closest('[data-emoji]')?.dataset.emoji;
    if (!emoji || !state.reactionTarget) return;
    const { msgId, chatId } = state.reactionTarget;
    hideReactionPicker();
    await Send.sendReaction(chatId, msgId, emoji);
  });
  document.addEventListener('click', e => {
    if (!$('reaction-picker').contains(e.target)) hideReactionPicker();
  });

  // ── Search ───────────────────────────────────────────
  $('search-input').addEventListener('input', async e => {
    const q = e.target.value.toLowerCase();
    const filtered = q ? state.chats.filter(c => (c.name || c.id).toLowerCase().includes(q)) : state.chats;
    const chatList = $('chat-list');
    chatList.innerHTML = '';
    const { buildChatItem } = await import('./js/ui/ChatListView.js');
    filtered.forEach(chat => {
      chatList.appendChild(buildChatItem(chat, { onOpen: Chat.openChat, onContext: showContextMenu }));
    });
  });

  // ── Filter chips ─────────────────────────────────────
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter;
      document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderChatList($('chat-list'), { onOpen: Chat.openChat, onContext: showContextMenu });
    });
  });

  // ── Left nav panel switching ─────────────────────────
  document.querySelectorAll('.nav-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.panel;
      if (name === 'chats') { closeAllLeftPanels(); return; }
      const panel      = $(`${name}-panel`);
      const alreadyOpen = panel && !panel.classList.contains('hidden');
      closeAllLeftPanels();
      if (!alreadyOpen) {
        panel.classList.remove('hidden');
        btn.classList.add('active');
        if (name === 'business') Business.loadPanel().catch(() => {});
        if (name === 'privacy')  Privacy.loadPanel().catch(() => {});
        if (name === 'instance') Instance.refreshStatus().catch(() => {});
      }
    });
  });
  document.querySelectorAll('.lp-close').forEach(btn => {
    btn.addEventListener('click', () => {
      $(`${btn.dataset.panel}-panel`)?.classList.add('hidden');
      document.querySelector(`.nav-btn[data-panel="${btn.dataset.panel}"]`)?.classList.remove('active');
    });
  });

  // Business panel
  $('btn-create-label').addEventListener('click', Business.createLabel);
  $('btn-save-hours').addEventListener('click', Business.saveHours);

  // Privacy panel
  $('btn-save-privacy').addEventListener('click', Privacy.save);

  // Instance panel
  $('btn-refresh-status').addEventListener('click', Instance.refreshStatus);
  $('btn-fetch-qr').addEventListener('click', Instance.fetchQr);
  $('btn-restart-instance').addEventListener('click', Instance.restart);
  $('btn-logout-instance').addEventListener('click', Instance.logout);

  // Group + contact panels
  Groups.bindGroupPanelEvents();
  Contacts.bindContactPanelEvents();
}

// ── Context menu helpers ──────────────────────────────────
function showContextMenu(e, chat) {
  state.contextTarget = chat;
  const meta = state.chatMeta[chat.id] || {};
  document.getElementById('ctx-pin-label').textContent     = meta.pinned   ? 'Unpin'     : 'Pin';
  document.getElementById('ctx-archive-label').textContent = meta.archived ? 'Unarchive' : 'Archive';
  document.getElementById('ctx-mute-label').textContent    = meta.muted    ? 'Unmute'    : 'Mute';
  const menu = document.getElementById('context-menu');
  menu.style.top  = `${Math.min(e.clientY, window.innerHeight - 220)}px`;
  menu.style.left = `${Math.min(e.clientX, window.innerWidth - 180)}px`;
  menu.classList.remove('hidden');
}

function hideContextMenu() {
  document.getElementById('context-menu').classList.add('hidden');
  state.contextTarget = null;
}

async function handleContextAction(action) {
  const chat = state.contextTarget;
  if (!chat) return;
  hideContextMenu();

  const { ChatService } = await import('./js/services/ChatService.js');
  const { refreshChatItem } = await import('./js/ui/ChatListView.js');
  const meta = state.chatMeta[chat.id] || {};
  const refresh = () => refreshChatItem(chat.id, document.getElementById('chat-list'), { onOpen: Chat.openChat, onContext: showContextMenu });

  switch (action) {
    case 'pin':
      await (meta.pinned ? ChatService.unpin(chat.id) : ChatService.pin(chat.id));
      state.chatMeta[chat.id] = { ...meta, pinned: !meta.pinned };
      refresh(); break;
    case 'archive':
      await (meta.archived ? ChatService.unarchive(chat.id) : ChatService.archive(chat.id));
      state.chatMeta[chat.id] = { ...meta, archived: !meta.archived };
      refresh(); break;
    case 'mute':
      if (meta.muted) {
        await ChatService.unmute(chat.id);
        state.chatMeta[chat.id] = { ...meta, muted: false };
        refresh();
      } else {
        state._muteTarget = chat.id;
        document.getElementById('mute-modal').classList.remove('hidden');
      }
      break;
    case 'clear':
      if (!confirm('Clear all messages?')) return;
      await ChatService.clearMessages(chat.id);
      state.messages[chat.id] = [];
      if (state.activeChatId === chat.id) document.getElementById('messages').innerHTML = '';
      break;
    case 'delete':
      if (!confirm('Delete this chat? This cannot be undone.')) return;
      await ChatService.delete(chat.id);
      state.chats = state.chats.filter(c => c.id !== chat.id);
      document.querySelector(`[data-chat-id="${chat.id}"]`)?.remove();
      if (state.activeChatId === chat.id) {
        state.activeChatId = null;
        document.getElementById('chat-placeholder').style.display = '';
        document.getElementById('chat-header').classList.add('hidden');
        document.getElementById('messages').classList.add('hidden');
        document.getElementById('input-bar').classList.add('hidden');
      }
      break;
  }
}

// ── Reaction picker helpers ───────────────────────────────
function showReactionPicker(msgId, chatId, anchor) {
  state.reactionTarget = { msgId, chatId };
  const rect = anchor.getBoundingClientRect();
  const picker = document.getElementById('reaction-picker');
  picker.style.top  = `${rect.top - 56}px`;
  picker.style.left = `${rect.left - 60}px`;
  picker.classList.remove('hidden');
}

function hideReactionPicker() {
  document.getElementById('reaction-picker').classList.add('hidden');
  state.reactionTarget = null;
}

// ── Left panel helpers ────────────────────────────────────
function closeAllLeftPanels() {
  ['business', 'privacy', 'instance'].forEach(p => {
    document.getElementById(`${p}-panel`)?.classList.add('hidden');
    document.querySelector(`.nav-btn[data-panel="${p}"]`)?.classList.remove('active');
  });
}

// ── Send dispatcher ───────────────────────────────────────
function handleSend() {
  if (state.pendingFile) Send.sendFile(messageCallbacks);
  else                   Send.sendText(messageCallbacks);
}

// ── Modal openers ─────────────────────────────────────────
function openPollModal() {
  const $ = id => document.getElementById(id);
  $('poll-question').value = '';
  $('poll-options-list').innerHTML = '';
  $('poll-single-choice').checked = false;
  // add 2 default options
  for (let i = 0; i < 2; i++) {
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'field-input';
    inp.placeholder = `Option ${i + 1}`;
    $('poll-options-list').appendChild(inp);
  }
  $('poll-modal').classList.remove('hidden');
}

function openButtonsModal() {
  const $ = id => document.getElementById(id);
  $('buttons-text').value = ''; $('buttons-footer').value = '';
  $('buttons-list').innerHTML = '';
  for (let i = 0; i < 2; i++) {
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'field-input';
    inp.placeholder = `Button ${i + 1} label`;
    $('buttons-list').appendChild(inp);
  }
  $('buttons-modal').classList.remove('hidden');
}

function openListModal() {
  const $ = id => document.getElementById(id);
  $('list-title').value = ''; $('list-text').value = '';
  $('list-button-text').value = 'See options';
  $('list-sections').innerHTML = '';
  addListSection();
  $('list-modal').classList.remove('hidden');
}

function addListSection() {
  const idx  = document.getElementById('list-sections').children.length;
  const wrap = document.createElement('div');
  wrap.className = 'list-section-block';
  wrap.innerHTML = `
    <input class="field-input section-title-input" type="text" placeholder="Section ${idx + 1} title" />
    <div class="section-rows"></div>
    <button type="button" class="btn-secondary btn-sm" style="align-self:flex-start;margin-top:4px">+ Add row</button>`;
  wrap.querySelector('button').addEventListener('click', () => {
    const row = document.createElement('input');
    row.type = 'text'; row.className = 'field-input';
    row.placeholder = 'Row title'; row.style.marginTop = '4px';
    wrap.querySelector('.section-rows').appendChild(row);
  });
  for (let i = 0; i < 2; i++) {
    const row = document.createElement('input');
    row.type = 'text'; row.className = 'field-input';
    row.placeholder = `Row ${i + 1}`; row.style.marginTop = '4px';
    wrap.querySelector('.section-rows').appendChild(row);
  }
  document.getElementById('list-sections').appendChild(wrap);
}

function openLocationModal() {
  ['loc-lat','loc-lng','loc-name','loc-address'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('location-modal').classList.remove('hidden');
}

function openContactCardModal() {
  document.getElementById('contact-name').value = '';
  document.getElementById('contact-phone').value = '';
  document.getElementById('contact-modal').classList.remove('hidden');
}

// ── Boot ──────────────────────────────────────────────────
init();
