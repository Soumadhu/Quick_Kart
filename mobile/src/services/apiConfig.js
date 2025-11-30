import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Environment configuration
const ENV = 'development'; // Change to 'production' for production builds

// Default server configuration
const DEFAULT_PORT = '5000';
// Use the computer's IP address for development
const DEFAULT_IP = '192.168.0.103'; // Your computer's IP address
const HARDCODED_IP = DEFAULT_IP;
const HARDCODED_PORT = DEFAULT_PORT;

// Ensure we have a valid IP and port
const getValidServerInfo = () => {
  const serverInfo = getMetroServerInfo();
  return {
    ip: serverInfo.ip || HARDCODED_IP,
    port: serverInfo.port || HARDCODED_PORT
  };
};

// Get configuration from localStorage if available
const getStoredConfig = () => {
  // In React Native, we can use AsyncStorage
  if (global.AsyncStorage) {
    try {
      // This will be handled by AsyncStorage in React Native
      return null; // Will be handled by the async function below
    } catch (e) {
      console.warn('Error reading from AsyncStorage:', e);
    }
  }
  
  // In web environment
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const config = window.localStorage.getItem('quickkart_api_config');
      if (config) {
        console.log('[API] Using config from localStorage:', config);
        return JSON.parse(config);
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
  }
  
  return null;
};

// Function to update the configuration (call this from the HTML tool)
if (typeof window !== 'undefined') {
  window.updateApiConfig = (ip, port = '5000') => {
    try {
      const config = { ip, port };
      if (window.localStorage) {
        window.localStorage.setItem('quickkart_api_config', JSON.stringify(config));
        console.log('[API] Updated config in localStorage:', config);
        
        // Also update any running instances
        if (window.__QUICKKART_API_CONFIG) {
          window.__QUICKKART_API_CONFIG.ip = ip;
          window.__QUICKKART_API_CONFIG.port = port;
        }
      }
      return true;
    } catch (e) {
      console.error('Error updating API config:', e);
      return false;
    }
  };
}

// Global object to store the current config for runtime updates
if (typeof window !== 'undefined') {
  window.__QUICKKART_API_CONFIG = window.__QUICKKART_API_CONFIG || {
    ip: '192.168.0.103',
    port: '5000'
  };
}

// Get the Metro bundler's IP address from localStorage or use a default
const getMetroServerInfo = () => {
  // Default values if nothing is found
  const DEFAULT_IP = '192.168.0.103'; // Changed to 103
  const DEFAULT_PORT = '5000';
  
  // First try to get from localStorage (works in both web and React Native with proper polyfill)
  const storedConfig = getStoredConfig();
  if (storedConfig && storedConfig.ip) {
    console.log(`[API] Using stored config: ${storedConfig.ip}:${storedConfig.port || DEFAULT_PORT}`);
    return {
      ip: storedConfig.ip,
      port: storedConfig.port || DEFAULT_PORT
    };
  }
  
  // Try auto-detection methods
  try {
    // Method 1: Check if we're running in Expo
    if (global.__expo && global.__expo.Constants) {
      const expoConfig = global.__expo.Constants.manifest || global.__expo.Constants.expoConfig;
      if (expoConfig && expoConfig.hostUri) {
        const [ip] = expoConfig.hostUri.split(':');
        if (ip) {
          console.log(`[API] Using Expo host IP: ${ip}`);
          return {
            ip: ip,
            port: DEFAULT_PORT
          };
        }
      }
    }

    // Method 2: Try to get from SourceCode
    if (NativeModules && NativeModules.SourceCode) {
      const scriptURL = NativeModules.SourceCode.scriptURL;
      if (scriptURL) {
        const match = scriptURL.match(/^https?:\/\/([^:]+):(\d+)/);
        if (match) {
          console.log(`[API] Using scriptURL IP: ${match[1]}`);
          return {
            ip: match[1],
            port: DEFAULT_PORT
          };
        }
      }
    }

    // Method 3: Try to get from network info (Expo only)
    if (NativeModules && NativeModules.ExponentConstants) {
      const expoConstants = NativeModules.ExponentConstants;
      if (expoConstants.manifest && expoConstants.manifest.hostUri) {
        const [ip] = expoConstants.manifest.hostUri.split(':');
        if (ip) {
          console.log(`[API] Using ExponentConstants IP: ${ip}`);
          return {
            ip: ip,
            port: DEFAULT_PORT
          };
        }
      }
    }
  } catch (error) {
    console.warn('Error detecting server info:', error);
  }
  
  // If we get here, return the hardcoded values
  console.warn(`Using hardcoded IP: ${HARDCODED_IP}:${HARDCODED_PORT}`);
  return {
    ip: HARDCODED_IP,
    port: HARDCODED_PORT
  };
};

// Function to get the local IP address (for development on physical devices)
const getLocalIPAddress = () => {
  // This is a placeholder - in a real app, you might want to get this from environment variables
  // or have the user input it in the app's settings
  return '192.168.0.103'; // Replace with your computer's local IP address
};

// Get the server configuration based on environment and platform
const getServerConfig = () => {
  let baseURL;
  
  if (ENV === 'development') {
    // For development, use the hardcoded IP and port
    const { ip, port } = getValidServerInfo();
    baseURL = `http://${ip}:${port}/api`;
    console.log(`[API] Using development server: ${baseURL}`);
    
    // Log platform info for debugging
    const isPhysicalDevice = Platform.OS === 'android' ? true : !__DEV__;
    console.log(`[API] Platform: ${Platform.OS}, isPhysicalDevice: ${isPhysicalDevice}`);
    
    // Log platform-specific connection info
    if (Platform.OS === 'android') {
      console.log(`[API] Android: Using ${isPhysicalDevice ? ip : '10.0.2.2'} to connect to host machine`);
    } else if (Platform.OS === 'ios') {
      console.log(`[API] iOS: Using ${isPhysicalDevice ? ip : 'localhost'} to connect to host machine`);
    } else {
      console.log(`[API] Web: Using ${baseURL}`);
    }
  } else {
    // Production configuration
    baseURL = process.env.REACT_APP_API_URL || 'https://your-production-server.com/api';
    console.log(`[API] Using production server: ${baseURL}`);
  }
  
  return {
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
};

// Create axios instance with default config
const config = getServerConfig();
console.log('[API] Creating axios instance with config:', config);

// Create axios instance with the config
const apiClient = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout,
  headers: config.headers
});

// Log the final configuration
console.log('[API] Axios instance created with baseURL:', apiClient.defaults.baseURL);

// Add request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    console.log(`[API] Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Get token from AsyncStorage
    try {
      const token = await AsyncStorage.getItem('riderToken');
      console.log('Token from storage:', token); // Debug log
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Authorization header set with token'); // Debug log
      } else {
        console.log('No token found in AsyncStorage'); // Debug log
      }
    } catch (error) {
      console.warn('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data
      });
      
      // Handle specific status codes
      if (error.response.status === 401) {
        console.log('Unauthorized - token may be invalid or expired');
        // Clear invalid token
        AsyncStorage.removeItem('riderToken');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Request Error - No response received:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
      
      // Provide more helpful error message for connection issues
      if (error.message === 'Network Error') {
        error.message = 'Cannot connect to the server. Please check your internet connection and try again.';
      }
    } else if (error.response && error.response.status >= 500) {
      // Server error
      error.message = 'Server error. Please try again later.';
    } else {
      // Error in request setup
      console.error('API Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Get the appropriate API URL based on platform and environment
export function getApiBaseUrl() {
  return apiClient.defaults.baseURL || '';
}

// Get base URL for static assets
export function getBaseUrl() {
  const baseApiUrl = getApiBaseUrl();
  if (!baseApiUrl) return '';
  // Remove '/api' from the end if present
  return baseApiUrl.replace(/\/api$/, '');
}

// Export the configured axios instance
export default apiClient;
