const { Router } = require('express');
const multer = require('multer');
const FormData = require('form-data');
const { wpp } = require('./webhooks');

const upload = multer({ storage: multer.memoryStorage() });

function createProxyRouter() {
  const router = Router();

  // ── Instance ────────────────────────────────────────────────────────────────

  router.get('/instance/status', async (req, res) => {
    try { const { data } = await wpp.get('/status'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/instance/qr', async (req, res) => {
    try { const { data } = await wpp.get('/qr'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/instance/logout', async (req, res) => {
    try { const { data } = await wpp.post('/logout'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/instance/restart', async (req, res) => {
    try { const { data } = await wpp.post('/restart'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Chats ───────────────────────────────────────────────────────────────────

  router.get('/chats', async (req, res) => {
    try { const { data } = await wpp.get('/chats', { params: { limit: 50 } }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/chats/:chatId/messages', async (req, res) => {
    try {
      const { data } = await wpp.get(`/messages/${req.params.chatId}/messages`, {
        params: { limit: req.query.limit || 50 },
      });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/read', async (req, res) => {
    try { const { data } = await wpp.patch(`/chats/${req.params.chatId}/read`, { read: true }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/archive', async (req, res) => {
    try { const { data } = await wpp.patch(`/chats/${req.params.chatId}/archive`, { archive: true }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/unarchive', async (req, res) => {
    try { const { data } = await wpp.patch(`/chats/${req.params.chatId}/archive`, { archive: false }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/pin', async (req, res) => {
    try { const { data } = await wpp.patch(`/chats/${req.params.chatId}/pin`, { pin: true }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/unpin', async (req, res) => {
    try { const { data } = await wpp.patch(`/chats/${req.params.chatId}/pin`, { pin: false }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/mute', async (req, res) => {
    try { const { data } = await wpp.patch(`/chats/${req.params.chatId}/mute`, { mute: true }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/chats/:chatId/unmute', async (req, res) => {
    try { const { data } = await wpp.patch(`/chats/${req.params.chatId}/mute`, { mute: false }); res.json(data); }
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
    try { const { data } = await wpp.post('/contacts/check', { numbers: [req.params.number] }); res.json(data); }
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

  router.patch('/groups/:groupId', async (req, res) => {
    try { const { data } = await wpp.patch(`/groups/${req.params.groupId}`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/subject', async (req, res) => {
    try { const { data } = await wpp.patch(`/groups/${req.params.groupId}`, { subject: req.body.subject }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/description', async (req, res) => {
    try { const { data } = await wpp.patch(`/groups/${req.params.groupId}`, { description: req.body.description }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/settings', async (req, res) => {
    try { const { data } = await wpp.patch(`/groups/${req.params.groupId}/settings`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/participants', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/participants/add`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/groups/:groupId/participants', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/participants/remove`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/admins', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/participants/promote`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/groups/:groupId/admins', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/participants/demote`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/leave', async (req, res) => {
    try { const { data } = await wpp.delete(`/groups/${req.params.groupId}/leave`); res.json(data); }
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
    try { const { data } = await wpp.patch('/business/hours', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Privacy — endpoint não disponível nesta versão da API ───────────────────

  router.all('/privacy*', (req, res) => {
    res.status(501).json({ error: 'Privacy settings not available in this API version' });
  });

  // ── Messages — extra types ───────────────────────────────────────────────────

  router.post('/send/image', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/messages/image', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/send/video', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/messages/video', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/send/document', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/messages/document', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/send/sticker', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/messages/sticker', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/send/gif', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/messages/gif', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/send/ptv', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/messages/ptv', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/send/link', async (req, res) => {
    try { const { data } = await wpp.post('/messages/link', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/forward', async (req, res) => {
    try { const { data } = await wpp.post('/messages/forward', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/pin', async (req, res) => {
    try { const { data } = await wpp.post('/messages/pin', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/poll-vote', async (req, res) => {
    try { const { data } = await wpp.post('/messages/poll-vote', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/presence', async (req, res) => {
    try { const { data } = await wpp.post('/messages/presence', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/bulk', async (req, res) => {
    try { const { data } = await wpp.post('/messages/bulk', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/carousel', async (req, res) => {
    try { const { data } = await wpp.post('/messages/carousel', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/cta-buttons', async (req, res) => {
    try { const { data } = await wpp.post('/messages/cta-buttons', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/image-button', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/messages/image-button', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/send/video-button', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/messages/video-button', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/send/table', async (req, res) => {
    try { const { data } = await wpp.post('/messages/table', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/otp', async (req, res) => {
    try { const { data } = await wpp.post('/messages/otp-button', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/pix', async (req, res) => {
    try { const { data } = await wpp.post('/messages/pix-button', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/product', async (req, res) => {
    try { const { data } = await wpp.post('/messages/product', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/catalog', async (req, res) => {
    try { const { data } = await wpp.post('/messages/catalog', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/ai-text', async (req, res) => {
    try { const { data } = await wpp.post('/messages/ai-text', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/base64', async (req, res) => {
    try { const { data } = await wpp.post('/messages/base64', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/messages/:chatId/:messageId', async (req, res) => {
    try { const { data } = await wpp.get(`/messages/${req.params.chatId}/messages/${req.params.messageId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/ai-assistant', async (req, res) => {
    try { const { data } = await wpp.post('/messages/ai-assistant', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/send/upload', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/messages/upload', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  // ── Chats — extras ────────────────────────────────────────────────────────────

  router.get('/chats/:chatId', async (req, res) => {
    try { const { data } = await wpp.get(`/chats/${req.params.chatId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/chats/:chatId/expiration', async (req, res) => {
    try { const { data } = await wpp.patch(`/chats/${req.params.chatId}/expiration`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Contacts — extras ─────────────────────────────────────────────────────────

  router.get('/contacts', async (req, res) => {
    try { const { data } = await wpp.get('/contacts'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/contacts/:phone/snapshot', async (req, res) => {
    try { const { data } = await wpp.get(`/contacts/${req.params.phone}/snapshot`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/contacts/:phone/status', async (req, res) => {
    try { const { data } = await wpp.get(`/contacts/${req.params.phone}/status`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/contacts/:phone/report', async (req, res) => {
    try { const { data } = await wpp.post(`/contacts/${req.params.phone}/report`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Groups — extras ───────────────────────────────────────────────────────────

  router.get('/groups', async (req, res) => {
    try { const { data } = await wpp.get('/groups'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/groups/:groupId/participants/pending', async (req, res) => {
    try { const { data } = await wpp.get(`/groups/${req.params.groupId}/participants/pending`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/groups/invite/:inviteCode/info', async (req, res) => {
    try { const { data } = await wpp.get(`/groups/invite/${req.params.inviteCode}/info`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/photo', async (req, res) => {
    try { const { data } = await wpp.patch(`/groups/${req.params.groupId}/photo`, { url: req.body.url }); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/ephemeral', async (req, res) => {
    try { const { data } = await wpp.patch(`/groups/${req.params.groupId}/ephemeral`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/participants/approve', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/participants/approve`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/participants/reject', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/participants/reject`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/mention-all', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/mention-all`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/send-list', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/send-list`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/invite/reset', async (req, res) => {
    try { const { data } = await wpp.post(`/groups/${req.params.groupId}/invite/reset`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Business — extras ──────────────────────────────────────────────────────────

  router.get('/business/products', async (req, res) => {
    try { const { data } = await wpp.get('/business/products'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/business/products', upload.single('image'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('image', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/business/products', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.patch('/business/products/:productId', async (req, res) => {
    try { const { data } = await wpp.patch(`/business/products/${req.params.productId}`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/business/products/:productId', async (req, res) => {
    try { const { data } = await wpp.delete(`/business/products/${req.params.productId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/business/profile', async (req, res) => {
    try { const { data } = await wpp.get('/business/profile'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/business/profile', async (req, res) => {
    try { const { data } = await wpp.patch('/business/profile', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/business/categories', async (req, res) => {
    try { const { data } = await wpp.get('/business/categories/available'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/business/categories', async (req, res) => {
    try { const { data } = await wpp.patch('/business/categories', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Profile ───────────────────────────────────────────────────────────────────

  router.get('/profile', async (req, res) => {
    try { const { data } = await wpp.get('/profile'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/profile', async (req, res) => {
    try { const { data } = await wpp.patch('/profile', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/profile/picture', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.patch('/profile/picture', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  // ── Status (stories) ─────────────────────────────────────────────────────────

  router.post('/status/text', async (req, res) => {
    try { const { data } = await wpp.post('/status/text', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/status/image', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/status/image', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/status/video', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      Object.entries(req.body).forEach(([k, v]) => form.append(k, v));
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.post('/status/video', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  // ── Communities ───────────────────────────────────────────────────────────────

  router.get('/communities', async (req, res) => {
    try { const { data } = await wpp.get('/communities'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/communities/:communityId', async (req, res) => {
    try { const { data } = await wpp.get(`/communities/${req.params.communityId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/communities', async (req, res) => {
    try { const { data } = await wpp.post('/communities', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/communities/:communityId', async (req, res) => {
    try { const { data } = await wpp.delete(`/communities/${req.params.communityId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/communities/:communityId/settings', async (req, res) => {
    try { const { data } = await wpp.patch(`/communities/${req.params.communityId}/settings`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/communities/:communityId/participants/add', async (req, res) => {
    try { const { data } = await wpp.post(`/communities/${req.params.communityId}/participants/add`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/communities/:communityId/participants/remove', async (req, res) => {
    try { const { data } = await wpp.post(`/communities/${req.params.communityId}/participants/remove`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/communities/:communityId/admins/promote', async (req, res) => {
    try { const { data } = await wpp.post(`/communities/${req.params.communityId}/admins/promote`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/communities/:communityId/admins/demote', async (req, res) => {
    try { const { data } = await wpp.post(`/communities/${req.params.communityId}/admins/demote`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/communities/:communityId/invite/reset', async (req, res) => {
    try { const { data } = await wpp.post(`/communities/${req.params.communityId}/invite/reset`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/communities/:communityId/groups/link', async (req, res) => {
    try { const { data } = await wpp.post(`/communities/${req.params.communityId}/groups/link`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/communities/:communityId/groups/unlink', async (req, res) => {
    try { const { data } = await wpp.post(`/communities/${req.params.communityId}/groups/unlink`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Queue ─────────────────────────────────────────────────────────────────────

  router.get('/queue', async (req, res) => {
    try { const { data } = await wpp.get('/queue'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/queue', async (req, res) => {
    try { const { data } = await wpp.delete('/queue'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/queue/:messageId', async (req, res) => {
    try { const { data } = await wpp.delete(`/queue/${req.params.messageId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Channels (newsletter) ─────────────────────────────────────────────────────

  router.get('/newsletter', async (req, res) => {
    try { const { data } = await wpp.get('/newsletter'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/newsletter/:channelId', async (req, res) => {
    try { const { data } = await wpp.get(`/newsletter/${req.params.channelId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/newsletter', async (req, res) => {
    try { const { data } = await wpp.post('/newsletter', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.delete('/newsletter/:channelId', async (req, res) => {
    try { const { data } = await wpp.delete(`/newsletter/${req.params.channelId}`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/newsletter/:channelId', async (req, res) => {
    try { const { data } = await wpp.patch(`/newsletter/${req.params.channelId}`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/newsletter/find', async (req, res) => {
    try { const { data } = await wpp.post('/newsletter/find', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/newsletter/:channelId/follow', async (req, res) => {
    try { const { data } = await wpp.post(`/newsletter/${req.params.channelId}/follow`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/newsletter/:channelId/unfollow', async (req, res) => {
    try { const { data } = await wpp.post(`/newsletter/${req.params.channelId}/unfollow`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/newsletter/:channelId/mute', async (req, res) => {
    try { const { data } = await wpp.post(`/newsletter/${req.params.channelId}/mute`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/newsletter/:channelId/unmute', async (req, res) => {
    try { const { data } = await wpp.post(`/newsletter/${req.params.channelId}/unmute`); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/newsletter/:channelId/transfer', async (req, res) => {
    try { const { data } = await wpp.post(`/newsletter/${req.params.channelId}/transfer`, req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Calls ─────────────────────────────────────────────────────────────────────

  router.post('/calls/link', async (req, res) => {
    try { const { data } = await wpp.post('/calls/link', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  // ── Instance — extras ─────────────────────────────────────────────────────────

  router.post('/instance/connect', async (req, res) => {
    try { const { data } = await wpp.post('/connect'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/instance/disconnect', async (req, res) => {
    try { const { data } = await wpp.post('/disconnect'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.post('/instance/pairing-code', async (req, res) => {
    try { const { data } = await wpp.post('/pairing-code', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.get('/instance/profile', async (req, res) => {
    try { const { data } = await wpp.get('/profile'); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/instance/profile', async (req, res) => {
    try { const { data } = await wpp.patch('/profile', req.body); res.json(data); }
    catch (err) { forwardError(res, err); }
  });

  router.patch('/instance/profile/picture', upload.single('file'), async (req, res) => {
    try {
      const form = new FormData();
      if (req.file) form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
      const { data } = await wpp.patch('/profile/picture', form, { headers: form.getHeaders() });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  return router;
}

function forwardError(res, err) {
  const status = err.response?.status || 500;
  const body = err.response?.data || { error: err.message };
  res.status(status).json(body);
}

module.exports = { createProxyRouter };
