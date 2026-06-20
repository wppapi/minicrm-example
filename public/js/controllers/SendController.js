import { state }          from '../state.js';
import { MessageService } from '../services/MessageService.js';
import { appendMessage }  from '../ui/MessageView.js';
import { nowSec, autoResize, showToast, enc, esc } from '../utils.js';

// ── Reply ─────────────────────────────────────────────────

export function setReply(msg) {
  state.quotedMessage = msg;
  document.getElementById('reply-text').textContent = msg.text || `[${msg.type}]`;
  document.getElementById('reply-preview').classList.remove('hidden');
  document.getElementById('message-input').focus();
}

export function clearReply() {
  state.quotedMessage = null;
  document.getElementById('reply-preview').classList.add('hidden');
}

// ── File preview ──────────────────────────────────────────

export function handleFileSelected(file) {
  if (!file) return;
  const type = file.type.startsWith('image/') ? 'image'
             : file.type.startsWith('video/') ? 'video'
             : 'document';
  state.pendingFile = { file, type };
  const content = document.getElementById('file-preview-content');
  content.innerHTML = type === 'image'
    ? `<img src="${URL.createObjectURL(file)}" alt="preview" /><span>${esc(file.name)}</span>`
    : `<span>${esc(file.name)}</span>`;
  document.getElementById('file-preview').classList.remove('hidden');
}

export function clearFile() {
  state.pendingFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('file-preview').classList.add('hidden');
  document.getElementById('file-preview-content').innerHTML = '';
}

// ── Text ──────────────────────────────────────────────────

export async function sendText(messageCallbacks) {
  const input  = document.getElementById('message-input');
  const text   = input.value.trim();
  const chatId = state.activeChatId;
  if (!text || !chatId) return;

  input.value = '';
  autoResize(input);

  const quotedId = state.quotedMessage?.id || null;
  clearReply();

  try {
    const res = await MessageService.sendText(chatId, text, quotedId);
    if (res?.data) {
      appendMessage(chatId, {
        id: res.data.messageId, type: 'text', text,
        fromMe: true, timestamp: nowSec(), status: 1, quotedId,
        from: null, to: chatId,
      }, document.getElementById('messages'), messageCallbacks);
    }
  } catch (e) {
    showToast(`Send failed: ${e.message}`);
  }
}

// ── File ──────────────────────────────────────────────────

export async function sendFile(messageCallbacks) {
  const { file, type } = state.pendingFile || {};
  const chatId = state.activeChatId;
  if (!file || !chatId) return;

  const quotedId = state.quotedMessage?.id || null;
  clearReply();
  clearFile();

  try {
    const res = await MessageService.sendFile(chatId, type, file, quotedId);
    if (res?.data) {
      appendMessage(chatId, {
        id: res.data.messageId, type,
        fromMe: true, timestamp: nowSec(), status: 1,
        from: null, to: chatId,
      }, document.getElementById('messages'), messageCallbacks);
    }
  } catch (e) {
    showToast(`Send failed: ${e.message}`);
  }
}

// ── Audio ─────────────────────────────────────────────────

export async function toggleRecording(messageCallbacks) {
  if (state.isRecording) {
    state.mediaRecorder.stop();
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  state.audioChunks = [];
  state.mediaRecorder = new MediaRecorder(stream);
  state.mediaRecorder.ondataavailable = e => state.audioChunks.push(e.data);
  state.mediaRecorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    document.getElementById('btn-audio').classList.remove('recording');
    state.isRecording = false;

    const chatId   = state.activeChatId;
    const blob     = new Blob(state.audioChunks, { type: 'audio/ogg; codecs=opus' });
    const quotedId = state.quotedMessage?.id || null;
    clearReply();

    try {
      const res = await MessageService.sendAudio(chatId, blob, quotedId);
      if (res?.data) {
        appendMessage(chatId, {
          id: res.data.messageId, type: 'audio',
          fromMe: true, timestamp: nowSec(), status: 1,
          from: null, to: chatId,
        }, document.getElementById('messages'), messageCallbacks);
      }
    } catch (e) {
      showToast(`Send failed: ${e.message}`);
    }
  };

  state.mediaRecorder.start();
  state.isRecording = true;
  document.getElementById('btn-audio').classList.add('recording');
}

// ── Poll ──────────────────────────────────────────────────

export async function sendPoll(messageCallbacks) {
  const question = document.getElementById('poll-question').value.trim();
  const options  = Array.from(document.querySelectorAll('#poll-options-list input'))
    .map(i => i.value.trim()).filter(Boolean);
  const chatId   = state.activeChatId;
  if (!question || options.length < 2 || !chatId) return;

  document.getElementById('poll-modal').classList.add('hidden');

  try {
    const singleChoice = document.getElementById('poll-single-choice').checked;
    const res = await MessageService.sendPoll(chatId, question, options, singleChoice);
    if (res?.data) {
      appendMessage(chatId, {
        id: res.data.messageId, type: 'poll',
        pollQuestion: question,
        pollOptions: options.map(n => ({ name: n, votes: 0 })),
        fromMe: true, timestamp: nowSec(), status: 1,
        from: null, to: chatId,
      }, document.getElementById('messages'), messageCallbacks);
    }
  } catch (e) {
    showToast(`Poll failed: ${e.message}`);
  }
}

// ── Buttons ───────────────────────────────────────────────

export async function sendButtons(messageCallbacks) {
  const text   = document.getElementById('buttons-text').value.trim();
  const footer = document.getElementById('buttons-footer').value.trim();
  const chatId = state.activeChatId;
  if (!text || !chatId) return;

  const buttons = Array.from(document.querySelectorAll('#buttons-list input'))
    .map((inp, i) => ({ id: `btn${i}`, text: inp.value.trim(), displayText: inp.value.trim() }))
    .filter(b => b.text);
  if (!buttons.length) return;

  document.getElementById('buttons-modal').classList.add('hidden');

  try {
    const res = await MessageService.sendButtons(chatId, text, footer, buttons);
    if (res?.data) {
      appendMessage(chatId, {
        id: res.data.messageId, type: 'buttons', text, buttons, footer,
        fromMe: true, timestamp: nowSec(), status: 1,
        from: null, to: chatId,
      }, document.getElementById('messages'), messageCallbacks);
    }
  } catch (e) {
    showToast(`Buttons failed: ${e.message}`);
  }
}

// ── List ──────────────────────────────────────────────────

export async function sendList(messageCallbacks) {
  const title      = document.getElementById('list-title').value.trim();
  const text       = document.getElementById('list-text').value.trim();
  const buttonText = document.getElementById('list-button-text').value.trim() || 'See options';
  const chatId     = state.activeChatId;
  if (!title || !text || !chatId) return;

  const sections = Array.from(document.querySelectorAll('.list-section-block')).map(block => ({
    title: block.querySelector('.section-title-input').value.trim(),
    rows:  Array.from(block.querySelectorAll('.section-rows input'))
      .map((inp, i) => ({ id: `row${i}`, title: inp.value.trim() }))
      .filter(r => r.title),
  })).filter(s => s.rows.length);

  if (!sections.length) return;
  document.getElementById('list-modal').classList.add('hidden');

  try {
    const res = await MessageService.sendList(chatId, title, text, buttonText, sections);
    if (res?.data) {
      appendMessage(chatId, {
        id: res.data.messageId, type: 'list', title, text, buttonText, sections,
        fromMe: true, timestamp: nowSec(), status: 1,
        from: null, to: chatId,
      }, document.getElementById('messages'), messageCallbacks);
    }
  } catch (e) {
    showToast(`List failed: ${e.message}`);
  }
}

// ── Location ──────────────────────────────────────────────

export async function sendLocation(messageCallbacks) {
  const lat     = parseFloat(document.getElementById('loc-lat').value);
  const lng     = parseFloat(document.getElementById('loc-lng').value);
  const name    = document.getElementById('loc-name').value.trim();
  const address = document.getElementById('loc-address').value.trim();
  const chatId  = state.activeChatId;
  if (isNaN(lat) || isNaN(lng) || !chatId) return;

  document.getElementById('location-modal').classList.add('hidden');

  try {
    const res = await MessageService.sendLocation(chatId, lat, lng, name, address);
    if (res?.data) {
      appendMessage(chatId, {
        id: res.data.messageId, type: 'location', lat, lng, name, address,
        fromMe: true, timestamp: nowSec(), status: 1,
        from: null, to: chatId,
      }, document.getElementById('messages'), messageCallbacks);
    }
  } catch (e) {
    showToast(`Location failed: ${e.message}`);
  }
}

// ── Contact card ──────────────────────────────────────────

export async function sendContactCard(messageCallbacks) {
  const name   = document.getElementById('contact-name').value.trim();
  const phone  = document.getElementById('contact-phone').value.trim();
  const chatId = state.activeChatId;
  if (!name || !phone || !chatId) return;

  document.getElementById('contact-modal').classList.add('hidden');

  try {
    const res = await MessageService.sendContact(chatId, name, phone);
    if (res?.data) {
      appendMessage(chatId, {
        id: res.data.messageId, type: 'vcard', vcardName: name, vcardPhone: phone,
        fromMe: true, timestamp: nowSec(), status: 1,
        from: null, to: chatId,
      }, document.getElementById('messages'), messageCallbacks);
    }
  } catch (e) {
    showToast(`Contact failed: ${e.message}`);
  }
}

// ── Revoke ────────────────────────────────────────────────

export async function revokeMessage(e, msg, chatId) {
  if (!confirm('Delete this message for everyone?')) return;
  try {
    await MessageService.revoke(chatId, msg.id);
    const { markBubbleDeleted } = await import('../ui/MessageView.js');
    markBubbleDeleted(msg.id, msg.timestamp);
  } catch (err) {
    showToast(`Could not delete: ${err.message}`);
  }
}


// ── Reaction ──────────────────────────────────────────────

export async function sendReaction(chatId, msgId, emoji) {
  try {
    await MessageService.sendReaction(chatId, msgId, emoji);
    if (!state.reactions[chatId]) state.reactions[chatId] = {};
    if (!state.reactions[chatId][msgId]) state.reactions[chatId][msgId] = {};
    state.reactions[chatId][msgId][emoji] = (state.reactions[chatId][msgId][emoji] || 0) + 1;
    const { updateReactionsInDom } = await import('../ui/MessageView.js');
    updateReactionsInDom(chatId, msgId);
  } catch (e) {
    showToast(`Reaction failed: ${e.message}`);
  }
}
