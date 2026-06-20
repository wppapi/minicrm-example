import { get, post, patch, put, del, upload } from '../api/client.js';
import { fromApiLabel }                        from '../models/Label.js';
import { enc }                                 from '../utils.js';

export const BusinessService = {
  // ── Labels ────────────────────────────────────────────────────────────────
  async getLabels() {
    const res = await get('/business/labels');
    return (res?.data || []).map(fromApiLabel);
  },

  async createLabel(name, color) {
    return post('/business/labels', { name, color });
  },

  async updateLabel(id, name, color) {
    return patch(`/business/labels/${enc(id)}`, { name, color });
  },

  async deleteLabel(id) {
    return del(`/business/labels/${enc(id)}`);
  },

  async assignLabel(labelId, chatIds) {
    return post(`/business/labels/${enc(labelId)}/chats`, { chatIds });
  },

  async removeLabel(labelId, chatId) {
    return del(`/business/labels/${enc(labelId)}/chats/${enc(chatId)}`);
  },

  // ── Business hours ────────────────────────────────────────────────────────
  async getHours() {
    const res = await get('/business/hours');
    return res?.data || {};
  },

  async updateHours(hours) {
    return put('/business/hours', { hours });
  },

  // ── Products ──────────────────────────────────────────────────────────────
  async getProducts() {
    const res = await get('/business/products');
    return res?.data || [];
  },

  async createProduct({ name, description, price, currency = 'BRL', imageFile = null }) {
    const form = new FormData();
    form.append('name', name);
    form.append('description', description);
    form.append('price', price);
    form.append('currency', currency);
    if (imageFile) form.append('image', imageFile, imageFile.name);
    return upload('/business/products', form);
  },

  async updateProduct(productId, fields) {
    return patch(`/business/products/${enc(productId)}`, fields);
  },

  async deleteProduct(productId) {
    return del(`/business/products/${enc(productId)}`);
  },

  // ── Business profile ──────────────────────────────────────────────────────
  async getProfile() {
    const res = await get('/business/profile');
    return res?.data || null;
  },

  async updateProfile(fields) {
    return patch('/business/profile', fields);
  },

  // ── Categories ────────────────────────────────────────────────────────────
  async getAvailableCategories() {
    const res = await get('/business/categories');
    return res?.data || [];
  },

  async updateCategories(categories) {
    return patch('/business/categories', { categories });
  },
};
