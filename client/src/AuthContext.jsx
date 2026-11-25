import { createContext, useContext, useEffect, useState } from 'react';
import api, { getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function register(name, email, password) {
    const res = await api.post('/auth/register', { name, email, password });
    setToken(res.data.token);
    setUser(res.data.user);
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
