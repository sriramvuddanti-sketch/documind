import axios from 'axios';

const TOKEN_KEY = 'documind_token';
const USER_KEY = 'documind_user';
const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
};

export const documentApi = {
  list: () => api.get('/documents'),
  get: (id) => api.get(`/documents/${id}`),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: (id, payload) => api.put(`/documents/${id}`, payload),
  remove: (id) => api.delete(`/documents/${id}`),
};

export const getApiError = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.message || fallback;

export { TOKEN_KEY, USER_KEY };
export default api;
