import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, getBaseUrl } from './apiConfig';

// For web compatibility
if (Platform.OS === 'web') {
  if (!window.AsyncStorage) {
    window.AsyncStorage = {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
      clear: async () => {},
      getAllKeys: async () => [],
    };
  }
}

const API_BASE_URL = getApiBaseUrl();
const STATIC_BASE_URL = getBaseUrl();

// Helper function to fix image URLs
const fixImageUrl = (url) => {
  if (!url || url === null || url === 'undefined' || url === 'null') {
    return null;
  }
  
  try {
    // Get the current base URL dynamically in case it changed
    const currentBaseUrl = getBaseUrl();
    const currentHost = new URL(currentBaseUrl).hostname;
    
    // If URL is already absolute with the correct base, return as is
    if (url.startsWith(currentBaseUrl)) {
      return url;
    }
    
    // If it's a full URL with a different IP, replace the host
    if (url.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        // Only replace if it's an IP address (not a domain name)
        if (/\d+\.\d+\.\d+\.\d+/.test(urlObj.hostname)) {
          urlObj.hostname = new URL(currentBaseUrl).hostname;
          urlObj.port = new URL(currentBaseUrl).port || '';
          return urlObj.toString();
        }
        return url; // Keep the URL as is if it's a domain name
      } catch (e) {
        console.warn('Error processing URL:', { url, error: e.message });
        return url; // Return original if we can't parse it
      }
    }
    
    // Handle relative URLs (remove leading slash if present)
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    
    // Construct the full URL using the current base URL
    let fullUrl = `${currentBaseUrl.replace(/\/+$/, '')}/${cleanUrl.replace(/^\/+/, '')}`;
    
    // Clean up any double slashes that might occur (except after http:)
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
    console.warn('Invalid image URL, using placeholder:', { 
      originalUrl: url, 
      error: e.message 
    });
    return null; // Return null so ProductCard can show its own placeholder
  }
};

// Helper function to handle API requests with timeout and retry
const apiRequest = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
    
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
    
    const errorInfo = {
      name: error.name,
      message: error.message,
      endpoint,
      status: error.status,
      data: error.data,
    };
    
    console.error('API request error:', errorInfo);
    
    // Provide more specific error messages
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
          // For web, we need to fetch the file and create a File object
          console.log('Processing image for web:', imageUri);
          const response = await fetch(imageUri);
          if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
          
          const blob = await response.blob();
          const filename = `product-${Date.now()}.jpg`;
          const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
          formData.append('image', file);
          console.log('Added image to form data for web');
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
          console.log('Added image to form data for native');
        }
      } catch (imgError) {
        console.error('Error processing image:', imgError);
        throw new Error(`Failed to process image: ${imgError.message}`);
      }
    }

    console.log('Sending request to server...');
    const response = await fetch(`${API_BASE_URL}/products`, {
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

// Get all products
export const getProducts = async () => {
  try {
    const url = `${API_BASE_URL}/api/products`;
    console.log(`[API] Fetching products from: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[API] Request timed out after 15s');
      controller.abort();
    }, 15000);
    
    try {
      console.log(`[API] Starting fetch request to: ${url}`);
      const startTime = Date.now();
      
      // Add retry logic for network requests
      let lastError;
      const maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            signal: controller.signal,
            credentials: 'same-origin'
          });
          
          const endTime = Date.now();
          console.log(`[API] Request completed in ${endTime - startTime}ms`);
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            let errorText;
            try {
              errorText = await response.text();
              // Try to parse as JSON if possible
              try { errorText = JSON.parse(errorText); } catch (e) {}
            } catch (e) {
              errorText = 'Could not parse error response';
            }
            
            console.error('[API] Error Response:', {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              redirected: response.redirected,
              type: response.type,
              body: errorText
            });
            
            // More specific error messages based on status code
            if (response.status === 401) {
              throw new Error('Authentication required. Please log in again.');
            } else if (response.status === 403) {
              throw new Error('You do not have permission to access this resource.');
            } else if (response.status === 404) {
              throw new Error('The requested resource was not found.');
            } else if (response.status >= 500) {
              throw new Error('Server error. Please try again later.');
            } else {
              throw new Error(`Request failed with status: ${response.status}`);
            }
          }
          
          // If we get here, the request was successful
          const products = await response.json();
          console.log(`[API] Successfully fetched ${products.length} products`);
          
          // Process the products to fix image URLs
          const processedProducts = products.map(product => {
            try {
              // Get the image URL from either imageUrl or image_url
              let imageUrl = product.imageUrl || product.image_url || '';
              
              // Process the URL using our fixImageUrl function
              imageUrl = fixImageUrl(imageUrl);
              
              // If the URL is still not valid, use a placeholder
              if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || !imageUrl.startsWith('http')) {
                console.log(`[API] Using placeholder for product ${product.id}, URL was:`, imageUrl);
                imageUrl = null; // Use null so ProductCard can show its own placeholder
              }
              
              // Generate rating if not present
              let rating = product.rating;
              if (!rating || typeof rating !== 'number') {
                // Generate a random rating between 3.5 and 5.0 based on product ID for consistency
                const idString = String(product.id || '');
                const seed = idString.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                rating = 3.5 + (seed % 15) / 10; // This gives us values from 3.5 to 4.9
                rating = Math.round(rating * 10) / 10; // Round to 1 decimal place
                console.log(`[API] Generated rating ${rating} for product ${product.id}`);
              }
              
              // Return the product with the processed image URL and rating
              return {
                ...product,
                image_url: imageUrl,
                original_price: product.originalPrice || product.original_price,
                delivery_time: product.deliveryTime || product.delivery_time || '30-45 min',
                rating: rating,
              };
              
            } catch (error) {
              console.error('Error processing product image URL:', { 
                productId: product.id, 
                error: error.message,
                imageUrl: imageUrl,
                product: JSON.stringify(product, null, 2)
              });
              
              // Return product with null image_url to prevent crashes
              return {
                ...product,
                image_url: null,
                original_price: product.originalPrice || product.original_price,
                delivery_time: product.deliveryTime || product.delivery_time || '30-45 min',
              };
            }
          });
          
          // Save to cache if not in web
          if (Platform.OS !== 'web') {
            try {
              await AsyncStorage.setItem('cachedProducts', JSON.stringify(processedProducts));
            } catch (cacheError) {
              console.error('Error caching products:', cacheError);
            }
          }
          
          return processedProducts;
          
        } catch (error) {
          lastError = error;
          
          // Don't retry if it's not a network error or timeout
          if (!error.message.includes('Network request failed') && 
              !error.message.includes('timeout') && 
              error.name !== 'AbortError') {
            break;
          }
          
          // Log the retry attempt
          if (attempt < maxRetries) {
            console.log(`[API] Attempt ${attempt} failed, retrying...`, error.message);
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      // If we've exhausted all retries, throw the last error
      throw lastError || new Error('Unknown error occurred while fetching products');
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Try to load cached products if available (only in native)
      if (Platform.OS !== 'web') {
        try {
          const cachedProducts = await AsyncStorage.getItem('cachedProducts');
          if (cachedProducts) {
            console.log('[API] Using cached products after error:', error.message);
            const parsedProducts = JSON.parse(cachedProducts);
            
            // Ensure cached products have ratings
            const processedCachedProducts = parsedProducts.map(product => {
              let rating = product.rating;
              if (!rating || typeof rating !== 'number') {
                const idString = String(product.id || '');
                const seed = idString.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                rating = 3.5 + (seed % 15) / 10;
                rating = Math.round(rating * 10) / 10;
                console.log(`[API] Generated rating ${rating} for cached product ${product.id}`);
              }
              return { ...product, rating };
            });
            
            return processedCachedProducts;
          }
        } catch (cacheError) {
          console.error('Error loading cached products:', cacheError);
        }
      }
      
      // Log the error
      console.error('[API] getProducts error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        isNetworkError: error.message === 'Network request failed',
        isTimeout: error.message.includes('timeout') || error.name === 'AbortError'
      });
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to fetch products. Please try again later.';
      
      if (error.message === 'Network request failed') {
        errorMessage = 'Could not connect to the server. Please check your internet connection and try again.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server is taking too long to respond.';
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Unexpected error in getProducts:', error);
    throw error;
  }
};

// Get a single product by ID
export const getProduct = async (id) => {
  if (!id) {
    throw new Error('Product ID is required');
  }

  const url = `${API_BASE_URL}/api/products/${id}`;
  console.log(`[API] Fetching product ${id} from: ${url}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('[API] Request timed out after 15s');
    controller.abort();
  }, 15000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      signal: controller.signal,
      credentials: 'same-origin'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        body: errorText
      });

      if (response.status === 404) {
        throw new Error('Product not found');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }
    }

    const product = await response.json();
    
    // Process the product image URL
    if (product.imageUrl || product.image_url) {
      const imageUrl = fixImageUrl(product.imageUrl || product.image_url);
      product.image_url = imageUrl;
      delete product.imageUrl; // Normalize to image_url
    }

    console.log('[API] Successfully fetched product:', { 
      id: product.id, 
      name: product.name,
      hasImage: !!(product.image_url || product.imageUrl)
    });

    return product;
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.error('[API] getProduct error:', {
      id,
      name: error.name,
      message: error.message,
      stack: error.stack,
      isNetworkError: error.message === 'Network request failed',
      isTimeout: error.message.includes('timeout') || error.name === 'AbortError'
    });

    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    } else if (error.message === 'Network request failed') {
      throw new Error('Could not connect to the server. Please check your internet connection.');
    }
    
    throw error;
  }
};

export default {
  saveProduct: saveProductWithImage,
  saveProductWithImage,
  getProducts,
  getProduct,
  deleteProduct: async (id) => {
    return apiRequest(`/products/${id}`, { method: 'DELETE' });
  },
  updateProduct: async (id, updates) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
};
