import { state }                                              from '../state.js';
import { esc, enc, formatTime, rawTicksHtml, nameToHue,
         daySeparator, dayLabel, ICONS, isGroup }            from '../utils.js';

// ── Public render functions ───────────────────────────────

export function renderMessages(chatId, container, callbacks = {}) {
  container.innerHTML = '';
  const msgs = state.messages[chatId] || [];
  let lastDay = null;
  msgs.forEach(msg => {
    const day = dayLabel(msg.timestamp);
    if (day !== lastDay) { container.appendChild(daySeparator(day)); lastDay = day; }
    container.appendChild(buildGroup(msg, chatId, callbacks));
  });
}

export function appendMessage(chatId, msg, container, callbacks = {}) {
  if (!state.messages[chatId]) state.messages[chatId] = [];
  state.messages[chatId].push(msg);
  if (state.activeChatId === chatId) {
    container.appendChild(buildGroup(msg, chatId, callbacks));
    container.scrollTop = container.scrollHeight;
  }
}

// ── Group (message + actions toolbar + reactions row) ────

export function buildGroup(msg, chatId, { onReply, onReact, onRevoke } = {}) {
  const group = document.createElement('div');
  group.className = `message-group ${msg.fromMe ? 'out' : 'in'}`;
  group.dataset.msgId = msg.id;

  const bubble = buildBubble(msg, chatId);
  group.appendChild(bubble);

  // action toolbar — visible on hover via CSS
  if (!msg.deleted) {
    const toolbar = document.createElement('div');
    toolbar.className = 'msg-actions';

    const btnReply = document.createElement('button');
    btnReply.className = 'msg-action-btn';
    btnReply.title = 'Reply';
    btnReply.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`;
    btnReply.addEventListener('click', e => { e.stopPropagation(); onReply?.(msg); });
    toolbar.appendChild(btnReply);

    const btnReact = document.createElement('button');
    btnReact.className = 'msg-action-btn';
    btnReact.title = 'React';
    btnReact.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
    btnReact.addEventListener('click', e => { e.stopPropagation(); onReact?.(msg.id, chatId, btnReact); });
    toolbar.appendChild(btnReact);

    if (msg.fromMe) {
      const btnDel = document.createElement('button');
      btnDel.className = 'msg-action-btn danger';
      btnDel.title = 'Delete for everyone';
      btnDel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
      btnDel.addEventListener('click', e => { e.stopPropagation(); onRevoke?.(e, msg, chatId); });
      toolbar.appendChild(btnDel);
    }

    group.appendChild(toolbar);
  }

  const reactionsEl = buildReactionsEl(chatId, msg.id);
  if (reactionsEl) group.appendChild(reactionsEl);

  return group;
}

// ── Bubble ────────────────────────────────────────────────

export function buildBubble(msg, chatId) {
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
      <div class="quoted-author">${q?.fromMe ? 'You' : esc(msg.senderName || '')}</div>
      <div>${esc(q?.text || q?.type || '…')}</div>
    </div>`;
  }

  if (msg.deleted) {
    inner += `<span class="deleted-msg">${ICONS.slash} This message was deleted</span>`;
  } else {
    inner += renderContent(msg, chatId);
  }

  if (msg.edited) inner += `<span class="edited-label">edited</span>`;
  inner += `<span class="meta">${formatTime(msg.timestamp)}${msg.fromMe ? rawTicksHtml(msg.status) : ''}</span>`;

  bubble.innerHTML = inner;
  bubble.querySelector('.quoted')?.addEventListener('click', e => {
    e.stopPropagation();
    document.querySelector(`[data-msg-id="${e.currentTarget.dataset.target}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  return bubble;
}

// ── Content renderers ─────────────────────────────────────

export function renderContent(msg, chatId) {
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
      return renderVCard(msg);
    default:
      return `<em style="opacity:.6">[${esc(msg.type || 'unknown')}]</em>`;
  }
}

export function renderPoll(msg) {
  const options = msg.pollOptions || [];
  const total   = options.reduce((s, o) => s + (o.votes || 0), 0);
  const rows    = options.map(o => {
    const pct = total ? Math.round((o.votes || 0) / total * 100) : 0;
    return `<div class="poll-option">
      <div class="poll-bar" style="width:${pct}%"></div>
      <div class="poll-label"><span>${esc(o.name)}</span><span class="poll-pct">${pct}%</span></div>
    </div>`;
  }).join('');
  return `<div class="poll-question">${ICONS.barChart} ${esc(msg.pollQuestion || 'Poll')}</div>${rows}`;
}

function renderButtons(msg) {
  const btns = (msg.buttons || []).map(b =>
    `<div class="msg-button">${esc(b.text || b.displayText || b)}</div>`
  ).join('');
  return `<div>${esc(msg.text || '')}</div>${btns}${msg.footer ? `<div class="msg-footer">${esc(msg.footer)}</div>` : ''}`;
}

function renderList(msg) {
  const sections = (msg.sections || []).map(s => {
    const rows = (s.rows || []).map(r => `<div class="list-row">${esc(r.title || r)}</div>`).join('');
    return `<div class="list-section-title">${esc(s.title || '')}</div>${rows}`;
  }).join('');
  return `<div>${esc(msg.title || msg.text || '')}</div>
          <div class="list-button">${esc(msg.buttonText || 'See options')}</div>
          <div class="list-sections">${sections}</div>`;
}

function renderLocation(msg) {
  const label = msg.name || `${msg.lat}, ${msg.lng}`;
  const url   = `https://www.google.com/maps?q=${msg.lat},${msg.lng}`;
  return `<a href="${url}" target="_blank" rel="noopener" class="location-link">
    ${ICONS.mapPin} ${esc(label)}${msg.address ? `<br><small>${esc(msg.address)}</small>` : ''}
  </a>`;
}

function renderVCard(msg) {
  return `<div class="vcard-preview">
    <div class="vcard-icon">${ICONS.phone}</div>
    <div><strong>${esc(msg.vcardName || 'Contact')}</strong><br><small>${esc(msg.vcardPhone || '')}</small></div>
  </div>`;
}

// ── Reactions ─────────────────────────────────────────────

export function buildReactionsEl(chatId, msgId) {
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

export function updateReactionsInDom(chatId, msgId) {
  const group = document.querySelector(`.message-group[data-msg-id="${msgId}"]`);
  if (!group) return;
  const existing = group.querySelector('.reactions');
  const fresh    = buildReactionsEl(chatId, msgId);
  if (existing && fresh) group.replaceChild(fresh, existing);
  else if (fresh) group.appendChild(fresh);
  else if (existing) group.removeChild(existing);
}

export function updateTicksInDom(msgId, status) {
  const bubble = document.querySelector(`.bubble[data-msg-id="${msgId}"]`);
  if (!bubble) return;
  const tickEl = bubble.querySelector('.ticks');
  const html   = rawTicksHtml(status);
  if (tickEl) tickEl.outerHTML = html;
}

export function markBubbleDeleted(msgId, timestamp) {
  const bubble = document.querySelector(`.bubble[data-msg-id="${msgId}"]`);
  if (!bubble) return;
  bubble.classList.add('deleted');
  bubble.innerHTML = `<span class="deleted-msg">${ICONS.slash} This message was deleted</span>
    <span class="meta">${formatTime(timestamp)}</span>`;
}

export function markBubbleEdited(msgId, newText) {
  const bubble = document.querySelector(`.bubble[data-msg-id="${msgId}"]`);
  if (!bubble || bubble.classList.contains('deleted')) return;
  const textNode = bubble.childNodes[0];
  if (textNode?.nodeType === Node.TEXT_NODE) textNode.textContent = newText;
  if (!bubble.querySelector('.edited-label')) {
    const label = document.createElement('span');
    label.className = 'edited-label';
    label.textContent = 'edited';
    bubble.querySelector('.meta')?.before(label);
  }
}

// ── Internal helpers ──────────────────────────────────────

function findMessage(chatId, msgId) {
  return (state.messages[chatId] || []).find(m => m.id === msgId);
}
