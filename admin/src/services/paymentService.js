import api from './api';

export const paymentService = {
  async getPayments(params = {}) {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  async getPaymentsForOrder(orderId) {
    const response = await api.get(`/orders/${orderId}/payments`);
    return response.data;
  },

  async createPayment(data) {
    const response = await api.post('/payments', data);
    return response.data;
  },

  async getPayment(id) {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  async deletePayment(id) {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },
};

export default paymentService;
