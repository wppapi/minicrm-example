import { state }           from '../state.js';
import { InstanceService } from '../services/InstanceService.js';
import { avatarColors, showToast } from '../utils.js';

export async function loadProfile() {
  try {
    const p = await InstanceService.getProfile();
    if (!p) return;
    document.getElementById('instance-profile-name').textContent = p.name || '—';
    document.getElementById('instance-profile-status').textContent = p.status || '—';
    document.getElementById('instance-name-input').value = p.name || '';
    document.getElementById('instance-status-input').value = p.status || '';
    const av = document.getElementById('instance-avatar');
    if (av) {
      const { bg, fg } = avatarColors(p.name || '?');
      av.style.background = bg; av.style.color = fg;
      av.textContent = (p.name || '?').charAt(0).toUpperCase();
      if (p.profilePictureUrl) {
        const img = new Image();
        img.onload = () => { av.style.backgroundImage = `url(${p.profilePictureUrl})`; av.style.backgroundSize = 'cover'; av.textContent = ''; };
        img.src = p.profilePictureUrl;
      }
    }
  } catch {}
}

export async function saveProfile() {
  const name   = document.getElementById('instance-name-input').value.trim();
  const status = document.getElementById('instance-status-input').value.trim();
  const photo  = document.getElementById('instance-photo-input').value.trim();
  try {
    if (name || status) await InstanceService.updateProfile({ name, status });
    if (photo) await InstanceService.updateProfilePicture(photo);
    showToast('Profile updated');
    await loadProfile();
    document.getElementById('instance-photo-input').value = '';
  } catch (e) { showToast(`Error: ${e.message}`); }
}

export async function refreshStatus() {
  const el = document.getElementById('instance-status-display');
  try {
    const status = await InstanceService.getStatus();
    if (el) el.textContent = status;
  } catch (e) {
    if (el) el.textContent = 'Error';
  }
}

export async function fetchQr() {
  try {
    const qr = await InstanceService.getQr();
    const img = document.getElementById('instance-qr');
    if (qr && img) {
      img.src = `data:image/png;base64,${qr}`;
      img.classList.remove('hidden');
    } else {
      showToast('QR not available — instance may already be connected');
    }
  } catch (e) {
    showToast(`Error: ${e.message}`);
  }
}

export async function restart() {
  if (!confirm('Restart the WhatsApp connection?')) return;
  try {
    await InstanceService.restart();
    showToast('Restarting connection…');
    document.getElementById('conn-status').className = 'conn-dot connecting';
  } catch (e) { showToast(e.message); }
}

export async function logout() {
  if (!confirm('Disconnect and log out? You will need to scan QR again.')) return;
  try {
    await InstanceService.logout();
    state.connected = false;
    document.getElementById('conn-status').className = 'conn-dot disconnected';
    showToast('Logged out');
  } catch (e) { showToast(e.message); }
}
