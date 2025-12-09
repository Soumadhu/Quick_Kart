import { Platform, NativeModules } from 'react-native';
import { getApiBaseUrl, getBaseUrl } from './apiConfig';

// Get base URLs dynamically
const getApiUrl = () => {
  const url = getApiBaseUrl();
  console.log('[CategoryService] Using API URL:', url);
  return url;
};

const getStaticUrl = () => {
  const url = getBaseUrl();
  console.log('[CategoryService] Using static URL:', url);
  return url;
};

// Helper function to handle API requests with timeout and retry
const apiRequest = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    // Ensure endpoint starts with a slash and doesn't have double slashes
    const cleanEndpoint = `/${endpoint.replace(/^\/+/, '')}`.replace(/\/+$/, '');
    const baseUrl = getApiUrl();
    const url = `${baseUrl}${cleanEndpoint}`;
    
    console.log(`[Category API] ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
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

    // Handle JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`[Category API] Request error:`, {
      endpoint,
      error: error.message,
      status: error.status,
      isNetworkError: error.name === 'TypeError' && error.message.includes('fetch'),
      isTimeout: error.name === 'AbortError',
      name: error.name
    });
    throw error;
  }
};

// Default category images
const defaultCategoryImages = {
  'Vegetables & Fruits': 'https://img.icons8.com/color/96/000000/organic-food.png',
  'Dairy & Bakery': 'https://img.icons8.com/color/96/000000/bread.png',
  'Electronics': 'https://img.icons8.com/color/96/000000/electronics.png',
  'Home & Kitchen': 'https://img.icons8.com/color/96/000000/kitchen.png',
  'Personal Care': 'https://img.icons8.com/color/96/000000/beauty-cosmetic.png'
};

export const fetchCategories = async () => {
  try {
    const endpoint = '/categories';
    const apiUrl = getApiUrl();
    const staticUrl = getStaticUrl();
    const fullUrl = `${apiUrl}${endpoint}`;
    console.log(`[Category API] Fetching categories from: ${fullUrl}`);
    
    // apiRequest already handles the response and returns the parsed JSON
    const categories = await apiRequest(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
    });

    // Log the API response for debugging
    console.log('[Category API] Raw response:', JSON.stringify(categories, null, 2));
    
    // Process categories to ensure they have proper image URLs
    const processedCategories = categories.map(category => {
      // Determine the image URL
      let imageUrl = category.imageUrl || category.image || null;
      
      // If we don't have an image URL, try to use a default one
      if (!imageUrl && category.name && defaultCategoryImages[category.name]) {
        imageUrl = defaultCategoryImages[category.name];
      }
      
      // If the URL is relative, make it absolute
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('file')) {
        // Remove leading slash if present
        const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        imageUrl = `${staticUrl}/${cleanPath}`.replace(/([^:]\/)\/+/g, '$1');
      }
      
      console.log(`[Category API] Processed category: ${category.name}`, {
        originalImage: category.image,
        finalImageUrl: imageUrl
      });
      
      return {
        ...category,
        imageUrl: imageUrl
      };
    });
    
    console.log('Categories loaded:', processedCategories.length);
    return processedCategories;
  } catch (error) {
    console.error('[Category API] Failed to fetch categories:', error);
    
    // Return fallback data if API fails
    console.warn('Using fallback mock categories');
    return [
      { id: 1, name: 'Vegetables & Fruits', image: 'vegetables.jpg', imageUrl: null },
      { id: 2, name: 'Dairy & Bakery', image: 'dairy.jpg', imageUrl: null },
      { id: 3, name: 'Electronics', image: 'electronics.jpg', imageUrl: null },
      { id: 4, name: 'Home & Kitchen', image: 'home.jpg', imageUrl: null },
      { id: 5, name: 'Personal Care', image: 'personal-care.jpg', imageUrl: null }
    ];
  }
};

export const getCategoryImageUrl = (category) => {
  if (!category?.image) {
    console.log('[Category] No image for category:', category?.name || 'Unknown');
    return null;
  }
  
  // Remove leading slash if present to avoid double slashes
  const imagePath = category.image.startsWith('/') ? category.image.substring(1) : category.image;
  const imageUrl = `${STATIC_BASE_URL}/${imagePath}`;
  
  console.log('[Category] Generated image URL:', {
    category: category.name,
    image: category.image,
    baseUrl: STATIC_BASE_URL,
    finalUrl: imageUrl
  });
  
  return imageUrl;
};

export default {
  fetchCategories,
  getCategoryImageUrl
};
