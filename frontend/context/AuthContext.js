import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import api from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('rawaj_access_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    Cookies.set('rawaj_access_token', data.accessToken, { expires: 7 });
    Cookies.set('rawaj_refresh_token', data.refreshToken, { expires: 30 });
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    Cookies.set('rawaj_access_token', data.accessToken, { expires: 7 });
    Cookies.set('rawaj_refresh_token', data.refreshToken, { expires: 30 });
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    Cookies.remove('rawaj_access_token');
    Cookies.remove('rawaj_refresh_token');
    setUser(null);
    router.push('/login');
  };

  // After verifying email (or anything that changes claims), the old JWT still
  // carries stale is_email_verified. Get a fresh token, then refresh user state.
  const refreshSession = async () => {
    const refreshToken = Cookies.get('rawaj_refresh_token');
    if (!refreshToken) return null;
    try {
      const { data } = await api.post('/auth/refresh', { refreshToken });
      Cookies.set('rawaj_access_token', data.accessToken, { expires: 7 });
      const { data: meData } = await api.get('/auth/me');
      setUser(meData.user);
      return meData.user;
    } catch {
      return null;
    }
  };

  const resendVerification = () => api.post('/auth/resend-verification');

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshSession, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
