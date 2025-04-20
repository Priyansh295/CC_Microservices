// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  
  // Configure axios defaults
  axios.defaults.withCredentials = true;
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  
  // Use the correct environment variable names from our build
  console.log('Auth API URL:', process.env.REACT_APP_AUTH_API_URL);
  console.log('RBAC API URL:', process.env.REACT_APP_RBAC_API_URL);
  
  // On port 8080, we need to access the API via localhost on port 80
  axios.defaults.baseURL = 'http://localhost/api/auth';

  // If we have a token, set the authorization header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  // Check if token is expired
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      return decoded.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  };
  
  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (token && isTokenValid(token)) {
        try {
          // Use full path for validate endpoint
          const response = await axios.get('/validate');
          setCurrentUser(response.data.user);
          console.log('User authenticated:', response.data.user);
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      } else if (token) {
        // Token exists but is invalid
        console.log('Token exists but is invalid');
        logout();
      } else {
        console.log('No token found');
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, [token]);
  
  // Login function
  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      const response = await axios.post('/login', { email, password });
      console.log('Login response:', response.data);
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      if (token) {
        await axios.post('/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
    }
  };
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!currentUser && isTokenValid(token);
  };
  
  // Get user role
  const getUserRole = () => {
    return currentUser?.role || null;
  };
  
  const contextValue = {
    currentUser,
    loading,
    login,
    logout,
    isAuthenticated,
    getUserRole,
    api: axios
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};