import { get, post, patch, del, upload } from '../api/client.js';
import { fromApiGroup }                   from '../models/Group.js';
import { enc }                            from '../utils.js';

export const GroupService = {
  async list() {
    const res = await get('/groups');
    return (res?.data || []).map(fromApiGroup);
  },

  async get(groupId) {
    const res = await get(`/groups/${enc(groupId)}`);
    return res?.data ? fromApiGroup(res.data) : null;
  },

  async create(name, participants) {
    return post('/groups', { name, participants });
  },

  async update(groupId, fields) {
    return patch(`/groups/${enc(groupId)}`, fields);
  },

  async updateSubject(groupId, subject) {
    return patch(`/groups/${enc(groupId)}/subject`, { subject });
  },

  async updateDescription(groupId, description) {
    return patch(`/groups/${enc(groupId)}/description`, { description });
  },

  async updateSettings(groupId, { announce }) {
    return patch(`/groups/${enc(groupId)}/settings`, { announce });
  },

  async updatePhoto(groupId, url) {
    return patch(`/groups/${enc(groupId)}/photo`, { url });
  },

  async setEphemeral(groupId, seconds) {
    return patch(`/groups/${enc(groupId)}/ephemeral`, { expiration: seconds });
  },

  async addParticipants(groupId, participants) {
    return post(`/groups/${enc(groupId)}/participants`, { participants });
  },

  async removeParticipants(groupId, participants) {
    return del(`/groups/${enc(groupId)}/participants`, { participants });
  },

  async approveParticipants(groupId, participants) {
    return post(`/groups/${enc(groupId)}/participants/approve`, { participants });
  },

  async rejectParticipants(groupId, participants) {
    return post(`/groups/${enc(groupId)}/participants/reject`, { participants });
  },

  async getPendingParticipants(groupId) {
    const res = await get(`/groups/${enc(groupId)}/participants/pending`);
    return res?.data || [];
  },

  async promoteAdmins(groupId, participants) {
    return post(`/groups/${enc(groupId)}/admins`, { participants });
  },

  async demoteAdmins(groupId, participants) {
    return del(`/groups/${enc(groupId)}/admins`, { participants });
  },

  async mentionAll(groupId, text) {
    return post(`/groups/${enc(groupId)}/mention-all`, { text });
  },

  async sendList(groupId, title, text, buttonText, sections) {
    return post(`/groups/${enc(groupId)}/send-list`, { title, text, buttonText, sections });
  },

  async leave(groupId) {
    return post(`/groups/${enc(groupId)}/leave`);
  },

  async getInviteLink(groupId) {
    const res = await get(`/groups/${enc(groupId)}/invite`);
    return res?.data?.inviteUrl || res?.data?.link || null;
  },

  async resetInviteLink(groupId) {
    return post(`/groups/${enc(groupId)}/invite/reset`);
  },

  async revokeInviteLink(groupId) {
    return del(`/groups/${enc(groupId)}/invite`);
  },

  async getInviteInfo(inviteCode) {
    const res = await get(`/groups/invite/${enc(inviteCode)}/info`);
    return res?.data || null;
  },

  async acceptInvite(inviteCode) {
    return post('/groups/invite/accept', { inviteCode });
  },
};
