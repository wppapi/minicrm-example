import { post, upload } from '../api/client.js';

export const StatusService = {
  async sendText(text, backgroundColor = '#000000', font = 0) {
    return post('/status/text', { text, backgroundColor, font });
  },

  async sendImage(file, caption = '') {
    const form = new FormData();
    form.append('file', file, file.name);
    if (caption) form.append('caption', caption);
    return upload('/status/image', form);
  },

  async sendVideo(file, caption = '') {
    const form = new FormData();
    form.append('file', file, file.name);
    if (caption) form.append('caption', caption);
    return upload('/status/video', form);
  },
};
