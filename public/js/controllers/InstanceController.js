import { state }           from '../state.js';
import { InstanceService } from '../services/InstanceService.js';
import { showToast }        from '../utils.js';

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
