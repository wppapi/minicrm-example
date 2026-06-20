import { BusinessService } from '../services/BusinessService.js';
import { showToast, esc }   from '../utils.js';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export async function loadPanel() {
  await Promise.all([_loadLabels(), _loadHours()]);
}

async function _loadLabels() {
  const el = document.getElementById('labels-list');
  if (!el) return;
  try {
    const labels = await BusinessService.getLabels();
    el.innerHTML = '';
    labels.forEach(label => {
      const item = document.createElement('div');
      item.className = 'label-item';
      item.innerHTML = `
        <span class="label-dot" style="background:${esc(label.color)}"></span>
        <span style="flex:1">${esc(label.name)}</span>
        <button class="btn-icon-sm" title="Delete label" data-id="${esc(label.id)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>`;
      item.querySelector('button').addEventListener('click', async () => {
        await BusinessService.deleteLabel(label.id);
        _loadLabels();
      });
      el.appendChild(item);
    });
  } catch (e) { el.innerHTML = `<p style="color:var(--text-secondary);font-size:13px">${e.message}</p>`; }
}

async function _loadHours() {
  const el = document.getElementById('hours-list');
  if (!el) return;
  try {
    const hours = await BusinessService.getHours();
    el.innerHTML = '';
    DAYS.forEach((day, i) => {
      const d   = hours[i] || {};
      const row = document.createElement('div');
      row.className = 'hours-row';
      row.innerHTML = `
        <label class="toggle hours-day-toggle">
          <input type="checkbox" data-day="${i}" ${d.open ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
        <span class="hours-day-name">${day}</span>
        <input type="time" class="field-time" data-day="${i}" data-type="open"  value="${d.openTime  || '09:00'}" />
        <span>—</span>
        <input type="time" class="field-time" data-day="${i}" data-type="close" value="${d.closeTime || '18:00'}" />`;
      el.appendChild(row);
    });
  } catch {}
}

export async function saveHours() {
  const hours = {};
  document.querySelectorAll('#hours-list .hours-row').forEach(row => {
    const day       = row.querySelector('[data-day]').dataset.day;
    const open      = row.querySelector('[type="checkbox"]').checked;
    const openTime  = row.querySelector('[data-type="open"]').value;
    const closeTime = row.querySelector('[data-type="close"]').value;
    hours[day] = { open, openTime, closeTime };
  });
  await BusinessService.updateHours(hours);
  showToast('Business hours saved');
}

export async function createLabel() {
  const name  = document.getElementById('new-label-name').value.trim();
  const color = document.getElementById('new-label-color').value;
  if (!name) return;
  await BusinessService.createLabel(name, color);
  document.getElementById('new-label-name').value = '';
  await _loadLabels();
}
