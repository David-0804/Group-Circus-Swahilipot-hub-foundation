import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
});
let accessToken = null;
export const setToken = (t) => { accessToken = t; };
export const clearToken = () => { accessToken = null; };
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
api.interceptors.response.use((r) => r, (err) => {
  if (err.response?.status === 401) { clearToken(); window.location.href = '/login'; }
  return Promise.reject(err);
});
export default api;