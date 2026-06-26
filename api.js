import axios from 'axios';
import logger from './logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://4.224.186.213/evaluation-service';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 15000;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    logger.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    logger.error('Request error', { error: error.message });
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    logger.debug(`API Response: ${response.status} ${response.config.url} (${duration}ms)`);
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error(`API Error: ${error.response.status}`, {
        url: error.config?.url,
        status: error.response.status,
        message: error.response.data?.message || error.message
      });
    } else if (error.request) {
      logger.error('Network Error', { message: error.message });
    } else {
      logger.error('Request Error', { message: error.message });
    }
    return Promise.reject(error);
  }
);

// API functions
export const notificationAPI = {
  async getNotifications({ limit = 20, page = 1 } = {}) {
    const response = await apiClient.get('/notifications', {
      params: { limit, page }
    });
    return response.data;
  },

  async markNotificationRead(notificationId) {
    try {
      await apiClient.post(`/notifications/${notificationId}/read`);
      return { success: true };
    } catch (error) {
      if (error.response?.status === 404) {
        logger.warn('Mark as read API not available', { notificationId });
        return { success: true };
      }
      throw error;
    }
  }
};

export default apiClient;