import { createContext, useEffect, useState } from 'react';
import { api } from '../api';

export const AuthContext = createContext(null);

const normalize = (u) => ({ ...u, _id: u._id || u.id });

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api('/auth/me', { token })
      .then((d) => {
        if (!cancelled) setUser(normalize(d.user));
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const saveSession = (data) => {
    const u = normalize(data.user);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(u);
    return u;
  };

  const login = async (email, password) =>
    saveSession(await api('/auth/login', { method: 'POST', body: { email, password } }));

  const register = async (form) =>
    saveSession(await api('/auth/register', { method: 'POST', body: form }));

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}