import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { cart, updateCartQuantity, removeFromCart } from '../shared/mockData';

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([...cart]);

  // Update cart items when cart changes
  useEffect(() => {
    setCartItems([...cart]);
  }, [cart]);

  const updateQuantity = (id, delta) => {
    const item = cart.find(item => item.id === id);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + delta);
      if (newQuantity === 0) {
        removeFromCart(id);
      } else {
        updateCartQuantity(id, newQuantity);
      }
    }
  };

  const removeItem = (id) => {
    removeFromCart(id);
    Alert.alert('Removed', 'Item has been removed from your cart');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 10;
  const total = subtotal + deliveryFee;

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Text style={styles.itemImage}>{item.image}</Text>
      <View style={styles.itemDetails}>
        <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemUnit}>{item.unit}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
      </View>
      <View style={styles.quantityControl}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, -1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartText}>🛒</Text>
            <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
            <Text style={styles.emptyCartSubtitle}>Add items to get started</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />

            <View style={styles.billDetails}>
              <Text style={styles.billTitle}>Bill Details</Text>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Subtotal</Text>
                <Text style={styles.billValue}>₹{subtotal}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                <Text style={styles.billValue}>₹{deliveryFee}</Text>
              </View>
              <View style={[styles.billRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutButtonPrice}>₹{total}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  itemImage: {
    fontSize: 40,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  removeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '500',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  billDetails: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    margin: 16,
    borderRadius: 12,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
    color: '#666',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8C400',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutButtonPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyCartText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#F8C400',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
