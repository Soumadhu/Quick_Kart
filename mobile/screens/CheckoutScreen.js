// screens/CheckoutScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getCart, clearCart, subscribeToCartUpdates, updateCartQuantity } from '../shared/cartService';
import { Ionicons } from '@expo/vector-icons';

const CheckoutScreen = ({ navigation }) => {
  const [cart, setCart] = useState(getCart());
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('123 Main St, City, Country');

  // Handle cart updates
  const handleCartUpdate = useCallback((updatedCart) => {
    setCart(prevCart => {
      // Only update if the cart has actually changed
      if (JSON.stringify(prevCart) !== JSON.stringify(updatedCart)) {
        return [...updatedCart];
      }
      return prevCart;
    });
  }, []);

  // Subscribe to cart updates
  useEffect(() => {
    // Initial cart load
    const initialCart = getCart();
    setCart(initialCart);
    
    // Subscribe to future updates
    const unsubscribe = subscribeToCartUpdates(handleCartUpdate);
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [handleCartUpdate]);

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      
      // Ensure we have the latest cart data
      const currentCart = getCart();
      
      // Navigate to PaymentGateway screen with order details
      navigation.navigate('PaymentGateway', {
        totalAmount: calculateTotal(),
        orderId: `ORDER-${Math.floor(100000 + Math.random() * 900000)}`,
        cartItems: currentCart
      });
      
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert('Error', 'Failed to process order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#CCCCCC" />
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity 
          style={styles.continueShoppingButton}
          onPress={() => navigation.navigate('HomeTabs')}
        >
          <Text style={styles.continueShoppingText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>{deliveryAddress}</Text>
            <TouchableOpacity>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          
          {cart.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemDetails}>
                <Text style={styles.orderItemName}>
                  {item.product.name} x {item.quantity}
                </Text>
                <Text style={styles.orderItemPrice}>
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

{/* Price Breakdown */}
        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₹{calculateSubtotal().toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax (18%)</Text>
            <Text style={styles.priceValue}>₹{calculateTax().toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, { marginTop: 8 }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.checkoutButton, loading && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.checkoutButtonText}>Processing...</Text>
          ) : (
            <Text style={styles.checkoutButtonText}>
              Place Order - ₹{calculateTotal().toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 100, 
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 20,
    marginRight: 10,
  },
  changeText: {
    color: '#10a310',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  orderItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemName: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Roboto-Regular',
    maxWidth: '70%',
  },
  orderItemPrice: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#1a1a1a',
  },
  priceBreakdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b6b6b',
    fontFamily: 'Roboto-Regular',
  },
  priceValue: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#1a1a1a',
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#10a310',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  checkoutButton: {
    backgroundColor: '#10a310',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#10a310',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#a0d8a0',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b6b6b',
    marginTop: 16,
    marginBottom: 24,
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  continueShoppingButton: {
    backgroundColor: '#10a310',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#10a310',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Roboto-Bold',
    letterSpacing: 0.5,
  },
});

export default CheckoutScreen;