import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';




const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
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

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== AUTH =====
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  initAdmin: () => api.post('/auth/init'),
};

// ===== EMPLOYEES =====
export const employeeService = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getDepartments: () => api.get('/employees/departments'),
  getActive: () => api.get('/employees/active'),
  getPending: () => api.get('/employees/pending'),
  approve: (id) => api.put(`/employees/${id}/approve`),
  reject: (id) => api.put(`/employees/${id}/reject`),
  getDistribution: () => api.get('/employees/distribution'),
  getStatusDistribution: () => api.get('/employees/status-distribution'),
  getDeptStats: () => api.get('/employees/dept-stats'),
};

// ===== PAYROLL =====
export const payrollService = {
  generate: (data) => api.post('/payroll/generate', data),
  getById: (id) => api.get(`/payroll/${id}`),
  getByEmployee: (employeeId) => api.get(`/payroll/employee/${employeeId}`),
  getMonthly: (params) => api.get('/payroll/monthly', { params }),
  updateStatus: (id, status) => api.put(`/payroll/${id}/status`, null, { params: { status } }),
  delete: (id) => api.delete(`/payroll/${id}`),
  getDashboardStats: (params) => api.get('/payroll/dashboard', { params }),
  getPending: () => api.get('/payroll/pending'),
  exportPayslip: (id) => api.get(`/payroll/export/payslip/${id}`, { responseType: 'blob' }),
  exportMonthly: (params) => api.get('/payroll/export/monthly', { params, responseType: 'blob' }),
};

// ===== LEAVES =====
export const leaveService = {
  request: (data) => api.post('/leaves/request', data),
  getByEmployee: (empId) => api.get(`/leaves/employee/${empId}`),
  getPending: () => api.get('/leaves/pending'),
  getAll: () => api.get('/leaves'),
  process: (id, data) => api.put(`/leaves/${id}/process`, data),
};

// ===== ANNOUNCEMENTS =====
export const announcementService = {
  getAll: () => api.get('/announcements'),
  getLatest: () => api.get('/announcements/latest'),
  create: (data) => api.post('/announcements', data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

// ===== COMPANY =====
export const companyService = {
  getSettings: () => api.get('/company/settings'),
  updateSettings: (data) => api.put('/company/settings', data),
};

export default api;
