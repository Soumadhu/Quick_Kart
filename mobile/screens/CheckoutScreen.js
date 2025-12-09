import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCart, subscribeToCartUpdates } from '../shared/cartService';
import { useAuth } from '../src/contexts/AuthContext';
import { useProfile } from '../src/contexts/ProfileContext';
import { getBaseUrl } from '../src/services/apiConfig';

const CheckoutScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { profile, location } = useProfile();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize delivery address state
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: 'John Doe',
    email: '',
    phone: '',
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    pincode: '10001',
    coordinates: null
  });

  // Update delivery address when profile or user data changes
  useEffect(() => {
    console.log('Profile data in CheckoutScreen:', { user, profile, location });
    
    if (route.params?.deliveryAddress) {
      console.log('Using delivery address from route params');
      setDeliveryAddress(route.params.deliveryAddress);
    } else if (user || profile || location) {
      console.log('Updating delivery address from user/profile data');
      
      // Get the user's full name from available sources
      const getUserName = () => {
        if (profile?.name) return profile.name;
        if (user?.displayName) return user.displayName;
        if (user?.firstName) return `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`;
        return 'John Doe';
      };
      
      const updatedAddress = {
        name: getUserName(),
        email: user?.email || profile?.email || '',
        phone: profile?.phone || user?.phone || '',
        street: profile?.address || '123 Main Street',
        city: 'New York',
        state: 'NY',
        pincode: '10001',
        coordinates: location?.coords ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : null
      };
      
      console.log('New delivery address:', updatedAddress);
      setDeliveryAddress(updatedAddress);
    }
  }, [user, profile, location, route.params?.deliveryAddress]);

  // Handle cart updates
  const handleCartUpdate = useCallback((updatedCart) => {
    setCartItems([...updatedCart]);
    setLoading(false);
  }, []);

  // Subscribe to cart updates
  useEffect(() => {
    const initialCart = getCart();
    console.log('Initial cart items:', JSON.stringify(initialCart, null, 2));
    handleCartUpdate(initialCart);
    
    const unsubscribe = subscribeToCartUpdates((updatedCart) => {
      console.log('Cart updated:', JSON.stringify(updatedCart, null, 2));
      handleCartUpdate(updatedCart);
    });
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [handleCartUpdate]);

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.product?.price || item.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.18;
    return subtotal + tax;
  };

  // Handle place order
  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      // Navigate to login with order data
      navigation.navigate('Login', {
        fromCheckout: true,
        orderData: {
          items: cartItems,
          total: calculateTotal(),
          deliveryAddress,
          paymentMethod: 'Credit Card'
        }
      });
      return;
    }

    // Prepare items for order
    const itemsToPass = cartItems.map(item => ({
      id: item.id || item.product?.id,
      name: item.name || item.product?.name,
      price: item.price || item.product?.price,
      image: item.image || item.product?.image,
      quantity: item.quantity || 1
    }));

    // Navigate to order confirmation
    navigation.navigate('OrderConfirmation', {
      items: itemsToPass,
      total: calculateTotal(),
      deliveryAddress,
      paymentMethod: 'Credit Card',
      userId: user.id
    });
  };

  // Handle navigation after login
  useEffect(() => {
    if (route.params?.fromLogin && route.params?.orderData) {
      // Update state with order data from login
      const { items, total, deliveryAddress } = route.params.orderData;
      setCartItems(items);
      setDeliveryAddress(deliveryAddress);
      // Remove the params to prevent infinite loop
      navigation.setParams({ fromLogin: false, orderData: null });
      
      // Show a message to the user
      Alert.alert('Welcome back!', 'You can now proceed with your order.');
    }
  }, [route.params, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.18;
  const totalAmount = subtotal + tax;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          {cartItems.map((item, index) => {
            const itemName = item.name || item.product?.name || 'Unknown Item';
            const itemPrice = item.price || item.product?.price || 0;
            const itemQuantity = item.quantity || 1;
            
            // Handle image URL - check both item and item.product for image_url
            let itemImage = 'https://via.placeholder.com/60?text=No+Image';
            const imagePath = item.image_url || item.product?.image_url || '';
            
            if (imagePath) {
              if (imagePath.startsWith('http') || imagePath.startsWith('file:')) {
                itemImage = imagePath;
              } else {
                // Handle local file paths
                const baseUrl = getBaseUrl().replace(/\/$/, ''); // Remove trailing slash if exists
                const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
                itemImage = `${baseUrl}/${cleanPath}`;
              }
              console.log('Image URL:', itemImage); // Debug log
            }
            
            return (
              <View key={`${item.id || index}-${itemName}`} style={styles.cartItem}>
                <Image 
                  source={{ uri: itemImage }} 
                  style={styles.cartItemImage} 
                  resizeMode="cover"
                />
                <View style={styles.cartItemDetails}>
                  <Text style={styles.cartItemName} numberOfLines={1}>
                    {itemName}
                  </Text>
                  <Text style={styles.cartItemPrice}>
                    ₹{itemPrice.toFixed(2)} × {itemQuantity}
                  </Text>
                </View>
                <Text style={styles.cartItemTotal}>
                  ₹{(itemPrice * itemQuantity).toFixed(2)}
                </Text>
              </View>
            );
          })}
          
          <View style={styles.orderTotalContainer}>
            <View style={styles.orderTotalRow}>
              <Text style={styles.orderTotalLabel}>Subtotal</Text>
              <Text style={styles.orderTotalValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.orderTotalRow}>
              <Text style={styles.orderTotalLabel}>Tax (18%)</Text>
              <Text style={styles.orderTotalValue}>₹{tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.orderTotalRow, styles.orderTotalRowMain]}>
              <Text style={styles.orderTotalLabelMain}>Total</Text>
              <Text style={styles.orderTotalValueMain}>₹{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressContainer}>
            <View style={styles.addressIcon}>
              <Ionicons name="location-sharp" size={20} color="#6200ee" />
            </View>
            <View style={styles.addressDetails}>
              <Text style={styles.addressName}>{deliveryAddress.name}</Text>
              <Text style={styles.addressText}>
                {deliveryAddress.coordinates ? 
                  `Near ${deliveryAddress.coordinates.latitude.toFixed(6)}, ${deliveryAddress.coordinates.longitude.toFixed(6)}` : 
                  deliveryAddress.street}
              </Text>
              {deliveryAddress.phone ? (
                <Text style={styles.addressPhone}>{deliveryAddress.phone}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.checkoutButtonContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.checkoutButton, cartItems.length === 0 && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={cartItems.length === 0}
        >
          <Text style={styles.checkoutButtonText}>
            {cartItems.length > 0 ? 'Proceed to Payment' : 'Your Cart is Empty'}
          </Text>
          {cartItems.length > 0 && (
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  changeText: {
    color: '#6200ee',
    fontSize: 14,
    fontWeight: '500',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  cartItemDetails: {
    flex: 1,
    marginRight: 8,
  },
  cartItemName: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  orderTotalContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderTotalRowMain: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderTotalLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  orderTotalValue: {
    fontSize: 14,
    color: '#2c3e50',
  },
  orderTotalLabelMain: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  orderTotalValueMain: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  checkoutButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  checkoutButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CheckoutScreen;