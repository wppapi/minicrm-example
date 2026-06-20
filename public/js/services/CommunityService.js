import { get, post, patch, del } from '../api/client.js';
import { enc }                   from '../utils.js';

export const CommunityService = {
  async list() {
    const res = await get('/communities');
    return res?.data || [];
  },

  async get(communityId) {
    const res = await get(`/communities/${enc(communityId)}`);
    return res?.data || null;
  },

  async create(name, description = '') {
    return post('/communities', { name, description });
  },

  async delete(communityId) {
    return del(`/communities/${enc(communityId)}`);
  },

  async updateSettings(communityId, settings) {
    return patch(`/communities/${enc(communityId)}/settings`, settings);
  },

  async addParticipants(communityId, participants) {
    return post(`/communities/${enc(communityId)}/participants/add`, { participants });
  },

  async removeParticipants(communityId, participants) {
    return post(`/communities/${enc(communityId)}/participants/remove`, { participants });
  },

  async promoteAdmins(communityId, participants) {
    return post(`/communities/${enc(communityId)}/admins/promote`, { participants });
  },

  async demoteAdmins(communityId, participants) {
    return post(`/communities/${enc(communityId)}/admins/demote`, { participants });
  },

  async resetInvite(communityId) {
    return post(`/communities/${enc(communityId)}/invite/reset`);
  },

  async linkGroup(communityId, groupId) {
    return post(`/communities/${enc(communityId)}/groups/link`, { groupId });
  },

  async unlinkGroup(communityId, groupId) {
    return post(`/communities/${enc(communityId)}/groups/unlink`, { groupId });
  },
};
