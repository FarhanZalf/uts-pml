import api from './api';

export const financeService = {
  async getFinances(params = {}) {
    const response = await api.get('/finance', { params });
    return response.data;
  },

  async getSummary(params = {}) {
    const response = await api.get('/finance/summary', { params });
    return response.data;
  },

  async getFinance(id) {
    const response = await api.get(`/finance/${id}`);
    return response.data;
  },

  async createFinance(data) {
    const response = await api.post('/finance', data);
    return response.data;
  },

  async updateFinance(id, data) {
    const response = await api.put(`/finance/${id}`, data);
    return response.data;
  },

  async deleteFinance(id) {
    const response = await api.delete(`/finance/${id}`);
    return response.data;
  },
};

export default financeService;
