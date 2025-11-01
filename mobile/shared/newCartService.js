import { 
  addToCart as _addToCart, 
  removeFromCart as _removeFromCart, 
  updateCartQuantity as _updateCartQuantity, 
  clearCart as _clearCart,
  getCart as _getCart,
  subscribeToCartUpdates as _subscribeToCartUpdates
} from './mockData';

let cartUpdateListeners = [];

// Ensure cart is always an array with proper item structure
const normalizeCart = (cart) => {
  if (!Array.isArray(cart)) return [];
  
  return cart.map(item => ({
    id: item.id || (item.product && item.product.id) || '',
    name: item.name || (item.product && item.product.name) || 'Unnamed Product',
    price: item.price || (item.product && item.product.price) || 0,
    image: item.image || (item.product && item.product.image) || '📦',
    unit: item.unit || (item.product && item.product.unit) || '1 pc',
    quantity: item.quantity || 1,
    addedAt: item.addedAt || new Date().toISOString(),
    product: item.product || { ...item }
  }));
};

export const getCart = () => {
  try {
    const cart = _getCart();
    return normalizeCart(cart);
  } catch (error) {
    console.error('Error getting cart:', error);
    return [];
  }
};

const findCartItem = (cart, productId) => {
  return cart.find(item => 
    item.id === productId || 
    (item.product && item.product.id === productId) ||
    item.productId === productId
  );
};

export const addToCart = (product, quantity = 1) => {
  try {
    if (!product || !(product.id || (product.product && product.product.id))) {
      console.error('Invalid product:', product);
      return getCart();
    }
    
    const productId = product.id || (product.product && product.product.id);
    const currentCart = getCart();
    const existingItem = findCartItem(currentCart, productId);
    
    if (existingItem) {
      // Update existing item's quantity
      return updateCartQuantity(productId, (existingItem.quantity || 1) + (quantity || 1));
    } else {
      // Add new item with all required fields
      const newItem = {
        id: productId,
        name: product.name || (product.product && product.product.name) || 'Unnamed Product',
        price: product.price || (product.product && product.product.price) || 0,
        image: product.image || (product.product && product.product.image) || '📦',
        unit: product.unit || (product.product && product.product.unit) || '1 pc',
        quantity: Math.max(1, quantity || 1),
        addedAt: new Date().toISOString(),
        product: product.product || { ...product }
      };
      
      _addToCart(newItem);
      const updatedCart = getCart();
      notifyCartUpdate(updatedCart);
      return updatedCart;
    }
  } catch (error) {
    console.error('Error in addToCart:', error);
    return getCart();
  }
};

export const updateCartQuantity = (productId, quantity) => {
  try {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    
    const currentCart = getCart();
    const itemIndex = currentCart.findIndex(item => 
      item.id === productId || 
      (item.product && item.product.id === productId) ||
      item.productId === productId
    );

    if (itemIndex >= 0) {
      const item = currentCart[itemIndex];
      _updateCartQuantity(item.id || (item.product && item.product.id), quantity);
      const updatedCart = getCart();
      notifyCartUpdate(updatedCart);
      return updatedCart;
    }
    
    return getCart();
  } catch (error) {
    console.error('Error in updateCartQuantity:', error);
    return getCart();
  }
};

export const removeFromCart = (productId) => {
  try {
    _removeFromCart(productId);
    const updatedCart = getCart();
    notifyCartUpdate(updatedCart);
    return updatedCart;
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return getCart();
  }
};

export const clearCart = () => {
  try {
    _clearCart();
    notifyCartUpdate([]);
    return [];
  } catch (error) {
    console.error('Error in clearCart:', error);
    return [];
  }
};

const notifyCartUpdate = (cart) => {
  const cartCopy = JSON.parse(JSON.stringify(cart || getCart()));
  cartUpdateListeners.forEach(listener => {
    try {
      if (typeof listener === 'function') {
        listener(cartCopy);
      }
    } catch (err) {
      console.error('Error in cart update listener:', err);
    }
  });
};

export const subscribeToCartUpdates = (callback) => {
  if (typeof callback !== 'function') {
    console.error('Invalid callback provided to subscribeToCartUpdates');
    return () => {};
  }
  
  cartUpdateListeners.push(callback);
  
  // Initial callback with current cart
  try {
    callback(getCart());
  } catch (err) {
    console.error('Error in initial cart update callback:', err);
  }
  
  // Return unsubscribe function
  return () => {
    cartUpdateListeners = cartUpdateListeners.filter(cb => cb !== callback);
  };
};

export default {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  subscribeToCartUpdates
};
