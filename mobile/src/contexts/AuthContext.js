import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check for token in all possible locations
        const [userToken, riderToken, legacyToken] = await AsyncStorage.multiGet([
          'userToken',
          'riderToken',
          'token' // Legacy key
        ]);
        
        const token = userToken[1] || riderToken[1] || legacyToken[1];
        
        if (token) {
          // Get user data from storage
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            
            // Ensure token is stored in the correct location
            const tokenKey = parsedUser.role === 'rider' ? 'riderToken' : 'userToken';
            await AsyncStorage.setItem(tokenKey, token);
            
            // Remove token from legacy location if it exists there
            if (legacyToken[1]) {
              await AsyncStorage.removeItem('token');
            }
          }
        }
      } catch (error) {
        console.error('Error loading user', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting login with email:', email);
      
      // Ensure the API URL is correctly formatted
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const loginUrl = `${baseUrl}/auth/login`;
      
      console.log('Login URL:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
        console.log('Login response:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        const text = await response.text();
        console.error('Raw response:', text);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        const errorMessage = data?.message || `Login failed with status ${response.status}`;
        console.error('Login error:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.token) {
        console.error('No token received in response');
        throw new Error('Authentication failed: No token received');
      }

      // Determine user role and set appropriate token key
      const userRole = data.role || data.user?.role || 'customer';
      const tokenKey = userRole === 'rider' ? 'riderToken' : 'userToken';
      
      // Save token and user data
      const userData = {
        id: data.id || data.user?.id,
        email: data.email || data.user?.email,
        firstName: data.firstName || data.user?.firstName || '',
        lastName: data.lastName || data.user?.lastName || '',
        role: userRole,
      };

      await AsyncStorage.multiSet([
        [tokenKey, data.token],
        ['user', JSON.stringify(userData)]
      ]);
      
      // Clear any legacy token
      await AsyncStorage.removeItem('token');
      
      setUser(userData);
      console.log('Login successful, user data:', userData);
      
      // Return user data including role for navigation handling
      return { 
        success: true, 
        user: userData,
        role: userRole
      };
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Remove any trailing slashes from API_URL to prevent double slashes
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Auto-login after registration
      await login(userData.email, userData.password);
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear all possible authentication data
      await AsyncStorage.multiRemove([
        'token',           // Legacy token
        'userToken',       // User token
        'riderToken',      // Rider token
        'user',            // User data
        'rider'            // Rider data
      ]);
      
      // Reset user state
      setUser(null);
      setError(null);
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error; // Re-throw to allow error handling in components
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}>
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

export default AuthContext;
