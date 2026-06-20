import { PrivacyService } from '../services/PrivacyService.js';
import { showToast }       from '../utils.js';

export async function loadPanel() {
  try {
    const p = await PrivacyService.get();
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('priv-last-seen',     p.lastSeen);
    set('priv-profile-photo', p.profilePhoto);
    set('priv-status',        p.status);
    set('priv-online',        p.online);
    set('priv-groups-add',    p.groupsAdd);
  } catch (e) {
    showToast('Could not load privacy settings');
  }
}

export async function save() {
  const val = id => document.getElementById(id)?.value;
  try {
    await PrivacyService.updateAll({
      lastSeen:     val('priv-last-seen'),
      profilePhoto: val('priv-profile-photo'),
      status:       val('priv-status'),
      online:       val('priv-online'),
      groupsAdd:    val('priv-groups-add'),
    });
    showToast('Privacy settings saved');
  } catch (e) {
    showToast(`Failed: ${e.message}`);
  }
}
