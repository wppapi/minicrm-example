import { PrivacyService } from '../services/PrivacyService.js';
import { showToast }       from '../utils.js';

// The WPP API has no GET endpoint for privacy settings (write-only).
// loadPanel is kept for future compatibility but silently skips on error.
export async function loadPanel() {
  try {
    const blocked = await PrivacyService.getBlocked();
    const el = document.getElementById('priv-blocked-count');
    if (el) el.textContent = blocked.length ? `${blocked.length} blocked` : 'None';
  } catch {
    // blocked list is best-effort
  }
}

export async function save() {
  const val = id => document.getElementById(id)?.value ?? null;
  try {
    const results = await PrivacyService.updateAll({
      lastSeen:       val('priv-last-seen'),
      profilePicture: val('priv-profile-picture'),
      status:         val('priv-status'),
      online:         val('priv-online'),
      groupsAdd:      val('priv-groups-add'),
      readReceipts:   val('priv-read-receipts'),
      calls:          val('priv-calls'),
      messagesTimer:  val('priv-messages-timer'),
    });
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length === 0) {
      showToast('Privacy settings saved');
    } else if (failed.length < results.length) {
      showToast(`Saved with ${failed.length} error(s)`);
    } else {
      showToast('Failed to save privacy settings');
    }
  } catch (e) {
    showToast(`Failed: ${e.message}`);
  }
}
