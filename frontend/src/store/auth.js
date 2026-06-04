import { create } from 'zustand';
import { setToken, clearToken } from '../api/axios';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (userData, token, refresh) => {
    setToken(token);
    localStorage.setItem('refresh', refresh);
    set({ user: userData, token, isAuthenticated: true });
  },
  logout: () => {
    clearToken();
    localStorage.removeItem('refresh');
    set({ user: null, token: null, isAuthenticated: false });
  },
  updateUser: (userData) => set({ user: userData }),
}));