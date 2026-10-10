import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  // Sync user state on global auth error (handled in api interceptor)
  useEffect(() => {
    const handleAuthError = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { token, data } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(token);
      setUser(data.user);
      
      toast.success('Successfully logged in!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.pendingVerification) {
        toast.success(response.data.message || 'Application submitted for verification!');
        return { success: true, pendingVerification: true, data: response.data.data };
      }

      const { token, data } = response.data;
      if (token && data?.user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(token);
        setUser(data.user);
        toast.success('Registration successful!');
        return { success: true, pendingVerification: false, data: data.user };
      }

      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully.');
  };

  // Currently we rely on localStorage for initial user data.
  // In a robust app, we'd also hit /auth/me on mount to verify token is still valid.
  // We'll skip hitting it on every reload for now to reduce requests, 
  // relying on the 401 interceptor to catch expired tokens.

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
