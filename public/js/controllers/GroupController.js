import { state }         from '../state.js';
import { GroupService }  from '../services/GroupService.js';
import { BusinessService } from '../services/BusinessService.js';
import { avatarColors, nameToHue, esc, enc, isGroup, showToast, loadAvatar } from '../utils.js';
import { openChat, loadChats }  from './ChatController.js';

export function groupActionText({ action, participants = [], subject }) {
  const names = (participants || []).join(', ');
  const map   = {
    add:         `${names} joined the group`,
    remove:      `${names} left the group`,
    promote:     `${names} is now an admin`,
    demote:      `${names} is no longer an admin`,
    subject:     `Group name changed to "${subject}"`,
    description: 'Group description updated',
    restrict:    'Only admins can send messages now',
  };
  return map[action] || null;
}

export async function openGroupPanel(chatId) {
  if (!chatId || !isGroup(chatId)) return;

  let group;
  try {
    group = await GroupService.get(chatId);
  } catch { return; }
  if (!group) return;
  state._groupInfo = group;

  const { bg, fg } = avatarColors(group.subject || chatId);
  const gpAvatar = document.getElementById('gp-avatar');
  gpAvatar.style.background = bg; gpAvatar.style.color = fg;
  gpAvatar.textContent = (group.subject || chatId).charAt(0).toUpperCase();

  document.getElementById('gp-name').textContent = group.subject || chatId;
  const descEl = document.getElementById('gp-description');
  descEl.textContent = group.description || 'No description';
  descEl.classList.toggle('gp-muted', !group.description);
  document.getElementById('gp-restrict-toggle').checked = group.announce;

  // reset invite section
  document.getElementById('gp-invite-link').textContent = '—';
  document.getElementById('btn-load-invite').classList.remove('hidden');
  document.getElementById('btn-load-invite').textContent = 'Get link';
  document.getElementById('btn-copy-invite').classList.add('hidden');
  document.getElementById('btn-revoke-invite').classList.add('hidden');
  document.getElementById('gp-name-edit').classList.add('hidden');
  document.getElementById('gp-desc-edit').classList.add('hidden');

  // participants
  const labelEl = document.getElementById('gp-participants-label');
  labelEl.textContent = `Participants (${group.participants.length})`;
  renderParticipants(group.participants, chatId);

  // labels
  await _renderGroupLabels(chatId);

  document.getElementById('group-panel').classList.remove('hidden');
  document.getElementById('contact-panel').classList.add('hidden');
}

function renderParticipants(participants, chatId) {
  const list = document.getElementById('gp-participants-list');
  list.innerHTML = '';
  participants.forEach(p => {
    const jid  = p.id;
    const name = p.phone || jid.replace('@s.whatsapp.net', '').replace('@lid', '').replace('@g.us', '');
    const hue  = nameToHue(name);
    const item = document.createElement('div');
    item.className = 'participant-item';
    item.innerHTML = `
      <div class="participant-avatar" style="background:hsl(${hue},40%,25%);color:hsl(${hue},70%,70%)">
        ${name.charAt(0).toUpperCase()}
      </div>
      <div class="participant-info">
        <div class="participant-name">${esc(name)}</div>
        <div class="participant-role ${p.role ? 'visible' : ''}">${p.role === 'superadmin' ? 'Super admin' : p.role === 'admin' ? 'Admin' : ''}</div>
      </div>
      <div class="participant-actions">
        ${p.role
          ? `<button data-action="demote" data-jid="${esc(jid)}">Remove admin</button>`
          : `<button data-action="promote" data-jid="${esc(jid)}">Make admin</button>`}
        <button data-action="remove" data-jid="${esc(jid)}" class="danger">Remove</button>
      </div>`;
    item.querySelectorAll('[data-action]').forEach(btn =>
      btn.addEventListener('click', () => _handleParticipantAction(btn.dataset.action, btn.dataset.jid, chatId))
    );
    list.appendChild(item);
  });
}

async function _handleParticipantAction(action, jid, chatId) {
  try {
    if (action === 'remove') {
      if (!confirm(`Remove ${jid.replace('@s.whatsapp.net', '')}?`)) return;
      await GroupService.removeParticipants(chatId, [jid]);
    } else if (action === 'promote') {
      await GroupService.promoteAdmins(chatId, [jid]);
    } else if (action === 'demote') {
      await GroupService.demoteAdmins(chatId, [jid]);
    }
    openGroupPanel(chatId);
  } catch (e) {
    showToast(e.message);
  }
}

async function _renderGroupLabels(chatId) {
  const el = document.getElementById('gp-labels');
  if (!el) return;
  el.innerHTML = '';
  try {
    const labels = await BusinessService.getLabels();
    labels.forEach(label => {
      const chip = document.createElement('div');
      chip.className = 'label-chip';
      chip.style.background = label.color;
      chip.textContent = label.name;
      chip.title = 'Click to assign this label';
      chip.addEventListener('click', async () => {
        await BusinessService.assignLabel(label.id, [chatId]);
        showToast(`Label "${label.name}" assigned`);
      });
      el.appendChild(chip);
    });
  } catch {}
}

// ── Panel event bindings (called once from app.js) ────────

export function bindGroupPanelEvents() {
  document.getElementById('btn-group-info')
    .addEventListener('click', () => openGroupPanel(state.activeChatId));

  document.getElementById('btn-close-group-panel')
    .addEventListener('click', () => document.getElementById('group-panel').classList.add('hidden'));

  // edit photo
  document.getElementById('btn-edit-photo').addEventListener('click', () => {
    document.getElementById('gp-photo-edit').classList.remove('hidden');
    document.getElementById('gp-photo-url').focus();
  });
  document.getElementById('btn-cancel-photo').addEventListener('click', () =>
    document.getElementById('gp-photo-edit').classList.add('hidden')
  );
  document.getElementById('btn-save-photo').addEventListener('click', async () => {
    const url = document.getElementById('gp-photo-url').value.trim();
    if (!url) return;
    try {
      await GroupService.updatePhoto(state.activeChatId, url);
      document.getElementById('gp-photo-edit').classList.add('hidden');
      document.getElementById('gp-photo-url').value = '';
      showToast('Photo updated');
    } catch (e) { showToast(e.message); }
  });

  // edit name
  document.getElementById('btn-edit-name').addEventListener('click', () => {
    document.getElementById('gp-name-input').value = document.getElementById('gp-name').textContent;
    document.getElementById('gp-name-edit').classList.remove('hidden');
    document.getElementById('gp-name-input').focus();
  });
  document.getElementById('btn-cancel-name').addEventListener('click', () =>
    document.getElementById('gp-name-edit').classList.add('hidden')
  );
  document.getElementById('btn-save-name').addEventListener('click', async () => {
    const subject = document.getElementById('gp-name-input').value.trim();
    if (!subject) return;
    try {
      await GroupService.updateSubject(state.activeChatId, subject);
      document.getElementById('gp-name').textContent = subject;
      document.getElementById('header-name').textContent = subject;
      const chat = state.chats.find(c => c.id === state.activeChatId);
      if (chat) {
        chat.name = subject;
        const { refreshChatItem } = await import('../ui/ChatListView.js');
        refreshChatItem(state.activeChatId, document.getElementById('chat-list'), { onOpen: openChat });
      }
      document.getElementById('gp-name-edit').classList.add('hidden');
      showToast('Group name updated');
    } catch (e) { showToast(`Error: ${e.message}`); }
  });

  // edit description
  document.getElementById('btn-edit-desc').addEventListener('click', () => {
    const desc = document.getElementById('gp-description');
    document.getElementById('gp-desc-input').value = desc.textContent === 'No description' ? '' : desc.textContent;
    document.getElementById('gp-desc-edit').classList.remove('hidden');
    document.getElementById('gp-desc-input').focus();
  });
  document.getElementById('btn-cancel-desc').addEventListener('click', () =>
    document.getElementById('gp-desc-edit').classList.add('hidden')
  );
  document.getElementById('btn-save-desc').addEventListener('click', async () => {
    const description = document.getElementById('gp-desc-input').value.trim();
    try {
      await GroupService.updateDescription(state.activeChatId, description);
      const descEl = document.getElementById('gp-description');
      descEl.textContent = description || 'No description';
      descEl.classList.toggle('gp-muted', !description);
      document.getElementById('gp-desc-edit').classList.add('hidden');
      showToast('Description updated');
    } catch (e) { showToast(`Error: ${e.message}`); }
  });

  // restrict toggle
  document.getElementById('gp-restrict-toggle').addEventListener('change', async e => {
    await GroupService.updateSettings(state.activeChatId, { announce: e.target.checked ? 'true' : 'false' });
  });

  // invite link
  document.getElementById('btn-load-invite').addEventListener('click', async () => {
    const link = await GroupService.getInviteLink(state.activeChatId);
    document.getElementById('gp-invite-link').textContent = link || 'Unavailable';
    document.getElementById('btn-load-invite').classList.add('hidden');
    if (link) {
      document.getElementById('btn-copy-invite').classList.remove('hidden');
      document.getElementById('btn-revoke-invite').classList.remove('hidden');
    }
  });
  document.getElementById('btn-copy-invite').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('gp-invite-link').textContent);
    const btn = document.getElementById('btn-copy-invite');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
  });
  document.getElementById('btn-revoke-invite').addEventListener('click', async () => {
    if (!confirm('Revoke the current invite link?')) return;
    await GroupService.revokeInviteLink(state.activeChatId);
    document.getElementById('gp-invite-link').textContent = '—';
    document.getElementById('btn-copy-invite').classList.add('hidden');
    document.getElementById('btn-revoke-invite').classList.add('hidden');
    document.getElementById('btn-load-invite').classList.remove('hidden');
    document.getElementById('btn-load-invite').textContent = 'Get new link';
  });

  // add participant
  document.getElementById('btn-add-participant').addEventListener('click', async () => {
    const number = document.getElementById('gp-add-input').value.trim();
    if (!number) return;
    await GroupService.addParticipants(state.activeChatId, [number]);
    document.getElementById('gp-add-input').value = '';
    openGroupPanel(state.activeChatId);
  });

  // leave group
  document.getElementById('btn-leave-group').addEventListener('click', async () => {
    if (!confirm('Leave this group?')) return;
    await GroupService.leave(state.activeChatId);
    document.getElementById('group-panel').classList.add('hidden');
    document.getElementById('chat-header').classList.add('hidden');
    document.getElementById('messages').classList.add('hidden');
    document.getElementById('input-bar').classList.add('hidden');
    document.getElementById('chat-placeholder').style.display = '';
    state.activeChatId = null;
    await loadChats();
  });
}
