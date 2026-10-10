import api from './api';

export const dashboardService = {
  async getDashboard(params = {}) {
    const response = await api.get('/dashboard', { params });
    return response.data;
  },
};

export default dashboardService;
