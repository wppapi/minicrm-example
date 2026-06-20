// Pure utility functions — no side effects, no DOM, no state

export const ICONS = {
  user:     `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  users:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  fileText: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  barChart: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  slash:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
  mapPin:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  phone:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 8.72 19.79 19.79 0 0 1 1.92 0a2 2 0 0 1 1.99-2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
};

export const esc = str =>
  String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const enc = str => encodeURIComponent(str);
export const nowSec = () => Math.floor(Date.now() / 1000);

export function formatTime(ts) {
  if (!ts) return '';
  const d = ts > 1e10 ? new Date(ts) : new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function dayLabel(ts) {
  if (!ts) return '';
  const d = ts > 1e10 ? new Date(ts) : new Date(ts * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' });
}

export function chatTimeLabel(ts) {
  if (!ts) return '';
  const d = ts > 1e10 ? new Date(ts) : new Date(ts * 1000);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function avatarColors(str) {
  const palette = [
    { bg: '#d9534f', fg: '#fff' }, { bg: '#5cb85c', fg: '#fff' },
    { bg: '#5bc0de', fg: '#fff' }, { bg: '#f0ad4e', fg: '#fff' },
    { bg: '#9b59b6', fg: '#fff' }, { bg: '#1abc9c', fg: '#fff' },
    { bg: '#e67e22', fg: '#fff' }, { bg: '#3498db', fg: '#fff' },
    { bg: '#e91e8c', fg: '#fff' }, { bg: '#00897b', fg: '#fff' },
    { bg: '#8e44ad', fg: '#fff' }, { bg: '#c0392b', fg: '#fff' },
  ];
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

export function nameToHue(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export function rawTicksHtml(status) {
  if (status === 1)  return `<span class="ticks sent">✓</span>`;
  if (status === 2)  return `<span class="ticks sent">✓✓</span>`;
  if (status === 3)  return `<span class="ticks delivered">✓✓</span>`;
  if (status >= 4)   return `<span class="ticks read">✓✓</span>`;
  return '';
}

export function daySeparator(label) {
  const div = document.createElement('div');
  div.className = 'day-separator';
  div.innerHTML = `<span>${label}</span>`;
  return div;
}

export function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

export function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

export function loadAvatar(contactId, container) {
  const img = new Image();
  img.onload = () => { container.innerHTML = ''; container.appendChild(img); };
  img.src = `/api/contacts/${enc(contactId)}/avatar`;
}

export const isGroup = chatId => String(chatId).endsWith('@g.us');
