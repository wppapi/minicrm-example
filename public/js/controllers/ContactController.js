import { state }           from '../state.js';
import { ContactService }  from '../services/ContactService.js';
import { BusinessService } from '../services/BusinessService.js';
import { avatarColors, isGroup, showToast, loadAvatar, esc } from '../utils.js';

export async function openContactPanel(chatId) {
  if (!chatId || isGroup(chatId)) return;

  const { bg, fg } = avatarColors(chatId);
  const cpAvatar = document.getElementById('cp-avatar');
  cpAvatar.style.background = bg; cpAvatar.style.color = fg;
  cpAvatar.textContent = chatId.charAt(0).toUpperCase();
  loadAvatar(chatId, cpAvatar);

  const chat = state.chats.find(c => c.id === chatId);
  document.getElementById('cp-name').textContent = chat?.name || chatId;
  document.getElementById('cp-number').textContent =
    chatId.replace('@s.whatsapp.net', '').replace('@c.us', '');

  await _renderContactLabels(chatId);

  const blockBtn = document.getElementById('btn-block-contact');
  blockBtn.textContent = 'Block contact';
  blockBtn.onclick = async () => {
    if (!confirm('Block this contact?')) return;
    try {
      await ContactService.block(chatId);
      showToast('Contact blocked');
    } catch (e) { showToast(e.message); }
  };

  document.getElementById('contact-panel').classList.remove('hidden');
  document.getElementById('group-panel').classList.add('hidden');
}

async function _renderContactLabels(chatId) {
  const el = document.getElementById('cp-labels');
  if (!el) return;
  el.innerHTML = '';
  try {
    const labels = await BusinessService.getLabels();
    labels.forEach(label => {
      const chip = document.createElement('div');
      chip.className = 'label-chip';
      chip.style.background = label.color;
      chip.textContent = label.name;
      chip.title = 'Click to assign';
      chip.addEventListener('click', async () => {
        await BusinessService.assignLabel(label.id, [chatId]);
        showToast(`Label "${label.name}" assigned`);
      });
      el.appendChild(chip);
    });
  } catch {}
}

export function bindContactPanelEvents() {
  document.getElementById('btn-close-contact-panel')
    ?.addEventListener('click', () =>
      document.getElementById('contact-panel').classList.add('hidden')
    );
}

export async function checkNumber() {
  const input  = document.getElementById('check-number-input');
  const result = document.getElementById('check-number-result');
  const number = input.value.trim();
  if (!number) return;

  result.textContent = 'Checking…';
  result.className   = 'check-result';
  result.classList.remove('hidden');

  try {
    const onWA = await ContactService.check(number);
    result.textContent = onWA ? `+${number} is on WhatsApp` : `+${number} is NOT on WhatsApp`;
    result.className   = `check-result ${onWA ? 'ok' : 'nok'}`;
  } catch (e) {
    result.textContent = 'Error: ' + e.message;
  }
}
