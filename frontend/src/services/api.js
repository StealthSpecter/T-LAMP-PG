import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: async (email, password) => {
    const response = await axiosInstance.post('/api/auth/login', { email, password });
    return response.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await axiosInstance.get('/dashboard/stats');
    return response.data;
  },

  // Transmission Lines
  getTransmissionLines: async (params = {}) => {
    const response = await axiosInstance.get('/transmission-lines/', { params });
    return response.data;
  },

  getTransmissionLineIds: async () => {
    const response = await axiosInstance.get('/transmission-lines/ids');
    return response.data;
  },

  createTransmissionLine: async (data) => {
    const response = await axiosInstance.post('/transmission-lines/', data);
    return response.data;
  },

  updateTransmissionLine: async (id, data) => {
    const response = await axiosInstance.put(`/transmission-lines/${id}`, data);
    return response.data;
  },

  deleteTransmissionLine: async (id) => {
    const response = await axiosInstance.delete(`/transmission-lines/${id}`);
    return response.data;
  },

  // Tower Locations
  getTowerLocations: async (params = {}) => {
    const response = await axiosInstance.get('/tower-locations/', { params });
    return response.data;
  },

  createTowerLocation: async (data) => {
    const response = await axiosInstance.post('/tower-locations/', data);
    return response.data;
  },

  updateTowerLocation: async (id, data) => {
    const response = await axiosInstance.put(`/tower-locations/${id}`, data);
    return response.data;
  },

  deleteTowerLocation: async (id) => {
    const response = await axiosInstance.delete(`/tower-locations/${id}`);
    return response.data;
  },

  // Tripping Incidents
  getTrippingIncidents: async (params = {}) => {
    const response = await axiosInstance.get('/tripping-incidents/', { params });
    return response.data;
  },

  createTrippingIncident: async (data) => {
    const response = await axiosInstance.post('/tripping-incidents/', data);
    return response.data;
  },

  updateTrippingIncident: async (id, data) => {
    const response = await axiosInstance.put(`/tripping-incidents/${id}`, data);
    return response.data;
  },

  deleteTrippingIncident: async (id) => {
    const response = await axiosInstance.delete(`/tripping-incidents/${id}`);
    return response.data;
  },

  // States
  getStates: async () => {
    const response = await axiosInstance.get('/states/');
    return response.data;
  },

  // Maintenance Offices
  getMaintenanceOffices: async () => {
    const response = await axiosInstance.get('/maintenance-offices/');
    return response.data;
  },

  // AI Endpoints
  getAIPredictions: async () => {
    const response = await axiosInstance.get('/api/ai/predictive-maintenance');
    return response.data;
  },

  trainAIModel: async () => {
    const response = await axiosInstance.post('/api/ai/train-model');
    return response.data;
  },

  getAIModelMetrics: async () => {
    const response = await axiosInstance.get('/api/ai/model-metrics');
    return response.data;
  },

  // Generic methods for flexibility
  get: async (url) => {
    const response = await axiosInstance.get(url);
    return response.data;
  },

  post: async (url, data) => {
    const response = await axiosInstance.post(url, data);
    return response.data;
  },

  put: async (url, data) => {
    const response = await axiosInstance.put(url, data);
    return response.data;
  },

  delete: async (url) => {
    const response = await axiosInstance.delete(url);
    return response.data;
  },
};

export default api;