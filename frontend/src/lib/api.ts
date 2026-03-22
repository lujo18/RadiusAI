import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login?error=unauthorized';
    }
    return Promise.reject(error);
  }
);

export default api;

// API service methods
export const authService = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  signup: (name: string, email: string, password: string) =>
    api.post('/api/auth/signup', { name, email, password }),
  
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  },
};

export const contentService = {
  generateWeek: (styleGuide: string) =>
    api.post('/api/content/generate', { styleGuide }),
  
  getScheduledPosts: () =>
    api.get('/api/content/scheduled'),
  
  getAnalytics: (timeframe: string = 'week') =>
    api.get(`/api/analytics?timeframe=${timeframe}`),
  
  updateStyleGuide: (styleGuide: string) =>
    api.put('/api/style-guide', { styleGuide }),
  
  getStyleGuide: () =>
    api.get('/api/style-guide'),
};
