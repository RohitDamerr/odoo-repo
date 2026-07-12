import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user: u, tokens } = data.data;
      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(u));
      setToken(tokens.accessToken);
      setUser(u);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async ({ name, email, password, role }) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      const { user: u, tokens } = data.data;
      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(u));
      setToken(tokens.accessToken);
      setUser(u);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';
  const isFleetManager = user?.role === 'fleet_manager';
  const isSafetyOfficer = user?.role === 'safety_officer';
  const isFinancialAnalyst = user?.role === 'financial_analyst';

  return (
    <AuthContext.Provider value={{
      user, token, loading, error, login, register, logout,
      isAuthenticated, isAdmin, isFleetManager, isSafetyOfficer, isFinancialAnalyst,
      setError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
