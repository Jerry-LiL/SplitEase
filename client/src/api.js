import axios from 'axios';

const TOKEN_KEY = 'spliteaseToken';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Attach the saved login token to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (err) => {
    const url = (err.config && err.config.url) || '';
    const isLogin = url.indexOf('/auth/login') !== -1;
    if (err.response && err.response.status === 401 && !isLogin) {
      setToken(null);
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export function getErrorMessage(err) {
  if (err.response && err.response.data && err.response.data.message) {
    return err.response.data.message;
  }
  return 'Could not reach the server';
}

export default api;
