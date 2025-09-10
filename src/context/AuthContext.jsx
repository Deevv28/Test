 import React, { createContext, useContext, useState, useEffect } from 'react';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [apiCallsInProgress, setApiCallsInProgress] = useState(new Set());

  useEffect(() => {
    // Check for stored authentication on app load
    // Use a flag to prevent multiple executions in StrictMode
    let mounted = true;
    
    const checkStoredAuth = () => {
      if (!mounted) return;
      
      try {
        const storedUser = localStorage.getItem('user');
        const storedRole = localStorage.getItem('role');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedRole && storedToken) {
          const parsedUser = JSON.parse(storedUser);
            
          // Validate token is not expired
          try {
            const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (tokenPayload.exp && tokenPayload.exp > currentTime) {
              // Token is valid
              setUser(parsedUser);
              setRole(storedRole);
              setToken(storedToken);
              setIsAuthenticated(true);
              console.log('✅ Authentication restored from localStorage');
            } else {
              // Token expired, clear storage
              console.log('⚠️ Token expired, clearing stored auth');
              localStorage.removeItem('user');
              localStorage.removeItem('role');
              localStorage.removeItem('token');
            }
          } catch (tokenError) {
            console.error('Error parsing token:', tokenError);
            // Clear corrupted token data
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('token');
      } finally {
        if (mounted) {
          setAuthChecked(true);
        }
      }
    };
    
    checkStoredAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  const login = (userData, userRole, authToken) => {
    console.log('🔐 Logging in user:', userData.name, 'Role:', userRole);
    setUser(userData);
    setRole(userRole);
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userRole);
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    setUser(null);
    setRole(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    // Clear data cache on logout
    localStorage.removeItem('restaurants');
    localStorage.removeItem('orders');
    localStorage.removeItem('bookings');
    localStorage.removeItem('lastFetch');
    // Clear API calls in progress
    setApiCallsInProgress(new Set());
  };

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    // Create a unique key for this API call to prevent duplicates
    const callKey = `${endpoint}-${JSON.stringify(options)}`;
    
    // If this exact call is already in progress, return a promise that resolves when it's done
    if (apiCallsInProgress.has(callKey)) {
      console.log(`⏳ API call already in progress, waiting: ${endpoint}`);
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!apiCallsInProgress.has(callKey)) {
            clearInterval(checkInterval);
            // Try to get cached result
            const cachedResult = sessionStorage.getItem(`api-cache-${callKey}`);
            if (cachedResult) {
              resolve(JSON.parse(cachedResult));
            } else {
              resolve({ success: false, message: 'Call completed but no cached result' });
            }
          }
        }, 100);
      });
    }
    
    // Mark this call as in progress
    setApiCallsInProgress(prev => new Set([...prev, callKey]));
    
    setIsLoading(true);
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle network errors gracefully
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Network error occurred' }));
        
        // Only logout on authentication errors, not on other errors
        if (response.status === 401 && data.message && data.message.includes('token')) {
          console.log('🔒 Token expired or invalid, logging out');
          logout();
        }
        throw new Error(data.message || `API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache successful results for a short time to prevent duplicate calls
      if (data.success) {
        sessionStorage.setItem(`api-cache-${callKey}`, JSON.stringify(data));
        setTimeout(() => {
          sessionStorage.removeItem(`api-cache-${callKey}`);
        }, 5000); // Cache for 5 seconds
      }
      
      // Reduce console noise - only log important API calls
      if (!endpoint.includes('/restaurants') || endpoint.includes('/admin/')) {
        console.log(`✅ API call successful: ${endpoint}`, data.success ? 'Success' : 'Failed');
      }
      return data;
    } catch (error) {
      // Handle network connection errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('⚠️ Network connection error - backend may not be running:', endpoint);
        throw new Error('Unable to connect to server. Please ensure the backend is running.');
      }
      
      // Log other errors for debugging
      if (!error.message.includes('fetch') && !error.message.includes('Network')) {
        console.error(`API call error for ${endpoint}:`, error);
      }
      throw error;
    } finally {
      setIsLoading(false);
      // Remove this call from in-progress set
      setApiCallsInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(callKey);
        return newSet;
      });
    }
  };

  const value = {
    user,
    role,
    token,
    isAuthenticated,
    isLoading,
    authChecked,
    login,
    logout,
    apiCall
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};