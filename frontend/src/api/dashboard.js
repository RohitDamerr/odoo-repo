import api from '../services/api';

export const fetchKPIs = (params) =>
  api.get('/dashboard/kpis', { params }).then(r => r.data.data);

export const fetchReport = (path, params) =>
  api.get(`/reports/${path}`, { params }).then(r => r.data.data);

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (data) =>
  api.post('/auth/register', data);
