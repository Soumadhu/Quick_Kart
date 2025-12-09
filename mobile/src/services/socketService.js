import { io } from 'socket.io-client';
import { getApiBaseUrl } from './apiConfig';
import { getAuthToken } from './authService';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  initialize = async (namespace = '/') => {
    // If we already have a socket connection to this namespace, return it
    if (this.socket?.connected && this.currentNamespace === namespace) {
      return this.socket;
    }

    // Disconnect existing socket if namespace is different
    if (this.socket && this.currentNamespace !== namespace) {
      this.socket.disconnect();
      this.socket = null;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        console.warn('No auth token available for WebSocket connection');
        return null;
      }

      // Get base URL and ensure it doesn't end with a slash
      let baseUrl = getApiBaseUrl().replace(/\/+$/, '');
      
      // Convert http to ws and ensure proper URL format
      const wsUrl = baseUrl.replace(/^http/, 'ws');
      
      console.log(`Initializing WebSocket connection to: ${wsUrl}${namespace}`);
      
      // Initialize socket with the correct namespace
      this.socket = io(`${wsUrl}${namespace}`, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        query: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true,
      });

      this.currentNamespace = namespace;
      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        const onConnect = () => {
          console.log(`WebSocket connected to namespace: ${namespace}`);
          this.socket.off('connect', onConnect);
          this.socket.off('connect_error', onConnectError);
          resolve(this.socket);
        };

        const onConnectError = (error) => {
          console.error(`WebSocket connection error (${namespace}):`, error);
          this.socket.off('connect', onConnect);
          this.socket.off('connect_error', onConnectError);
          reject(error);
        };

        this.socket.once('connect', onConnect);
        this.socket.once('connect_error', onConnectError);
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      return null;
    }
  };

  setupEventListeners = () => {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      // Attempt to reconnect if not explicitly disconnected
      if (reason !== 'io client disconnect') {
        setTimeout(() => this.initialize(), 5000);
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  };

  subscribe = (event, callback) => {
    if (!this.socket) {
      console.warn('Socket not initialized. Call initialize() first.');
      return () => {};
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const wrappedCallback = (data) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in WebSocket event handler for '${event}':`, error);
      }
    };
    
    this.listeners.get(event).add(wrappedCallback);
    this.socket.on(event, wrappedCallback);
    
    return () => this.unsubscribe(event, wrappedCallback);
  };

  unsubscribe = (event, callback) => {
    if (!this.socket) return;
    
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      if (callbacks.has(callback)) {
        this.socket.off(event, callback);
        callbacks.delete(callback);
      }
    }
  };

  emit = (event, data, callback) => {
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Message not sent:', event);
      return false;
    }
    
    return new Promise((resolve) => {
      try {
        if (callback) {
          this.socket.emit(event, data, (response) => {
            try {
              resolve(callback(null, response));
            } catch (error) {
              console.error('Error in emit callback:', error);
              resolve(callback(error));
            }
          });
        } else {
          this.socket.emit(event, data);
          resolve(true);
        }
      } catch (error) {
        console.error('Error emitting WebSocket event:', error);
        if (callback) {
          resolve(callback(error));
        } else {
          resolve(false);
        }
      }
    });
  };

  disconnect = () => {
    if (this.socket) {
      // Remove all listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.listeners.clear();
      
      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket disconnected');
    }
  };
}

// Create a singleton instance
export const socketService = new SocketService();

export default socketService;
