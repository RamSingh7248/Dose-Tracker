import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from "../services/api";

const AuthContext = createContext(null);

const THEME_MAP = {
  purple: {
    accent: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
  },
  cyan: {
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  },
  emerald: {
    accent: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  rose: {
    accent: '#f43f5e',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
  },
  amber: {
    accent: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  },
};

const FONT_MAP = {
  normal: '14px',
  large: '16px',
  xlarge: '18px',
};

// Cache TTL: re-validate /auth/me after 5 minutes
const USER_CACHE_TTL_MS = 5 * 60 * 1000;
const USER_CACHE_KEY = 'dt_user_cache';

export const applyThemeToDocument = (themeColor = 'purple', fontSize = 'normal', language = 'en') => {
  try {
    const theme = THEME_MAP[themeColor] || THEME_MAP.purple;
    const size = FONT_MAP[fontSize] || '14px';

    document.documentElement.style.setProperty('--accent-purple', theme.accent);
    document.documentElement.style.setProperty('--gradient-primary', theme.gradient);
    document.documentElement.style.fontSize = size;
    document.documentElement.lang = language;
  } catch (e) {
    console.warn('Theme apply error:', e);
  }
};

/**
 * Read user from localStorage cache.
 * Returns null if missing, expired, or corrupt.
 */
function readUserCache() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const { user, ts } = JSON.parse(raw);
    if (Date.now() - ts > USER_CACHE_TTL_MS) return null; // expired
    return user;
  } catch {
    return null;
  }
}

function writeUserCache(user) {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ user, ts: Date.now() }));
  } catch { /* storage full — ignore */ }
}

function clearUserCache() {
  localStorage.removeItem(USER_CACHE_KEY);
}

export const AuthProvider = ({ children }) => {
  const token = localStorage.getItem('dt_token');

  // Bootstrap from cache so the UI renders instantly without a network round-trip.
  const cachedUser = token ? readUserCache() : null;

  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser && !!token);
  const fetchedRef = useRef(false);

  // Set axios default header on mount
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Only hit /auth/me if there's no valid cache
      if (!cachedUser && !fetchedRef.current) {
        fetchedRef.current = true;
        fetchMe();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply Theme, Font Size, and Language whenever user profile updates
  useEffect(() => {
    if (user) {
      applyThemeToDocument(user.themeColor, user.fontSize, user.language);
    }
  }, [user]);

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      const fetchedUser = res.data.user;
      setUser(fetchedUser);
      writeUserCache(fetchedUser);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, portal) => {
    const res = await api.post('/auth/login', { email, password, portal });
    const { token: newToken, refreshToken: newRefreshToken, user: newUser } = res.data;
    localStorage.setItem('dt_token', newToken);
    if (newRefreshToken) localStorage.setItem('dt_refresh_token', newRefreshToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(newUser);
    writeUserCache(newUser);
    return res.data;
  };

  const register = async (name, email, password, role = 'patient', extraData = {}) => {
    const payload = {
      name,
      email,
      password,
      role,
      specialization: extraData.specialization || '',
      hospital: extraData.hospital || '',
      licenseNumber: extraData.licenseNumber || '',
    };
    const res = await api.post('/auth/register', payload);
    const { token: newToken, refreshToken: newRefreshToken, user: newUser } = res.data;
    localStorage.setItem('dt_token', newToken);
    if (newRefreshToken) localStorage.setItem('dt_refresh_token', newRefreshToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(newUser);
    writeUserCache(newUser);
    return res.data;
  };

  const googleLogin = async (googleData) => {
    const res = await api.post('/auth/google', googleData);
    const { token: newToken, refreshToken: newRefreshToken, user: newUser } = res.data;
    localStorage.setItem('dt_token', newToken);
    if (newRefreshToken) localStorage.setItem('dt_refresh_token', newRefreshToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(newUser);
    writeUserCache(newUser);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore logout network failure */ }
    localStorage.removeItem('dt_token');
    localStorage.removeItem('dt_refresh_token');
    clearUserCache();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    // Reset to default purple
    applyThemeToDocument('purple', 'normal', 'en');
  };

  const updateUser = (updated) => {
    setUser(prev => {
      const next = { ...prev, ...updated };
      writeUserCache(next); // keep cache in sync after profile updates
      return next;
    });
    // Also invalidate server cache by triggering a background refresh
    setTimeout(() => { clearUserCache(); }, USER_CACHE_TTL_MS);
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, googleLogin, logout, updateUser,
      isAdmin: user?.role === 'ROLE_ADMIN' || user?.role === 'admin',
      isDoctor: user?.role === 'ROLE_DOCTOR' || user?.role === 'doctor',
      isPatient: user?.role === 'ROLE_PATIENT' || user?.role === 'patient' || !user?.role,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
