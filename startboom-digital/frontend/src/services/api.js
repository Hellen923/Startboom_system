import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto logout on 401 - token expired or invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('tenantName');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  registerAgent: (data) => api.post('/users', data),
  resendOTP: (id) => api.post(`/users/${id}/resend-otp`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (id, data) => api.put(`/users/${id}`, data),
  setTargets: (id, data) => api.put(`/users/${id}/targets`, data),
};



// Clients API
export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  addInteraction: (id, data) => api.post(`/clients/${id}/interactions`, data),
  addTask: (id, data) => api.post(`/clients/${id}/tasks`, data),
  sendEmail: (id, data) => api.post(`/clients/${id}/send-email`, data),
  getNotes: () => api.get('/clients/notes/my'),
};

// Deals API
export const dealsAPI = {
  getAll: (params) => api.get('/deals', { params }),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  updateStatus: (id, status) => api.patch(`/deals/${id}/status`, { status }),
  delete: (id) => api.delete(`/deals/${id}`),
  getStats: () => api.get('/deals/stats'),
};

// Sales API
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  getStats: (params) => api.get('/sales/stats', { params }),
  getSummary: (params) => api.get('/sales/summary', { params }),
  recordPayment: (id, data) => api.post(`/sales/${id}/payment`, data),
  getRecent: (params) => api.get('/sales/recent/list', { params }),
  addTask: (id, data) => api.post(`/sales/${id}/tasks`, data),
  updateTask: (id, taskId, data) => api.put(`/sales/${id}/tasks/${taskId}`, data),
  deleteTask: (id, taskId) => api.delete(`/sales/${id}/tasks/${taskId}`),
};

// Schedules API
export const schedulesAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  getStats: () => api.get('/notifications/stats/summary'),
};

// Performance API
export const performanceAPI = {
  getAgentStats: (agentId) => api.get(`/performance/agent/${agentId}`),
  getOverall: () => api.get('/performance/overall'),
  getRankings: () => api.get('/performance/rankings'),
  recalculate: () => api.post('/performance/recalculate-ratings'),
};

// Reports API
export const reportsAPI = {
  getAnalytics: (params) => api.get('/reports/analytics', { params }),
  shareReport: (data) => api.post('/reports/share', data),
  importData: (formData) => api.post('/reports/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Tenants API (Super Admin only)
export const tenantsAPI = {
  getAll: () => api.get('/tenants'),
  getCommandCenter: () => api.get('/tenants/command-center/overview'),
  getActivity: (params) => api.get('/tenants/activity/live', { params }),
  getLoginForensics: (params) => api.get('/tenants/login-forensics', { params }),
  createSecurityBlock: (data) => api.post('/tenants/security-blocks', data),
  updateSecurityBlock: (id, data) => api.patch(`/tenants/security-blocks/${id}`, data),
  getProfile: (id) => api.get(`/tenants/${id}/profile`),
  getImpact: (id) => api.get(`/tenants/${id}/impact`),
  control: (id, data) => api.patch(`/tenants/${id}/control`, data),
  updateFeatures: (id, data) => api.patch(`/tenants/${id}/features`, data),
  updateSubscription: (id, data) => api.patch(`/tenants/${id}/subscription`, data),
  impersonateAdmin: (id) => api.post(`/tenants/${id}/impersonate-admin`),
  sendAnnouncement: (data) => api.post('/tenants/communications/announce', data),
  getById: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tenants/${id}/status`, { status }),
  delete: (id) => api.delete(`/tenants/${id}`),
  getStats: (id) => api.get(`/tenants/${id}/stats`),
  updateBranding: (data) => api.patch('/tenants/branding/logo', data),
  // Onboarding
  getOnboarding: () => api.get('/tenants/onboarding'),
  saveOnboarding: (data) => api.patch('/tenants/onboarding', data),
};

// Audit Logs API
export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getById: (id) => api.get(`/audit-logs/${id}`),
  getStats: () => api.get('/audit-logs/stats/summary'),
};

// Meetings API
export const meetingsAPI = {
  getAll: (params) => api.get('/meetings', { params }),
  getById: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
};

// Stock API
export const stockAPI = {
  getAll: (params) => api.get('/stock', { params }),
  getById: (id) => api.get(`/stock/${id}`),
  create: (data) => api.post('/stock', data),
  update: (id, data) => api.put(`/stock/${id}`, data),
  delete: (id) => api.delete(`/stock/${id}`),
  getLowStock: () => api.get('/stock/alerts'),
};

// OTP API
export const otpAPI = {
  generate: (data) => api.post('/otp/send', data),
  verify: (data) => api.post('/otp/verify', data),
};

// Upload API
export const uploadAPI = {
  uploadFile: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },
};

// Roles API
export const rolesAPI = {
  getAll: () => api.get('/roles'),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};

// Email Templates API
export const emailTemplatesAPI = {
  getAll: () => api.get('/email-templates'),
  create: (data) => api.post('/email-templates', data),
  update: (id, data) => api.put(`/email-templates/${id}`, data),
  delete: (id) => api.delete(`/email-templates/${id}`),
};

// Scheduled Exports API
export const scheduledExportsAPI = {
  getAll: () => api.get('/scheduled-exports'),
  create: (data) => api.post('/scheduled-exports', data),
  update: (id, data) => api.patch(`/scheduled-exports/${id}`, data),
  runNow: (id) => api.post(`/scheduled-exports/${id}/run-now`),
  delete: (id) => api.delete(`/scheduled-exports/${id}`),
};

// Predictive Analytics API
export const predictiveAnalyticsAPI = {
  getSalesForecast: (params) => api.get('/predictive-analytics/sales-forecast', { params }),
  getLeadScoring: () => api.get('/predictive-analytics/lead-scoring'),
  getPerformancePrediction: (agentId) => api.get(`/predictive-analytics/performance-prediction/${agentId}`),
  getChurnPrediction: () => api.get('/predictive-analytics/churn-prediction'),
};

// Dashboards API
export const dashboardsAPI = {
  getAll: () => api.get('/dashboards'),
  getById: (id) => api.get(`/dashboards/${id}`),
  create: (data) => api.post('/dashboards', data),
  update: (id, data) => api.put(`/dashboards/${id}`, data),
  delete: (id) => api.delete(`/dashboards/${id}`),
  getKPIs: (id) => api.get(`/dashboards/${id}/kpis`),
};

// Issues API
export const issuesAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post('/issues', data),
  update: (id, data) => api.patch(`/issues/${id}`, data),
  updateStatus: (id, data) => api.patch(`/issues/${id}/status`, data),
  delete: (id) => api.delete(`/issues/${id}`),
};

// Default export
export default api;
