import { create } from 'zustand';
import { authApi, setTokens, clearTokens } from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  requiresTwoFactor: false,
  pendingCredentials: null,

  initialize: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const response = await authApi.me();
      set({ user: response.data.data, isAuthenticated: true, isLoading: false, error: null });
    } catch (e) {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      if (response.data.requiresTwoFactor) {
        set({ requiresTwoFactor: true, pendingCredentials: { email, password }, isLoading: false });
        return { requiresTwoFactor: true };
      }
      const { accessToken, refreshToken, user } = response.data.data;
      setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false, requiresTwoFactor: false, pendingCredentials: null });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  loginWithTotp: async (totpCode) => {
    const { pendingCredentials } = get();
    if (!pendingCredentials) {
      set({ error: 'No pending login' });
      return { error: 'No pending login' };
    }
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.loginWithTotp(pendingCredentials.email, pendingCredentials.password, totpCode);
      const { accessToken, refreshToken, user } = response.data.data;
      setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false, requiresTwoFactor: false, pendingCredentials: null });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || '2FA failed';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  cancelTwoFactor: () => set({ requiresTwoFactor: false, pendingCredentials: null, error: null }),

  logout: async () => {
    try { await authApi.logout(); } catch (e) {}
    clearTokens();
    set({ user: null, isAuthenticated: false, requiresTwoFactor: false, pendingCredentials: null, error: null });
  },

  setupTotp: async () => {
    try {
      const response = await authApi.setupTotp();
      return { success: true, data: response.data.data };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed' };
    }
  },

  enableTotp: async (totpCode) => {
    try {
      await authApi.enableTotp(totpCode);
      set((state) => ({ user: { ...state.user, totpEnabled: true } }));
      return { success: true };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed' };
    }
  },

  disableTotp: async (password, totpCode) => {
    try {
      await authApi.disableTotp(password, totpCode);
      set((state) => ({ user: { ...state.user, totpEnabled: false } }));
      return { success: true };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed' };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      await authApi.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed' };
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
