import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  Image,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addToCart, removeFromCart, updateCartQuantity, getCart, subscribeToCartUpdates } from '../shared/cartService';
import { useNavigation } from '@react-navigation/native';

const CartScreen = ({ navigation, route }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const isMounted = useRef(true);
  
  // Get navigation instance
  const nav = useNavigation();

  // Handle cart updates
  const handleCartUpdate = useCallback((updatedCart) => {
    if (!isMounted.current) {
      console.log('[CartScreen] Component not mounted, ignoring update');
      return;
    }
    
    // Ensure we have a valid array
    const safeCart = Array.isArray(updatedCart) ? updatedCart : [];
    
    console.log('[CartScreen] Received cart update', {
      itemCount: safeCart.length,
      items: safeCart.map(item => ({
        id: item.id || (item.product && item.product.id),
        name: item.name || (item.product && item.product.name),
        quantity: item.quantity
      }))
    });
    
    // Process the cart items to ensure consistent structure
    const processedItems = safeCart.map(item => ({
      id: item.id || (item.product && item.product.id) || Math.random().toString(36).substr(2, 9),
      name: item.name || (item.product && item.product.name) || 'Unnamed Product',
      price: item.price || (item.product && item.product.price) || 0,
      image: item.image || (item.product && item.product.image) || '📦',
      unit: item.unit || (item.product && item.product.unit) || '1 pc',
      quantity: item.quantity || 1,
      addedAt: item.addedAt || new Date().toISOString(),
      product: item.product || { ...item }
    }));
    
    console.log('[CartScreen] Processing cart update', {
      receivedItems: safeCart.length,
      processedItems: processedItems.length,
      sampleItem: processedItems[0]
    });
    
    // Update the state with the processed items
    setCartItems(prevItems => {
      // If the cart is empty, return empty array
      if (processedItems.length === 0) {
        console.log('[CartScreen] Cart is empty');
        return [];
      }
      
      // Create a map of the previous items for quick lookup
      const prevItemsMap = new Map(
        prevItems.map(item => [item.id, item])
      );
      
      // Merge with new items, preserving any local state (like quantity)
      const mergedItems = processedItems.map(item => {
        const prevItem = prevItemsMap.get(item.id);
        const mergedItem = {
          ...item,
          // Only update quantity if the item is new, otherwise keep the existing quantity
          quantity: prevItem ? prevItem.quantity : (item.quantity || 1)
        };
        
        if (prevItem && prevItem.quantity !== item.quantity) {
          console.log(`[CartScreen] Preserving quantity for item ${item.id}: ${prevItem.quantity} (was ${item.quantity})`);
        }
        
        return mergedItem;
      });
      
      // Only update if there are actual changes to prevent unnecessary re-renders
      if (JSON.stringify(prevItems) !== JSON.stringify(mergedItems)) {
        console.log('[CartScreen] Cart items changed, updating state');
        return mergedItems;
      }
      
      console.log('[CartScreen] No changes in cart items, skipping update');
      return prevItems;
    });
  }, []);

  // Subscribe to cart updates
  useEffect(() => {
    console.log('[CartScreen] Setting up cart subscription');
    isMounted.current = true;
    
    // Initial cart load
    const loadCart = async () => {
      try {
        console.log('[CartScreen] Loading initial cart');
        const cart = await getCart();
        console.log('[CartScreen] Initial cart loaded', { 
          itemCount: cart.length,
          items: cart.map(item => ({
            id: item.id || (item.product && item.product.id),
            name: item.name || (item.product && item.product.name),
            quantity: item.quantity
          }))
        });
        handleCartUpdate(cart);
      } catch (error) {
        console.error('[CartScreen] Error loading cart:', error);
      }
    };
    
    loadCart();
    
    // Subscribe to cart updates
    console.log('[CartScreen] Subscribing to cart updates');
    const unsubscribe = subscribeToCartUpdates((updatedCart) => {
      console.log('[CartScreen] Received cart update in subscription callback');
      handleCartUpdate(updatedCart);
    });
    
    // Clean up
    return () => {
      console.log('[CartScreen] Cleaning up cart subscription');
      isMounted.current = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        console.log('[CartScreen] Unsubscribing from cart updates');
        unsubscribe();
      }
    };
  }, [handleCartUpdate]);

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    // Save the current quantity in case we need to revert
    const currentItem = cartItems.find(item => item.id === productId);
    if (!currentItem) return;
    
    const previousQuantity = currentItem.quantity;
    
    try {
      // Update the local state immediately for better UX
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === productId 
            ? { ...item, quantity: newQuantity } 
            : item
        )
      );
      
      // Update the cart in the service
      await updateCartQuantity(productId, newQuantity);
      
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      // Revert the local state if there was an error
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === productId 
            ? { ...item, quantity: previousQuantity } 
            : item
        )
      );
      
      // Show error to user
      Alert.alert('Error', 'Failed to update cart quantity. Please try again.');
    }
  };

  const handleRemoveItem = (productId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromCart(productId);
              // The cart update will be handled by the subscription
            } catch (error) {
              console.error('Error removing item from cart:', error);
              Alert.alert('Error', 'Failed to remove item from cart. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setIsCheckingOut(true);
    // Navigate to checkout screen
    nav.navigate('Checkout', { cartItems });
    setIsCheckingOut(false);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0).toFixed(2);
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{item.price} • {item.unit}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={() => handleUpdateQuantity(item.id, (item.quantity || 1) - 1)}
          >
            <Ionicons name="remove" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity || 1}</Text>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={() => handleUpdateQuantity(item.id, (item.quantity || 1) + 1)}
          >
            <Ionicons name="add" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Cart</Text>
          {cartItems.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => cartService.clearCart()}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <Text style={styles.emptyCartSubtext}>Add items to get started</Text>
            <TouchableOpacity 
              style={styles.continueShoppingButton}
              onPress={() => nav.navigate('Home')}
            >
              <Text style={styles.continueShoppingText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.cartList}
            />
            <View style={styles.checkoutContainer}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalText}>Total:</Text>
                <Text style={styles.totalAmount}>₹{calculateTotal()}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.checkoutButton, isCheckingOut && styles.checkoutButtonDisabled]}
                onPress={handleCheckout}
                disabled={isCheckingOut}
              >
                <Text style={styles.checkoutButtonText}>
                  {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  continueShoppingButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartList: {
    paddingBottom: 100, // Space for the checkout container
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '500',
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;