import { get, post, patch, del } from '../api/client.js';
import { fromApiGroup }          from '../models/Group.js';
import { enc }                   from '../utils.js';

export const GroupService = {
  async create(name, participants) {
    return post('/groups', { name, participants });
  },

  async get(groupId) {
    const res = await get(`/groups/${enc(groupId)}`);
    return res?.data ? fromApiGroup(res.data) : null;
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

  async addParticipants(groupId, participants) {
    return post(`/groups/${enc(groupId)}/participants`, { participants });
  },

  async removeParticipants(groupId, participants) {
    return del(`/groups/${enc(groupId)}/participants`, { participants });
  },

  async promoteAdmins(groupId, participants) {
    return post(`/groups/${enc(groupId)}/admins`, { participants });
  },

  async demoteAdmins(groupId, participants) {
    return del(`/groups/${enc(groupId)}/admins`, { participants });
  },

  async leave(groupId) {
    return post(`/groups/${enc(groupId)}/leave`);
  },

  async getInviteLink(groupId) {
    const res = await get(`/groups/${enc(groupId)}/invite`);
    return res?.data?.inviteUrl || res?.data?.link || null;
  },

  async revokeInviteLink(groupId) {
    return del(`/groups/${enc(groupId)}/invite`);
  },

  async acceptInvite(inviteCode) {
    return post('/groups/invite/accept', { inviteCode });
  },
};
