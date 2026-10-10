import api from './api';

export const orderService = {
  async getOrders(params = {}) {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  async getOrder(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  async updateStatus(id, status, catatan = '') {
    const payload = { status };
    if (catatan) {
      payload.catatan = catatan;
    }
    const response = await api.put(`/orders/${id}/status`, payload);
    return response.data;
  },

  async cancelOrder(id, reason = '') {
    const payload = reason ? { alasan: reason, catatan: reason } : {};
    const response = await api.post(`/orders/${id}/cancel`, payload);
    return response.data;
  },

  async deleteOrder(id) {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  async getPayments(orderId) {
    const response = await api.get(`/orders/${orderId}/payments`);
    return response.data;
  },

  async createPayment(orderId, paymentData) {
    const response = await api.post(`/orders/${orderId}/payments`, paymentData);
    return response.data;
  },
};

export default orderService;
