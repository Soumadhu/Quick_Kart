import { 
  addToCart as _addToCart, 
  removeFromCart as _removeFromCart, 
  updateCartQuantity as _updateCartQuantity, 
  clearCart as _clearCart,
  getCart as _getCart
} from './mockData';

let cartUpdateListeners = [];
let currentCart = [];

// Initialize cart from storage
const initializeCart = () => {
  try {
    const savedCart = _getCart();
    currentCart = Array.isArray(savedCart) ? [...savedCart] : [];
  } catch (error) {
    console.error('Error initializing cart:', error);
    currentCart = [];
  }
};

// Initialize on load
initializeCart();

// Get current cart (deep copy)
export const getCart = () => {
  return JSON.parse(JSON.stringify(currentCart));
};

// Notify all listeners of cart changes
const notifyListeners = () => {
  const cartCopy = getCart();
  const listeners = [...cartUpdateListeners];
  
  console.log(`[cartService] Notifying ${listeners.length} listeners of cart update`, {
    items: cartCopy.map(item => ({
      id: item.id,
      name: item.name || (item.product && item.product.name),
      quantity: item.quantity
    }))
  });
  
  listeners.forEach(listener => {
    try {
      if (typeof listener === 'function') {
        listener(cartCopy);
      }
    } catch (err) {
      console.error('Error in cart update listener:', err);
    }
  });
};

// Update cart and notify listeners
const updateCart = (newCart) => {
  try {
    // Ensure we're working with a clean copy of the cart
    const updatedCart = Array.isArray(newCart) ? [...newCart] : [];
    
    // Normalize cart items to ensure consistent structure
    const normalizedCart = updatedCart.map(item => ({
      ...item,
      id: item.id || (item.product && item.product.id) || Math.random().toString(36).substr(2, 9),
      quantity: item.quantity || 1,
      product: item.product || { ...item },
      addedAt: item.addedAt || new Date().toISOString()
    }));
    
    // Update the current cart
    currentCart = normalizedCart;
    
    // Save to storage if needed (uncomment if using persistent storage)
    // _clearCart();
    // currentCart.forEach(item => _addToCart(item));
    
    // Create a deep copy for notification to prevent reference issues
    const cartCopy = JSON.parse(JSON.stringify(normalizedCart));
    
    // Notify all listeners with the updated cart
    notifyListeners();
    
    return cartCopy;
  } catch (error) {
    console.error('Error updating cart:', error);
    throw error;
  }
};

// Add item to cart or update quantity if exists
export const addToCart = (product, quantity = 1) => {
  return new Promise((resolve, reject) => {
    try {
      if (!product || !product.id) {
        const error = new Error('Invalid product');
        console.error('Invalid product:', product);
        return reject(error);
      }

      const existingItemIndex = currentCart.findIndex(item => 
        item.id === product.id || 
        (item.product && item.product.id === product.id)
      );

      const updatedCart = [...currentCart];
      
      if (existingItemIndex >= 0) {
        // Update existing item
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: (updatedCart[existingItemIndex].quantity || 1) + quantity
        };
      } else {
        // Add new item
        updatedCart.push({
          ...product,
          quantity: quantity,
          addedAt: new Date().toISOString()
        });
      }

      const result = updateCart(updatedCart);
      resolve(result);
    } catch (error) {
      console.error('Error adding to cart:', error);
      reject(error);
    }
  });
};

// Update quantity of a specific item in the cart
export const updateCartQuantity = (productId, quantity) => {
  return new Promise((resolve, reject) => {
    try {
      if (quantity < 1) {
        const result = removeFromCart(productId);
        return resolve(result);
      }

      const updatedCart = currentCart.map(item => 
        item.id === productId 
          ? { ...item, quantity } 
          : item
      );

      const result = updateCart(updatedCart);
      resolve(result);
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      reject(error);
    }
  });
};

// Remove item from cart
export const removeFromCart = (productId) => {
  return new Promise((resolve, reject) => {
    try {
      const updatedCart = currentCart.filter(item => 
        item.id !== productId && 
        (!item.product || item.product.id !== productId)
      );
      const result = updateCart(updatedCart);
      resolve(result);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      reject(error);
    }
  });
};

// Clear the entire cart
export const clearCart = () => {
  return updateCart([]);
};

// Subscribe to cart updates
export const subscribeToCartUpdates = (callback) => {
  if (typeof callback !== 'function') {
    console.error('Listener must be a function');
    return () => {};
  }

  // Create a wrapper function to handle the callback
  const wrappedCallback = (cart) => {
    try {
      // Ensure we're always passing a valid array
      const safeCart = Array.isArray(cart) ? cart : [];
      console.log('[cartService] Dispatching cart update to listener', {
        items: safeCart.map(item => ({
          id: item.id,
          name: item.name || (item.product && item.product.name),
          quantity: item.quantity
        }))
      });
      callback(safeCart);
    } catch (err) {
      console.error('Error in cart update listener:', err);
    }
  };

  console.log('[cartService] New subscription created');
  
  // Add the wrapped callback to our listeners array
  cartUpdateListeners.push(wrappedCallback);
  
  console.log(`[cartService] Total listeners: ${cartUpdateListeners.length}`);

  // Initial notification with current cart
  const initialCart = getCart();
  console.log('[cartService] Sending initial cart to new subscriber', {
    items: initialCart.map(item => ({
      id: item.id,
      name: item.name || (item.product && item.product.name),
      quantity: item.quantity
    }))
  });
  
  wrappedCallback(initialCart);

  // Return unsubscribe function
  return () => {
    console.log('[cartService] Unsubscribing listener');
    cartUpdateListeners = cartUpdateListeners.filter(
      listener => listener !== wrappedCallback
    );
    console.log(`[cartService] Remaining listeners: ${cartUpdateListeners.length}`);
  };
};

// Export all functions
export default {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  subscribeToCartUpdates
};