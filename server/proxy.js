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
