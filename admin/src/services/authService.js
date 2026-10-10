import api from './api';

export const authService = {
  /**
   * Login user with email & password
   * @param {{ email: string, password: string }} credentials
   */
  async login(credentials) {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  /**
   * Get current authenticated user profile
   */
  async me() {
    const response = await api.get('/me');
    return response.data;
  },

  /**
   * Revoke current user token
   */
  async logout() {
    const response = await api.post('/logout');
    return response.data;
  },
};

export default authService;
