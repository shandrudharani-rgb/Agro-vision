import axios from 'axios';

const configuredApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const withoutTrailingSlash = configuredApiUrl.replace(/\/+$/, '');
// Accept either http://host:port or http://host:port/api in .env.
const baseURL = withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agri_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('agri_token');
      localStorage.removeItem('agri_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
