import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authApi, getApiError, TOKEN_KEY, USER_KEY } from '../lib/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(token && !user));

  useEffect(() => {
    if (!token || user) { setLoading(false); return undefined; }
    let active = true;
    authApi.me().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }).catch(() => {
      if (!active) return;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, user]);

  const completeAuth = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (payload) => {
    try { const { data } = await authApi.register(payload); completeAuth(data); return data; }
    catch (error) { throw new Error(getApiError(error, 'Unable to create your account.')); }
  };

  const login = async (payload) => {
    try { const { data } = await authApi.login(payload); completeAuth(data); return data; }
    catch (error) { throw new Error(getApiError(error, 'Unable to sign you in.')); }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(token), register, login, logout }),
    [token, user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
