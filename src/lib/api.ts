import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://palmconnect.co/api',
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  // Get token from localStorage (set during login)
  const token = localStorage.getItem('authToken');
  
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  
  return config;
});

export default api;
