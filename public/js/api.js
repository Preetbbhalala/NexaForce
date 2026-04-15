/* ================================================================
   NexaForce v2 — api.js
   Central API service + auth helpers
   ================================================================ */

'use strict';

const BASE = 'http://localhost:5000/api';

const Auth = {
  getToken: ()  => localStorage.getItem('nf_token'),
  setToken: (t) => localStorage.setItem('nf_token', t),
  getUser:  ()  => JSON.parse(localStorage.getItem('nf_user') || 'null'),
  setUser:  (u) => localStorage.setItem('nf_user', JSON.stringify(u)),
  clear:    ()  => {
    localStorage.removeItem('nf_token');
    localStorage.removeItem('nf_user');
  },
  isAuth:   ()  => !!localStorage.getItem('nf_token'),
  guard:    ()  => {
    if (!Auth.isAuth()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },
};

async function req(path, opts = {}) {
  const token = Auth.getToken();
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...opts,
  });

  if (res.status === 401) {
    Auth.clear();
    window.location.href = 'index.html';
    return;
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}

const API = {
  // Auth
  login:          (data)      => req('/auth/login',           { method: 'POST', body: JSON.stringify(data) }),
  getMe:          ()          => req('/auth/me'),
  changePassword: (data)      => req('/auth/change-password', { method: 'PUT',  body: JSON.stringify(data) }),

  // Employees
  getEmployees:   (params = {}) => req('/employees?' + new URLSearchParams(params)),
  getEmployee:    (id)          => req('/employees/' + id),
  createEmployee: (data)        => req('/employees',       { method: 'POST',   body: JSON.stringify(data) }),
  updateEmployee: (id, data)    => req('/employees/' + id, { method: 'PUT',    body: JSON.stringify(data) }),
  deleteEmployee: (id)          => req('/employees/' + id, { method: 'DELETE' }),
  getStats:       ()            => req('/employees/stats'),

  // Analytics
  getAnalytics: () => req('/analytics'),

  // News
  getNews: (p = {}) => req('/news?' + new URLSearchParams(p)),
};
