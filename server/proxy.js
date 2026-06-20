const { Router } = require('express');
const multer = require('multer');
const FormData = require('form-data');
const { wpp } = require('./webhooks');

const upload = multer({ storage: multer.memoryStorage() });

function createProxyRouter() {
  const router = Router();

  // --- chats ---

  router.get('/chats', async (req, res) => {
    try {
      const { data } = await wpp.get('/chats', { params: { limit: 50 } });
      res.json(data);
    } catch (err) {
      forwardError(res, err);
    }
  });

  router.get('/chats/:chatId/messages', async (req, res) => {
    try {
      const { data } = await wpp.get(`/chats/${req.params.chatId}/messages`, {
        params: { limit: req.query.limit || 50 },
      });
      res.json(data);
    } catch (err) {
      forwardError(res, err);
    }
  });

  // --- chats: mark as read ---

  router.post('/chats/:chatId/read', async (req, res) => {
    try {
      const { data } = await wpp.post(`/chats/${req.params.chatId}/read`);
      res.json(data);
    } catch (err) {
      forwardError(res, err);
    }
  });

  // --- contact avatar (cached by the browser via standard HTTP caching) ---

  router.get('/contacts/:contactId/avatar', async (req, res) => {
    try {
      const response = await wpp.get(`/contacts/${req.params.contactId}/profile-picture`, {
        responseType: 'stream',
      });
      res.set('Content-Type', response.headers['content-type']);
      res.set('Cache-Control', 'public, max-age=86400');
      response.data.pipe(res);
    } catch {
      // return 404 so the frontend falls back to the initials avatar
      res.sendStatus(404);
    }
  });

  // --- send messages ---

  router.post('/send/text', async (req, res) => {
    const { to, text, quotedId } = req.body;
    try {
      const { data } = await wpp.post('/messages/text', { to, text, quotedId });
      res.json(data);
    } catch (err) {
      forwardError(res, err);
    }
  });

  // Accepts an audio blob (multipart/form-data) from the browser's MediaRecorder API
  router.post('/send/audio', upload.single('audio'), async (req, res) => {
    const { to, quotedId } = req.body;
    try {
      const form = new FormData();
      form.append('to', to);
      form.append('audio', req.file.buffer, {
        filename: 'audio.ogg',
        contentType: req.file.mimetype,
      });
      if (quotedId) form.append('quotedId', quotedId);

      const { data } = await wpp.post('/messages/audio', form, {
        headers: form.getHeaders(),
      });
      res.json(data);
    } catch (err) {
      forwardError(res, err);
    }
  });

  // Accepts image/video/document files uploaded from the browser
  router.post('/send/file', upload.single('file'), async (req, res) => {
    const { to, caption, quotedId, type } = req.body;
    const endpoint = ['image', 'video', 'document', 'sticker'].includes(type) ? type : 'document';
    try {
      const form = new FormData();
      form.append('to', to);
      form.append(endpoint, req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
      if (caption) form.append('caption', caption);
      if (quotedId) form.append('quotedId', quotedId);

      const { data } = await wpp.post(`/messages/${endpoint}`, form, {
        headers: form.getHeaders(),
      });
      res.json(data);
    } catch (err) {
      forwardError(res, err);
    }
  });

  // Send emoji reaction to a message
  router.post('/send/reaction', async (req, res) => {
    const { to, messageId, emoji } = req.body;
    try {
      const { data } = await wpp.post('/messages/reaction', { to, messageId, emoji });
      res.json(data);
    } catch (err) {
      forwardError(res, err);
    }
  });

  // --- groups ---

  router.post('/groups', async (req, res) => {
    try {
      const { data } = await wpp.post('/groups', req.body);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.get('/groups/:groupId', async (req, res) => {
    try {
      const { data } = await wpp.get(`/groups/${req.params.groupId}`);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/subject', async (req, res) => {
    try {
      const { data } = await wpp.patch(`/groups/${req.params.groupId}/subject`, req.body);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/description', async (req, res) => {
    try {
      const { data } = await wpp.patch(`/groups/${req.params.groupId}/description`, req.body);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.patch('/groups/:groupId/settings', async (req, res) => {
    try {
      const { data } = await wpp.patch(`/groups/${req.params.groupId}/settings`, req.body);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/participants', async (req, res) => {
    try {
      const { data } = await wpp.post(`/groups/${req.params.groupId}/participants`, req.body);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.delete('/groups/:groupId/participants', async (req, res) => {
    try {
      const { data } = await wpp.delete(`/groups/${req.params.groupId}/participants`, { data: req.body });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/admins', async (req, res) => {
    try {
      const { data } = await wpp.post(`/groups/${req.params.groupId}/admins`, req.body);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.delete('/groups/:groupId/admins', async (req, res) => {
    try {
      const { data } = await wpp.delete(`/groups/${req.params.groupId}/admins`, { data: req.body });
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/groups/:groupId/leave', async (req, res) => {
    try {
      const { data } = await wpp.post(`/groups/${req.params.groupId}/leave`);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.get('/groups/:groupId/invite', async (req, res) => {
    try {
      const { data } = await wpp.get(`/groups/${req.params.groupId}/invite`);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.delete('/groups/:groupId/invite', async (req, res) => {
    try {
      const { data } = await wpp.delete(`/groups/${req.params.groupId}/invite`);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  router.post('/groups/invite/accept', async (req, res) => {
    try {
      const { data } = await wpp.post('/groups/invite/accept', req.body);
      res.json(data);
    } catch (err) { forwardError(res, err); }
  });

  // --- media download ---

  // Streams media files to the browser without exposing the instance token to the client
  router.get('/media/:chatId/:messageId', async (req, res) => {
    try {
      const response = await wpp.get(
        `/chats/${req.params.chatId}/messages/${req.params.messageId}/download`,
        { responseType: 'stream' }
      );
      res.set('Content-Type', response.headers['content-type']);
      response.data.pipe(res);
    } catch (err) {
      forwardError(res, err);
    }
  });

  return router;
}

function forwardError(res, err) {
  const status = err.response?.status || 500;
  const body = err.response?.data || { error: err.message };
  res.status(status).json(body);
}

module.exports = { createProxyRouter };
