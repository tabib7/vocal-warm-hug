
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

// Create auth context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Check if user is already logged in from localStorage and set Axios header
  useEffect(() => {
    const storedUser = localStorage.getItem('ems_user');
    axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Set base URL for Axios
    console.log('Axios base URL set to:', axios.defaults.baseURL);

    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      axios.defaults.headers.common['x-auth-token'] = user.token; // Set token for Axios
      console.log('User loaded from localStorage and Axios header set:', user);
    } else {
      console.log('No user found in localStorage');
      delete axios.defaults.headers.common['x-auth-token']; // Ensure no stale token
    }
    setLoading(false);
  }, []);
  
  // Login function
  const login = async (email, password) => {
    try {
      console.log('Login attempt:', { email, password: '***' });
      
      // Ensure baseURL is set
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      console.log('Using API base URL:', baseURL);
      
      // Make the login request with full URL and timeout
      const response = await axios({
        method: 'post',
        url: `${baseURL}/api/auth/login`,
        data: { email, password },
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('Login response status:', response.status);
      
      const user = response.data;
      
      if (!user || !user.token) {
        console.error('Invalid user data received:', user);
        toast.error('Invalid response from server');
        return false;
      }
      
      console.log('Setting current user:', user);
      setCurrentUser(user);
      localStorage.setItem('ems_user', JSON.stringify(user));
      axios.defaults.headers.common['x-auth-token'] = user.token; // Set token for Axios
      toast.success('Login successful');
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      let errorMessage = 'Login failed';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection.';
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.msg || `Server responded with status ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      toast.error(errorMessage);
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    console.log('Logging out user');
    setCurrentUser(null);
    localStorage.removeItem('ems_user');
    delete axios.defaults.headers.common['x-auth-token']; // Remove token from Axios
    toast.info('You have been logged out');
    navigate('/');
  };
  
  // Check if user has specific role
  const hasRole = (roles) => {
    if (!currentUser) return false;
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    return currentUser.role === roles;
  };
  
  const value = {
    currentUser,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated: !!currentUser
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
