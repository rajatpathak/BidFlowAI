import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiEndpoints = {
  // Health check
  health: () => api.get('/health'),
  
  // Authentication
  login: (credentials: { username: string; password: string }) => 
    api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  
  // Tenders
  getTenders: (params?: any) => api.get('/tenders', { params }),
  getTender: (id: string) => api.get(`/tenders/${id}`),
  createTender: (data: any) => api.post('/tenders', data),
  updateTender: (id: string, data: any) => api.put(`/tenders/${id}`, data),
  deleteTender: (id: string) => api.delete(`/tenders/${id}`),
  
  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),
  
  // Users
  getUsers: () => api.get('/users'),
  createUser: (data: any) => api.post('/users', data),
  
  // Company Settings
  getCompanySettings: () => api.get('/settings/company'),
  updateCompanySettings: (data: any) => api.put('/settings/company', data),
  
  // File uploads
  uploadExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  }
};

export default api;