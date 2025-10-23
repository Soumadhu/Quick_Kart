import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://YOUR_SERVER_IP:5000/api/auth';

// Store user data in AsyncStorage
const storeUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    await AsyncStorage.setItem('authToken', userData.token);
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

// Get stored user data
const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Check if user is logged in
export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return !!token;
};

// User registration
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        firstName: userData.name.split(' ')[0],
        lastName: userData.name.split(' ')[1] || '',
        phone: userData.phone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    await storeUserData(data);
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// User login
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    await storeUserData(data);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// User logout
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('authToken');
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// Get user profile
export const getProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return null;

    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export default {
  register,
  login,
  logout,
  getProfile,
  isAuthenticated,
  getUserData,
};
