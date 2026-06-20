const { Router } = require('express');
const multer = require('multer');
const FormData = require('form-data');
const { wpp } = require('./webhooks');

const upload = multer({ storage: multer.memoryStorage() });

function createProxyRouter() {
  const router = Router();

  // ── Instance ────────────────────────────────────────────────────────────────

  router.get('/instance/status', async (req, res) => {
    try { const { data } = await wpp.get('/instance/status'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/instance/qr', async (req, res) => {
    try { const { data } = await wpp.get('/instance/qr'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/instance/logout', async (req, res) => {
    try { const { data } = await wpp.post('/instance/logout'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/instance/restart', async (req, res) => {
    try { const { data } = await wpp.post('/instance/restart'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Chats ───────────────────────────────────────────────────────────────────

  router.get('/chats', async (req, res) => {
    try { const { data } = await wpp.get('/chats', { params: { limit: 50 } }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/chats/:chatId/messages', async (req, res) => {
    try {
      const { data } = await wpp.get(`/chats/${req.params.chatId}/messages`, {
        params: { limit: req.query.limit || 50 },
      });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/read', async (req, res) => {
    try { const { data } = await wpp.post(`/chats/${req.params.chatId}/read`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/archive', async (req, res) => {
    try { const { data } = await wpp.post(`/chats/${req.params.chatId}/archive`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/unarchive', async (req, res) => {
    try { const { data } = await wpp.post(`/chats/${req.params.chatId}/unarchive`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/pin', async (req, res) => {
    try { const { data } = await wpp.post(`/chats/${req.params.chatId}/pin`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/unpin', async (req, res) => {
    try { const { data } = await wpp.post(`/chats/${req.params.chatId}/unpin`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/mute', async (req, res) => {
    try { const { data } = await wpp.post(`/chats/${req.params.chatId}/mute`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/unmute', async (req, res) => {
    try { const { data } = await wpp.post(`/chats/${req.params.chatId}/unmute`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/chats/:chatId', async (req, res) => {
    try { const { data } = await wpp.delete(`/chats/${req.params.chatId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/chats/:chatId/messages', async (req, res) => {
    try { const { data } = await wpp.delete(`/chats/${req.params.chatId}/messages`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Contacts ────────────────────────────────────────────────────────────────

  router.get('/contacts/:contactId', async (req, res) => {
    try { const { data } = await wpp.get(`/contacts/${req.params.contactId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/contacts/:contactId/avatar', async (req, res) => {
    try {
      const response = await wpp.get(`/contacts/${req.params.contactId}/profile-picture`, { responseType: 'stream' });
      res.set('Content-Type', response.headers['content-type']);
      res.set('Cache-Control', 'public, max-age=86400');
      response.data.pipe(res);
    } catch { res.sendStatus(404); }
  });

  router.get('/contacts/check/:number', async (req, res) => {
    try { const { data } = await wpp.get(`/contacts/check/${req.params.number}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/contacts/:contactId/block', async (req, res) => {
    try { const { data } = await wpp.post(`/contacts/${req.params.contactId}/block`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/contacts/:contactId/unblock', async (req, res) => {
    try { const { data } = await wpp.post(`/contacts/${req.params.contactId}/unblock`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Messages — send ─────────────────────────────────────────────────────────

  router.post('/send/text', async (req, res) => {
    try { const { data } = await wpp.post('/messages/text', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/audio', upload.single('audio'), async (req, res) => {
    const { to, quotedId } = req.body;
    try {
      const form = new FormData();
      form.append('to', to);
      form.append('audio', req.file.buffer, { filename: 'audio.ogg', contentType: req.file.mimetype });
      if (quotedId) form.append('quotedId', quotedId);
      const { data } = await wpp.post('/messages/audio', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/send/file', upload.single('file'), async (req, res) => {
    const { to, caption, quotedId, type } = req.body;
    const endpoint = ['image', 'video', 'document', 'sticker'].includes(type) ? type : 'document';
    try {
      const form = new FormData();
      form.append('to', to);
      form.append(endpoint, req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      if (caption) form.append('caption', caption);
      if (quotedId) form.append('quotedId', quotedId);
      const { data } = await wpp.post(`/messages/${endpoint}`, form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/send/reaction', async (req, res) => {
    try { const { data } = await wpp.post('/messages/reaction', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/poll', async (req, res) => {
    try { const { data } = await wpp.post('/messages/poll', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/list', async (req, res) => {
    try { const { data } = await wpp.post('/messages/list', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/buttons', async (req, res) => {
    try { const { data } = await wpp.post('/messages/buttons', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/location', async (req, res) => {
    try { const { data } = await wpp.post('/messages/location', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/contact', async (req, res) => {
    try { const { data } = await wpp.post('/messages/contact', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/messages/:chatId/:messageId', async (req, res) => {
    try {
      const { data } = await wpp.delete(`/chats/${req.params.chatId}/messages/${req.params.messageId}`);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  // ── Media download ──────────────────────────────────────────────────────────

  router.get('/media/:chatId/:messageId', async (req, res) => {
    try {
      const response = await wpp.get(
        `/chats/${req.params.chatId}/messages/${req.params.messageId}/download`,
        { responseType: 'stream' }
      );
      res.set('Content-Type', response.headers['content-type']);
      response.data.pipe(res);
    } catch (err) { forwardError(res, err); }
  });

  // ── Groups ──────────────────────────────────────────────────────────────────

  router.post('/groups', async (req, res) => {
    try { const { data } = await wpp.post('/groups', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/groups/:groupId', async (req, res) => {
    try { const { data } = await wpp.get(`/groups/${req.params.groupId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/subject', async (req, res) => {
    try { const { data } = await wpp.patch(`/groups/${req.params.groupId}/subject`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/description', async (req, res) => {
    try { const { data } = await wpp.patch(`/groups/${req.params.groupId}/description`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/settings', async (req, res) => {
    try { const { data } = await wpp.patch(`/groups/${req.params.groupId}/settings`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/participants', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/participants`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/groups/:groupId/participants', async (req, res) => {
    try { const { data } = await wpp.delete(`/groups/${req.params.groupId}/participants`, { data: req.body }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/admins', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/admins`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/groups/:groupId/admins', async (req, res) => {
    try { const { data } = await wpp.delete(`/groups/${req.params.groupId}/admins`, { data: req.body }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/leave', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/leave`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/groups/:groupId/invite', async (req, res) => {
    try { const { data } = await wpp.get(`/groups/${req.params.groupId}/invite`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/groups/:groupId/invite', async (req, res) => {
    try { const { data } = await wpp.delete(`/groups/${req.params.groupId}/invite`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/invite/accept', async (req, res) => {
    try { const { data } = await wpp.post('/groups/invite/accept', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Business ────────────────────────────────────────────────────────────────

  router.get('/business/labels', async (req, res) => {
    try { const { data } = await wpp.get('/business/labels'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/business/labels', async (req, res) => {
    try { const { data } = await wpp.post('/business/labels', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/business/labels/:id', async (req, res) => {
    try { const { data } = await wpp.patch(`/business/labels/${req.params.id}`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/business/labels/:id', async (req, res) => {
    try { const { data } = await wpp.delete(`/business/labels/${req.params.id}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/business/labels/:id/chats', async (req, res) => {
    try { const { data } = await wpp.post(`/business/labels/${req.params.id}/chats`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/business/labels/:id/chats/:chatId', async (req, res) => {
    try { const { data } = await wpp.delete(`/business/labels/${req.params.id}/chats/${req.params.chatId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/business/hours', async (req, res) => {
    try { const { data } = await wpp.get('/business/hours'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.put('/business/hours', async (req, res) => {
    try { const { data } = await wpp.put('/business/hours', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Privacy ─────────────────────────────────────────────────────────────────

  router.get('/privacy', async (req, res) => {
    try { const { data } = await wpp.get('/privacy'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/privacy/last-seen', async (req, res) => {
    try { const { data } = await wpp.patch('/privacy/last-seen', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/privacy/profile-photo', async (req, res) => {
    try { const { data } = await wpp.patch('/privacy/profile-photo', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/privacy/status', async (req, res) => {
    try { const { data } = await wpp.patch('/privacy/status', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/privacy/online', async (req, res) => {
    try { const { data } = await wpp.patch('/privacy/online', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/privacy/groups-add', async (req, res) => {
    try { const { data } = await wpp.patch('/privacy/groups-add', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  return router;
}

function forwardError(res, err) {
  const status = err.response?.status || 500;
  const body = err.response?.data || { error: err.message };
  res.status(status).json(body);
}

module.exports = { createProxyRouter };
