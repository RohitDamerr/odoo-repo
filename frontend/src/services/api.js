import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/**
 * Fetch a file download via axios (includes auth token) and trigger
 * a browser download. Use this for authenticated CSV/Excel/PDF exports.
 *
 * @param {string} url   — API path relative to baseURL (e.g. '/reports/fuel/summary')
 * @param {object} params — Query params (format, startDate, endDate, vehicle, etc.)
 * @param {string} filename — Suggested download filename
 */
export async function downloadFile(url, params, filename) {
  const res = await api.get(url, { params, responseType: 'blob' });
  const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export default api;
