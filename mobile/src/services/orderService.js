import apiClient from './apiConfig';
import { getAuthToken } from './authService';

// Helper function to handle API requests with token
const apiRequest = async (method, url, data = null) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.warn('No authentication token found when making request to:', url);
      throw new Error('Authentication required. Please log in again.');
    }

    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: data ? JSON.stringify(data) : undefined
    };

    console.log(`[OrderService] ${method.toUpperCase()} ${url}`, data ? { data } : '');
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error(`[OrderService] Error in ${method} ${url}:`, error);
    
    // Enhance error message if available from response
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    
    throw error;
  }
};

const createOrder = async (orderData) => {
  console.log('[OrderService] Creating order with data:', orderData);
  try {
    return await apiRequest('post', '/orders', orderData);
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
};

const getOrder = async (orderId) => {
  try {
    return await apiRequest('get', `/orders/${orderId}`);
  } catch (error) {
    console.error('Error in getOrder:', error);
    throw error;
  }
};

const getOrdersByUser = async (userId) => {
  try {
    return await apiRequest('get', `/orders/user/${userId}`);
  } catch (error) {
    console.error('Error in getOrdersByUser:', error);
    throw error;
  }
};

const updateOrderStatus = async (orderId, status, reason = '') => {
  try {
    return await apiRequest('patch', `/orders/${orderId}/status`, { status, reason });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    throw error;
  }
};

// Admin actions
const acceptOrder = async (orderId) => {
  try {
    console.log(`[OrderService] Accepting order ${orderId}`);
    const response = await apiRequest('post', `/orders/${orderId}/accept`);
    console.log(`[OrderService] Order ${orderId} accepted successfully`);
    return response;
  } catch (error) {
    console.error(`[OrderService] Error accepting order ${orderId}:`, error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};

const rejectOrder = async (orderId, reason) => {
  try {
    return await apiRequest('post', `/orders/${orderId}/reject`, { reason });
  } catch (error) {
    console.error('Error in rejectOrder:', error);
    throw error;
  }
};

export default {
  createOrder,
  getOrder,
  getOrdersByUser,
  updateOrderStatus,
  acceptOrder,
  rejectOrder
};
