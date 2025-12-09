import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, getBaseUrl } from './apiConfig';

// Unified storage interface for web and native
const storage = Platform.OS === 'web' ? {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
  clear: () => Promise.resolve(localStorage.clear()),
  getAllKeys: () => Promise.resolve(Object.keys(localStorage))
} : AsyncStorage;

// Web compatibility setup
if (Platform.OS === 'web' && !window.AsyncStorage) {
  window.AsyncStorage = {
    getItem: async (key) => localStorage.getItem(key),
    setItem: async (key, value) => localStorage.setItem(key, value),
    removeItem: async (key) => localStorage.removeItem(key),
    clear: async () => localStorage.clear(),
    getAllKeys: async () => Object.keys(localStorage)
  };
}

// Get base URLs dynamically with error handling
const getApiUrl = () => {
  try {
    const url = getApiBaseUrl();
    if (!url) throw new Error('API base URL is not configured');
    console.log('[ProductService] Using API URL:', url);
    return url;
  } catch (error) {
    console.error('Error getting API URL:', error);
    throw new Error('Failed to get API URL. Please check your configuration.');
  }
};

// Get static URL for assets
const getStaticUrl = () => {
  try {
    const url = getBaseUrl();
    console.log('[ProductService] Using static URL:', url);
    return url || '';
  } catch (error) {
    console.error('Error getting static URL:', error);
    return '';
  }
};

// Helper function to process product data
const processProduct = (product) => {
  if (!product) return null;
  
  // Generate rating if not present
  let rating = product.rating;
  if (!rating || typeof rating !== 'number') {
    const idString = String(product.id || '');
    const seed = idString.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    rating = 3.5 + (seed % 15) / 10;
    rating = Math.round(rating * 10) / 10;
  }

  return {
    ...product,
    // Ensure image URL is properly formatted
    image: product.image && !product.image.startsWith('http')
      ? `${getStaticUrl()}/${product.image}`.replace(/([^:]\/)\/+/g, '$1')
      : product.image,
    // Ensure price is a number
    price: product.price && typeof product.price === 'string'
      ? parseFloat(product.price)
      : product.price,
    rating,
    original_price: product.originalPrice || product.original_price,
    delivery_time: product.deliveryTime || product.delivery_time || '30-45 min'
  };
};

// Helper function to fix image URLs
const fixImageUrl = (url) => {
  if (!url || url === 'null' || url === 'undefined') {
    return null;
  }
  
  try {
    const currentBaseUrl = getBaseUrl();
    if (!currentBaseUrl) return url;

    // If URL is already absolute with the correct base, return as is
    if (url.startsWith(currentBaseUrl)) {
      return url;
    }

    // If it's a full URL with a different base, handle it
    if (url.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        const currentHost = new URL(currentBaseUrl).hostname;
        
        // Only replace if it's an IP address (not a domain name)
        if (/\d+\.\d+\.\d+\.\d+/.test(urlObj.hostname)) {
          urlObj.hostname = currentHost;
          urlObj.port = new URL(currentBaseUrl).port || '';
          return urlObj.toString();
        }
        return url;
      } catch (e) {
        console.warn('Error processing URL:', { url, error: e.message });
        return url;
      }
    }

    // Handle relative URLs
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    let fullUrl = `${currentBaseUrl.replace(/\/+$/, '')}/${cleanUrl.replace(/^\/+/, '')}`;
    fullUrl = fullUrl.replace(/([^:]\/)\/+/g, '$1');

    // Validate the URL
    try {
      new URL(fullUrl);
      return fullUrl;
    } catch (e) {
      console.warn('Invalid URL after fixing:', { originalUrl: url, fixedUrl: fullUrl });
      return null;
    }
  } catch (e) {
    console.warn('Error processing image URL:', { url, error: e.message });
    return null;
  }
};

// Helper function to handle API requests with timeout and retry
const apiRequest = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const apiUrl = getApiUrl();
    const fullUrl = `${apiUrl}${endpoint}`;
    console.log(`API Request: ${options.method || 'GET'} ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
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
    console.error('API request error:', {
      name: error.name,
      message: error.message,
      endpoint,
      status: error.status,
      data: error.data,
    });
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection.');
    } else if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network settings.');
    } else if (error.message.includes('Network request failed')) {
      throw new Error('Could not connect to the server. Please try again later.');
    }
    
    throw error;
  }
};

// Save product with image
export const saveProductWithImage = async (product, imageUri) => {
  try {
    console.log('Starting to save product:', { 
      product: { ...product, image: imageUri ? '[HAS_IMAGE]' : 'none' },
      platform: Platform.OS
    });

    const formData = new FormData();
    
    // Add product data to form data
    Object.entries(product).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'image' && key !== 'imageUrl') {
        formData.append(key, String(value));
      }
    });

    // Handle image upload if imageUri is provided
    if (imageUri) {
      try {
        if (Platform.OS === 'web') {
          // For web, fetch the file and create a File object
          console.log('Processing image for web:', imageUri);
          const response = await fetch(imageUri);
          if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
          
          const blob = await response.blob();
          const filename = `product-${Date.now()}.jpg`;
          const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
          formData.append('image', file);
        } else {
          // For native, use the existing file
          console.log('Processing image for native:', imageUri);
          const filename = imageUri.split('/').pop() || `product-${Date.now()}.jpg`;
          const fileType = filename.split('.').pop().toLowerCase();
          const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
          
          formData.append('image', {
            uri: imageUri,
            name: filename,
            type: mimeType,
          });
        }
      } catch (imgError) {
        console.error('Error processing image:', imgError);
        throw new Error(`Failed to process image: ${imgError.message}`);
      }
    }

    const apiUrl = `${getApiUrl()}/api/products`;
    console.log('[ProductService] Sending request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to save product');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in saveProductWithImage:', {
      error: error.message,
      stack: error.stack,
      product: { ...product, image: imageUri ? '[HAS_IMAGE]' : 'none' }
    });
    throw new Error(error.message || 'Failed to save product');
  }
};

// Get all products with retry logic and caching
export const getProducts = async () => {
  const maxRetries = 2;
  let lastError;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('[API] Request timed out after 15s');
    controller.abort();
  }, 15000);

  try {
    const apiUrl = getApiUrl();
    // Remove the extra /api since getApiUrl() already includes it
    const productsUrl = `${apiUrl}/products`;
    console.log('Fetching products from:', productsUrl);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        console.log(`[API] Attempt ${attempt} of ${maxRetries}`);
        
        const response = await fetch(productsUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          credentials: 'same-origin',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = await response.text();
          console.error(`[API] Error ${response.status}:`, error);
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[API] Successfully fetched ${data.length} products in ${Date.now() - startTime}ms`);
        
        // Process products
        const processedProducts = data.map(processProduct);
        
        // Cache the products for offline use
        try {
          await storage.setItem('cachedProducts', JSON.stringify(processedProducts));
        } catch (cacheError) {
          console.error('Failed to cache products:', cacheError);
        }
        
        return processedProducts;
      } catch (error) {
        lastError = error;
        console.error(`[API] Attempt ${attempt} failed:`, error.message);
        
        // Don't retry if it's not a network error or timeout
        if (!error.message.includes('Network request failed') && 
            !error.message.includes('timeout') && 
            error.name !== 'AbortError') {
          break;
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Failed to fetch products after multiple attempts');
  } catch (error) {
    console.error('[API] Failed to fetch products:', error);
    
    // Try to return cached products if available
    try {
      const cachedProducts = await storage.getItem('cachedProducts');
      if (cachedProducts) {
        console.log('[API] Using cached products');
        return JSON.parse(cachedProducts);
      }
    } catch (cacheError) {
      console.error('Failed to load cached products:', cacheError);
    }
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to fetch products. Please try again later.';
    if (error.message === 'Network request failed') {
      errorMessage = 'Could not connect to the server. Please check your internet connection and try again.';
    } else if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. The server is taking too long to respond.';
    }
    
    throw new Error(errorMessage);
  } finally {
    clearTimeout(timeoutId);
  }
};

// Get a single product by ID
export const getProduct = async (id) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const url = `${getApiUrl()}/api/products/${id}`;
    console.log(`[ProductService] Fetching product ${id} from:`, url);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch product');
    }
    
    const product = await response.json();
    return processProduct(product);
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[ProductService] Error fetching product ${id}:`, error);
    
    // Try to load from cached products if available
    try {
      const cachedProducts = await storage.getItem('cachedProducts');
      if (cachedProducts) {
        const products = JSON.parse(cachedProducts);
        const cachedProduct = products.find(p => p.id === id || p._id === id);
        if (cachedProduct) {
          console.log('[ProductService] Using cached product data');
          return processProduct(cachedProduct);
        }
      }
    } catch (cacheError) {
      console.error('[ProductService] Error loading cached products:', cacheError);
    }
    
    throw new Error(`Failed to fetch product: ${error.message}`);
  }
};

export default {
  saveProduct: saveProductWithImage,
  saveProductWithImage,
  getProducts,
  getProduct,
  
  deleteProduct: async (id) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const token = await storage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch(`${getApiUrl()}/api/products/${id}`, {
        method: 'DELETE',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete product');
      }

      const result = await response.json().catch(() => ({}));
      
      // Invalidate the products cache
      try {
        await storage.removeItem('cachedProducts');
      } catch (cacheError) {
        console.error('Failed to update products cache:', cacheError);
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
  
  updateProduct: async (id, updates) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const token = await storage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch(`${getApiUrl()}/api/products/${id}`, {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(updates),
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      
      // Update the products cache if it exists
      try {
        const cachedProducts = await storage.getItem('cachedProducts');
        if (cachedProducts) {
          const products = JSON.parse(cachedProducts);
          const updatedProducts = products.map(p => 
            (p.id === id || p._id === id) ? { ...p, ...updatedProduct } : p
          );
          await storage.setItem('cachedProducts', JSON.stringify(updatedProducts));
        }
      } catch (cacheError) {
        console.error('Failed to update products cache:', cacheError);
      }
      
      return processProduct(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }
};