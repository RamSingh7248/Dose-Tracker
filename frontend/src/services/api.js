import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Intercept to always send token and CSRF token header
api.interceptors.request.use(config => {
  const token = localStorage.getItem('dt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Read XSRF-TOKEN cookie if present
  const xsrfMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (xsrfMatch) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfMatch[1]);
  }
  return config;
});

// ── Automatic Token Refresh Queue Interceptor ──────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401, request hasn't been retried yet, and isn't a login/register/refresh endpoint
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('dt_refresh_token');
        const res = await axios.post(
          (import.meta.env.VITE_API_URL || '/api') + '/auth/refresh',
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        if (res.data?.success && res.data?.token) {
          const newToken = res.data.token;
          localStorage.setItem('dt_token', newToken);
          if (res.data.refreshToken) {
            localStorage.setItem('dt_refresh_token', res.data.refreshToken);
          }
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          isRefreshing = false;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        // Expired session: clear local token storage
        localStorage.removeItem('dt_token');
        localStorage.removeItem('dt_refresh_token');
        localStorage.removeItem('dt_user_cache');
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  exportData: () => api.get('/auth/export-data'),
};

// Medications
export const medicationApi = {
  getAll: (params) => api.get('/medications', { params }),
  getOne: (id) => api.get(`/medications/${id}`),
  create: (data) => api.post('/medications', data),
  update: (id, data) => api.put(`/medications/${id}`, data),
  remove: (id) => api.delete(`/medications/${id}`),
  getRefillAlerts: () => api.get('/medications/refill-alerts'),
};

// Doses
export const doseApi = {
  getAll: (params) => api.get('/doses', { params }),
  log: (data) => api.post('/doses/log', data),
  getStats: (params) => api.get('/doses/stats', { params }),
  remove: (id) => api.delete(`/doses/${id}`),
};

// Members
export const memberApi = {
  getAll: () => api.get('/members'),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  remove: (id) => api.delete(`/members/${id}`),
};

// Reminders
export const reminderApi = {
  getAll: (params) => api.get('/reminders', { params }),
  create: (data) => api.post('/reminders', data),
  update: (id, data) => api.put(`/reminders/${id}`, data),
  snooze: (id, minutes) => api.put(`/reminders/${id}/snooze`, { minutes }),
  remove: (id) => api.delete(`/reminders/${id}`),
  testAlert: (data) => api.post('/reminders/test-alert', data),
};

// Notifications
export const notificationApi = {
  getAll:     (params) => api.get('/notifications', { params }),
  markRead:   (id)     => api.put(`/notifications/${id}/read`),
  markAllRead:()       => api.put('/notifications/read-all'),
  remove:     (id)     => api.delete(`/notifications/${id}`),
  clearAll:   ()       => api.delete('/notifications'),
};

// Doctor
export const doctorApi = {
  getStats:             ()          => api.get('/doctor/stats'),
  getPatients:          (params)    => api.get('/doctor/patients', { params }),
  getPatientDetail:     (id)        => api.get(`/doctor/patients/${id}`),
  getPatientDoses:      (id, params)=> api.get(`/doctor/patients/${id}/doses`, { params }),
  getNotes:             ()          => api.get('/doctor/notes'),
  addNote:              (data)      => api.post('/doctor/notes', data),
  updateNote:           (id, data)  => api.put(`/doctor/notes/${id}`, data),
  deleteNote:           (id)        => api.delete(`/doctor/notes/${id}`),
  generatePrescription: (data)      => api.post('/doctor/generate-prescription', data),
  getAnalytics:         ()          => api.get('/doctor/analytics'),
  getFollowups:         ()          => api.get('/doctor/followups'),
  checkInteractions:    (data)      => api.post('/doctor/check-interactions', data),
  getAppointments:      ()          => api.get('/doctor/appointments'),
  updateAppointmentStatus: (id, data) => api.put(`/doctor/appointments/${id}/status`, data),
  aiClinicalAssistant:  (data)      => api.post('/doctor/ai-assistant', data),
  getEmergencyPatients: ()          => api.get('/doctor/emergency-patients'),
  getDoctorPerformance: ()          => api.get('/doctor/performance'),
  updateProfile:        (data)      => api.put('/doctor/profile', data),
};

// Admin
export const adminApi = {
  getDashboard:     ()              => api.get('/admin/dashboard'),
  getStats:         ()              => api.get('/admin/stats'),
  getReports:       ()              => api.get('/admin/reports'),
  getUsers:         (params)        => api.get('/admin/users', { params }),
  getUserDetail:    (id)            => api.get(`/admin/users/${id}`),
  updateRole:       (id, role)      => api.put(`/admin/users/${id}/role`, { role }),
  updateStatus:     (id, isActive)  => api.put(`/admin/users/${id}/status`, { isActive }),
  assignDoctor:     (id, doctorId)  => api.put(`/admin/users/${id}/assign-doctor`, { doctorId }),
  createDoctor:     (data)          => api.post('/admin/doctors', data),
  deleteUser:       (id)            => api.delete(`/admin/users/${id}`),
  getAppointments:  ()              => api.get('/admin/appointments'),
  getPrescriptions: ()              => api.get('/admin/prescriptions'),
  getAuditLogs:     ()              => api.get('/admin/audit-logs'),
};

// Appointments & Follow-ups
export const appointmentApi = {
  getAll:          (params) => api.get('/appointments', { params }),
  getUpcoming:     ()       => api.get('/appointments/upcoming'),
  getOne:          (id)     => api.get(`/appointments/${id}`),
  create:          (data)   => api.post('/appointments', data),
  scheduleFollowUp:(data)   => api.post('/appointments/follow-up', data),
  update:          (id, data) => api.put(`/appointments/${id}`, data),
  reschedule:      (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  downloadIcs:     (id)     => window.open(`/api/appointments/${id}/ics`, '_blank'),
  remove:          (id)     => api.delete(`/appointments/${id}`),
};

// Adherence Analytics
export const adherenceApi = {
  getWeekly:      () => api.get('/adherence/weekly'),
  getMonthly:     () => api.get('/adherence/monthly'),
  getYearly:      () => api.get('/adherence/yearly'),
  getHealthScore: () => api.get('/adherence/health-score'),
};

// Health Events
export const healthEventApi = {
  getAll:  (params) => api.get('/health-events', { params }),
  create:  (data)   => api.post('/health-events', data),
  update:  (id, data) => api.put(`/health-events/${id}`, data),
  remove:  (id)     => api.delete(`/health-events/${id}`),
};

// Timeline
export const timelineApi = {
  get: (params) => api.get('/timeline', { params }),
};

// Documents (Health Vault)
export const documentApi = {
  getAll:        (params) => api.get('/documents', { params }),
  upload:        (formData) => api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:        (id, data) => api.put(`/documents/${id}`, data),
  remove:        (id)     => api.delete(`/documents/${id}`),
  restore:       (id)     => api.post(`/documents/${id}/restore`),
  uploadVersion: (id, formData) => api.post(`/documents/${id}/version`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  share:         (id)     => api.post(`/documents/${id}/share`),
  unshare:       (id)     => api.post(`/documents/${id}/unshare`),
  getShared:     (token)  => api.get(`/documents/shared/${token}`),
};

// Emergency Card
export const emergencyApi = {
  get:          ()     => api.get('/emergency-card'),
  update:       (data) => api.put('/emergency-card', data),
  getPublic:    (userId) => api.get(`/emergency-card/qr/${userId}`),
};

// Stock Predictions
export const stockApi = {
  getPredictions: () => api.get('/stock/predictions'),
  restock:        (id, quantity) => api.put(`/stock/${id}/restock`, { quantity }),
};

// Prescriptions
export const prescriptionApi = {
  getAll:             (params) => api.get('/prescriptions', { params }),
  getOne:             (id)     => api.get(`/prescriptions/${id}`),
  upload:             (formData) => api.post('/prescriptions/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  saveExtracted:      (id, data) => api.put(`/prescriptions/${id}/extract`, data),
  extractAI:          (id)     => api.post(`/prescriptions/${id}/extract-ai`),
  createMedications:  (id, data) => api.post(`/prescriptions/${id}/create-medications`, data),
  remove:             (id)     => api.delete(`/prescriptions/${id}`),
};

// Enterprise AI Hub
export const aiHubApi = {
  chat:               (data)     => api.post('/ai-hub/chat', data),
  analyzeFile:        (data)     => api.post('/ai-hub/analyze-file', data),
  scanPrescription:   (data)     => api.post('/ai-hub/scan-prescription', data),
  clinicalAssistant:  (data)     => api.post('/ai-hub/clinical-assistant', data),
  getSettings:        ()         => api.get('/ai-hub/settings'),
  updateSettings:     (data)     => api.put('/ai-hub/settings', data),
  getHistory:         ()         => api.get('/ai-hub/history'),
  updateSession:      (id, data) => api.put(`/ai-hub/session/${id}`, data),
  deleteSession:      (id)       => api.delete(`/ai-hub/session/${id}`),
  getAnalytics:       ()         => api.get('/ai-hub/analytics'),
};

// Master Enterprise System Settings
export const systemSettingsApi = {
  getSettings:    ()     => api.get('/system-settings'),
  updateSettings: (data) => api.put('/system-settings', data),
  triggerBackup:  ()     => api.post('/system-settings/backup'),
  resetSettings:  ()     => api.post('/system-settings/reset'),
};

export default api;
