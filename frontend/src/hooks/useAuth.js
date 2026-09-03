"use client";
import { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { toast } from 'react-toastify';

const initialAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('househunt_token', response.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      toast.success(`Welcome back, ${response.user.firstName}`);
      navigate('/');
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.post('/auth/register', userData);
      localStorage.setItem('househunt_token', response.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      toast.success('Account created successfully');
      navigate('/');
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore logout API errors
    } finally {
      localStorage.removeItem('househunt_token');
      dispatch({ type: 'LOGOUT' });
      toast.success('Signed out successfully');
      navigate('/');
    }
  };

  const getCurrentUser = async () => {
    if (!localStorage.getItem('househunt_token')) {
      dispatch({ type: 'SET_USER', payload: null });
      return null;
    }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.get('/auth/me');
      dispatch({ type: 'SET_USER', payload: response.user });
      return response.user;
    } catch (error) {
      console.error('Get current user error:', error);
      dispatch({ type: 'SET_USER', payload: null });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await apiClient.put('/auth/me', userData);
      dispatch({ type: 'SET_USER', payload: response.user });
      toast.success('Profile updated successfully');
      return response.user;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      await apiClient.delete('/auth/me');
      localStorage.removeItem('househunt_token');
      dispatch({ type: 'LOGOUT' });
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const refreshUser = async () => {
    return await getCurrentUser();
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const isAuthorized = (requiredRole = 'user') => {
    if (!state.isAuthenticated || !state.user) return false;
    if (requiredRole === 'admin') {
      return state.user.role === 'admin';
    }
    return true;
  };

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    getCurrentUser,
    updateProfile,
    deleteAccount,
    refreshUser,
    clearError,
    isAuthorized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AuthContext = createContext(undefined);

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };