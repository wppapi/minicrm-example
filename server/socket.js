const { Router } = require('express');

// Receives events from WPP API and broadcasts them to connected browsers via Socket.io.
// Always responds 200 immediately — processing happens on the client side.
function createWebhookRouter(io) {
  const router = Router();
  router.use(require('express').json());

  function relay(eventName) {
    return (req, res) => {
      res.sendStatus(200);
      io.emit(eventName, req.body);
    };
  }

  router.post('/message',          relay('message'));
  router.post('/message-status',   relay('message-status'));
  router.post('/message-deleted',  relay('message-deleted'));
  router.post('/message-edited',   relay('message-edited'));
  router.post('/presence',         relay('presence'));
  router.post('/reaction',         relay('reaction'));
  router.post('/connect',          relay('connect'));
  router.post('/disconnect',       relay('disconnect'));
  router.post('/qr',               relay('qr'));
  router.post('/poll-vote',        relay('poll-vote'));
  router.post('/call',             relay('call'));
  router.post('/group-update',     relay('group-update'));

  return router;
}

module.exports = { createWebhookRouter };
