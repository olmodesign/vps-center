import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = 'Bearer ' + accessToken;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response, async (error) => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }
    try {
      const response = await axios.post(API_URL + '/auth/refresh', { refreshToken });
      const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data;
      setTokens(newAccess, newRefresh);
      originalRequest.headers.Authorization = 'Bearer ' + newAccess;
      return api(originalRequest);
    } catch {
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }
  }
  return Promise.reject(error);
});

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  loginWithTotp: (email, password, totpCode) => api.post('/auth/login/2fa', { email, password, totpCode }),
  logout: () => api.post('/auth/logout', { refreshToken }),
  refresh: () => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (data) => api.post('/auth/2fa/enable', data),
  disable2FA: () => api.post('/auth/2fa/disable'),
  changePassword: (data) => api.post('/auth/password/change', data),
};

export const projectsApi = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get('/projects/' + id),
  getStats: () => api.get('/projects/stats'),
  getAllPorts: () => api.get('/projects/ports'),
  checkPort: (port, protocol) => api.get('/projects/ports/check/' + port, { params: { protocol: protocol || 'tcp' } }),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put('/projects/' + id, data),
  delete: (id) => api.delete('/projects/' + id),
  addPort: (projectId, data) => api.post('/projects/' + projectId + '/ports', data),
  removePort: (projectId, portId) => api.delete('/projects/' + projectId + '/ports/' + portId),
};

export const containersApi = {
  // Contenedores
  getAll: (all) => api.get('/containers', { params: { all: all !== false } }),
  getById: (id) => api.get('/containers/' + id),
  getStats: (id) => api.get('/containers/' + id + '/stats'),
  getLogs: (id, params) => api.get('/containers/' + id + '/logs', { params }),
  start: (id) => api.post('/containers/' + id + '/start'),
  stop: (id) => api.post('/containers/' + id + '/stop'),
  restart: (id) => api.post('/containers/' + id + '/restart'),
  
  // Sistema
  getSystemInfo: () => api.get('/containers/system'),
  getImages: () => api.get('/containers/images'),
  getNetworks: () => api.get('/containers/networks'),
  getVolumes: () => api.get('/containers/volumes'),
  
  // Detección automática
  detectProjects: () => api.get('/containers/detect-projects'),
  getAllPorts: () => api.get('/containers/ports'),
  
  // Proyectos detectados
  getProjectDetail: (name) => api.get('/containers/projects/' + encodeURIComponent(name)),
  getProjectDatabases: (name) => api.get('/containers/projects/' + encodeURIComponent(name) + '/databases'),
  restartProject: (name) => api.post('/containers/projects/' + encodeURIComponent(name) + '/restart'),
  stopProject: (name) => api.post('/containers/projects/' + encodeURIComponent(name) + '/stop'),
  startProject: (name) => api.post('/containers/projects/' + encodeURIComponent(name) + '/start'),
  
  // Base de datos
  getDatabaseTables: (containerId, database, user) => 
    api.get('/containers/db/' + containerId + '/tables', { params: { database, user } }),
  getDatabaseSize: (containerId, database, user) => 
    api.get('/containers/db/' + containerId + '/size', { params: { database, user } }),
  queryDatabase: (containerId, data) => 
    api.post('/containers/db/' + containerId + '/query', data),
  backupDatabase: (containerId, data) => 
    api.post('/containers/db/' + containerId + '/backup', data),
  restoreDatabase: (containerId, data) => 
    api.post('/containers/db/' + containerId + '/restore', data),
  
  // Backups
  listBackups: (project) => api.get('/containers/backups', { params: { project } }),
  downloadBackup: (filename) => api.get('/containers/backups/' + encodeURIComponent(filename) + '/download', { responseType: 'blob' }),
  deleteBackup: (filename) => api.delete('/containers/backups/' + encodeURIComponent(filename)),
};

export default api;
