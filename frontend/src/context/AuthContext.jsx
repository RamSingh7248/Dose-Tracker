import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dt_token') || null);
  const [loading, setLoading] = useState(true);

  // Set axios default header & fetch user
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Apply Theme, Font Size, and Language whenever user profile updates
  useEffect(() => {
    if (user) {
      applyThemeToDocument(user.themeColor, user.fontSize, user.language);
    }
  }, [user]);

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('dt_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
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
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('dt_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  const googleLogin = async (googleData) => {
    const res = await api.post('/auth/google', googleData);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('dt_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('dt_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    // Reset to default purple
    applyThemeToDocument('purple', 'normal', 'en');
  };

  const updateUser = (updated) => setUser(prev => ({ ...prev, ...updated }));

  return (
    <AuthContext.Provider value={{
      user, token, loading,
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
