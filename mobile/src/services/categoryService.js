import { Platform, NativeModules } from 'react-native';
import { getApiBaseUrl, getBaseUrl } from './apiConfig';

const API_BASE_URL = getApiBaseUrl();
const STATIC_BASE_URL = getBaseUrl();

// Helper function to handle API requests with timeout and retry
const apiRequest = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    console.log(`[Category API] ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      const error = new Error(errorData.message || 'API request failed');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.error('[Category API] Request error:', {
      endpoint,
      error: error.message,
      name: error.name,
      status: error.status,
      isNetworkError: error.message === 'Network request failed',
      isTimeout: error.name === 'AbortError'
    });
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection.');
    } else if (error.message.includes('Network request failed')) {
      throw new Error('Could not connect to the server. Please check your internet connection.');
    }
    
    throw error;
  }
};

export const fetchCategories = async () => {
  try {
    console.log(`[Category API] Fetching categories from: ${API_BASE_URL}/categories`);
    const categories = await apiRequest('/categories');
    
    // Add full image URLs to categories
    return categories.map(category => ({
      ...category,
      imageUrl: category.image ? `${STATIC_BASE_URL}/${category.image}` : null
    }));
  } catch (error) {
    console.error('[Category API] Failed to fetch categories:', error);
    
    // Return fallback data if API fails
    console.warn('Using fallback mock categories');
    return [
      { id: 1, name: 'Vegetables & Fruits', image: null, imageUrl: null },
      { id: 2, name: 'Dairy & Bakery', image: null, imageUrl: null },
      { id: 3, name: 'Electronics', image: null, imageUrl: null },
      { id: 4, name: 'Home & Kitchen', image: null, imageUrl: null },
      { id: 5, name: 'Personal Care', image: null, imageUrl: null }
    ];
  }
};

export const getCategoryImageUrl = (category) => {
  if (!category?.image) return null;
  return `${STATIC_BASE_URL}/${category.image}`;
};

export default {
  fetchCategories,
  getCategoryImageUrl
};
