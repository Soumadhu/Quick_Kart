import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Environment configuration
const ENV = 'development'; // Change to 'production' for production builds

// Default server configuration
const DEFAULT_PORT = '5000';
// Default IP that will be used if no configuration is found
// Using computer's local IP for device access
const DEFAULT_IP = '192.168.0.100'; // Changed from 192.168.0.103 to match server IP

// Ensure we have a valid IP and port
const getValidServerInfo = () => {
  const serverInfo = getMetroServerInfo();
  return {
    ip: serverInfo.ip || DEFAULT_IP,
    port: serverInfo.port || DEFAULT_PORT
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
      // First try the new format from ip-config.html
      let config = window.localStorage.getItem('apiConfig');
      if (config) {
        config = JSON.parse(config);
        // Convert to the expected format
        return {
          ip: config.ip,
          port: config.port || DEFAULT_PORT
        };
      }
      
      // Fall back to old format for backward compatibility
      config = window.localStorage.getItem('quickkart_api_config');
      if (config) {
        console.log('[API] Using config from localStorage (legacy):', config);
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
  const storedConfig = getStoredConfig();
  window.__QUICKKART_API_CONFIG = {
    ip: storedConfig?.ip || DEFAULT_IP,
    port: storedConfig?.port || DEFAULT_PORT
  };
}

// Get the Metro bundler's IP address from localStorage or use a default
const getMetroServerInfo = () => {
  // First try to get from localStorage (works in both web and React Native with proper polyfill)
  const storedConfig = getStoredConfig();
  if (storedConfig?.ip) {
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
  
  // If we couldn't determine the IP, use the default
  console.log(`[API] Using default server: ${DEFAULT_IP}:${DEFAULT_PORT}`);
  return {
    ip: DEFAULT_IP,
    port: DEFAULT_PORT
  };
};

// Function to get the local IP address (for development on physical devices)
const getLocalIPAddress = () => {
  // This is a placeholder - in a real app, you might want to get this from environment variables
  // or have the user input it in the app's settings
  return '192.168.0.100'; // Replace with your computer's local IP address
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

// Default headers for all requests
const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache'
};

// Ensure baseURL is properly formatted
let baseURL = config.baseURL || 'http://192.168.0.100:5000/api';

// Remove trailing slash if present
if (typeof baseURL === 'string' && baseURL.endsWith('/')) {
  baseURL = baseURL.slice(0, -1);
}

console.log('[API] Using baseURL:', baseURL);

// Create axios instance with the config
const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 30 seconds
  headers: defaultHeaders,
  withCredentials: true, // Enable sending cookies with requests
  crossDomain: true // Important for CORS
});

// Function to get auth token
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (e) {
    console.warn('Failed to get auth token:', e);
    return null;
  }
};

// Log the final configuration
console.log('[API] Axios instance created with baseURL:', apiClient.defaults.baseURL);

// Add request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    console.log(`[API] Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Skip auth for these paths
    const publicEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh-token'];
    if (publicEndpoints.some(endpoint => config.url.includes(endpoint))) {
      return config;
    }
    
    // Get token from AsyncStorage
    try {
      // Try to get both riderToken and userToken
      const [riderToken, userToken] = await Promise.all([
        AsyncStorage.getItem('riderToken'),
        AsyncStorage.getItem('userToken')
      ]);
      
      // Use whichever token is available
      const token = riderToken || userToken;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Authorization header set with token');
      } else {
        console.warn('[API] No authentication token found for protected route');
        // Don't throw error here, let the server handle unauthorized requests
      }
    } catch (error) {
      console.warn('[API] Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error('[API] Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data
      });
      
      // Handle specific status codes
      if (error.response.status === 401) {
        console.log('[API] Unauthorized - token may be invalid or expired');
        
        // Clear all auth tokens
        await Promise.all([
          AsyncStorage.removeItem('riderToken'),
          AsyncStorage.removeItem('userToken'),
          AsyncStorage.removeItem('user')
        ]);
        
        // Only redirect if not already on login/register screen
        const currentRoute = error.config?.url || '';
        if (!currentRoute.includes('/auth/')) {
          // Import NavigationService or use your navigation method
          try {
            const { NavigationService } = require('../navigation/NavigationService');
            NavigationService.navigate('Auth');
          } catch (e) {
            console.warn('Could not navigate to login:', e);
          }
        }
        
        error.message = 'Your session has expired. Please log in again.';
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API] Request Error - No response received:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
      
      // Provide more helpful error message for connection issues
      if (error.message === 'Network Error') {
        error.message = 'Cannot connect to the server. Please check your internet connection and try again.';
      }
    } else if (error.response?.status >= 500) {
      // Server error
      error.message = 'Server error. Please try again later.';
    } else {
      // Error in request setup
      console.error('[API] Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Get the appropriate API URL based on platform and environment
export function getApiBaseUrl() {
  const { ip, port } = getValidServerInfo();
  // Include /api in the base URL and ensure no double slashes
  const baseUrl = `http://${ip}:${port}/api`.replace(/([^:]\/)\/+$/, '$1');
  console.log(`[API] Using base URL: ${baseUrl}`);
  return baseUrl;
}

// Get base URL for static assets
export function getBaseUrl() {
  const { ip, port } = getValidServerInfo();
  // Ensure we have a clean URL without double slashes
  const baseUrl = `http://${ip}:${port}`.replace(/([^:]\/)\/+$/, '$1');
  console.log(`[API] Static assets base URL: ${baseUrl}`);
  return baseUrl;
}

// Export the configured axios instance
export default apiClient;
