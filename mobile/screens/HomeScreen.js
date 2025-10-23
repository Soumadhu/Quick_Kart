import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, SafeAreaView, StatusBar, Animated, Alert } from 'react-native';
import { categories, products, addToCart, cart, updateCartQuantity, removeFromCart } from '../shared/mockData';
import AuthModal from './AuthModal';
import { useAuth } from '../src/contexts/AuthContext';

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [notification, setNotification] = useState({ visible: false, message: '', itemCount: 0 });
  const [fadeAnim] = useState(new Animated.Value(0));
  const { user, login, register, logout } = useAuth();
  const isLoggedIn = !!user;
  
  // Show notification
  const showNotification = (count) => {
    const message = count === 1 ? '1 item added to cart' : `${count} items added to cart`;
    setNotification({ visible: true, message, itemCount: count });
    
    // Animate in
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setNotification({ ...notification, visible: false });
    });
  };
  
  // Update cart items when cart changes
  useEffect(() => {
    setCartItems([...cart]);
  }, [cart]);
  
  const filteredProducts = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const handleLogin = async (credentials) => {
    try {
      const result = await login(credentials.email, credentials.password);
      if (result.success) {
        setShowAuthModal(false);
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login');
    }
  };

  const handleRegister = async (userData) => {
    try {
      const result = await register({
        email: userData.email,
        password: userData.password,
        firstName: userData.name.split(' ')[0],
        lastName: userData.name.split(' ').slice(1).join(' ') || ' ',
        phone: userData.phone,
      });
      
      if (result.success) {
        setShowAuthModal(false);
      } else {
        Alert.alert('Registration Failed', result.error || 'Could not create account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'An error occurred during registration');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: item.color + '20' }]}
      onPress={() => navigation.navigate('Categories', { categoryId: item.id })}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }) => {
    const cartItem = cart.find(cartItem => cartItem.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleQuantityChange = (delta) => {
      if (!isLoggedIn) {
        setShowAuthModal(true);
        return;
      }
      
      const newQuantity = quantity + delta;
      if (newQuantity <= 0) {
        removeFromCart(item.id);
      } else {
        updateCartQuantity(item.id, newQuantity);
        if (delta > 0) {
          showNotification(delta);
        }
      }
    };

    const handleAddToCart = () => {
      if (!isLoggedIn) {
        setShowAuthModal(true);
        return;
      }
      addToCart(item);
      showNotification(1);
    };

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
      >
        <Text style={styles.productImage}>{item.image}</Text>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productUnit}>{item.unit}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          {item.originalPrice && (
            <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
          )}
        </View>
        <Text style={styles.deliveryTime}>⚡ {item.deliveryTime}</Text>
        
        {quantity > 0 ? (
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(-1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddToCart}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              <Text style={styles.quickText}>Quick</Text>
              <Text style={styles.kartText}>Kart</Text>
            </Text>
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.deliveryLabel}>Delivery to</Text>
            <View style={styles.locationRow}>
              <Text style={styles.location}>Home, 123456</Text>
              <Text style={styles.locationIcon}>▼</Text>
            </View>
          </View>
          <View style={styles.actionsRow}>
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={isLoggedIn ? handleLogout : () => setShowAuthModal(true)}
              >
                {isLoggedIn ? (
                  <View style={styles.profilePhoto}>
                    <Text style={styles.profileInitial}>
                      {user?.firstName?.charAt(0)?.toUpperCase() || '👤'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.profilePhoto}>
                    <Text style={styles.profileIcon}>👤</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cartButton} 
                onPress={() => navigation.navigate('Cart')}
              >
                <Text style={styles.cartIcon}>🛒</Text>
                {cartItems.length > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Bottom Row: Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        {isLoggedIn && user && (
          <Text style={styles.welcomeText}>Hi, {user.firstName}!</Text>
        )}
      </View>
      
      {notification.visible && (
        <Animated.View style={[styles.notification, { opacity: fadeAnim }]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{notification.itemCount}</Text>
          </View>
        </Animated.View>
      )}
      
      <ScrollView style={styles.scrollView}>
        <View style={{ padding: 16, paddingTop: 20 }}>
          {/* Categories Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            />
          </View>

          {/* Products Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Items</Text>
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              scrollEnabled={false}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    marginRight: 0,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  quickText: {
    color: '#F8C400',
  },
  kartText: {
    color: '#4CAF50',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  addressContainer: {
    marginLeft: 5,
    paddingLeft: 5,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  deliveryLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
    width: '100%',
    textAlign: 'right',
  },
  location: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    flexShrink: 1,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationIcon: {
    marginLeft: 4,
    fontSize: 10,
    flexShrink: 0,
  },
  actionsContainer: {
    flex: 2,  // Takes 2/5 (40%) of the available space
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  searchRow: {
    width: '100%',
    marginBottom: 10,
  },
  searchContainer: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 45,
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
    margin: 0,
    height: '100%',
    includeFontPadding: false,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 10,
    fontSize: 22,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  authButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    height: 45,
    justifyContent: 'center',
  },
  authButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  profilePhoto: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4CAF50',
  },
  profileIcon: {
    fontSize: 32,
  },
  cartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    elevation: 2,
  },
  cartIcon: {
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  notification: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 12,
  },
  categoryList: {
    paddingHorizontal: 8,
  },
  categoryCard: {
    width: 70,
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 2,
    textAlign: 'center',
    includeFontPadding: false,
  },
  categoryName: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 12,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productImage: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  productUnit: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  originalPrice: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 9,
    color: '#4CAF50',
    marginBottom: 6,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingVertical: 3,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 2,
  },
  quantityButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    lineHeight: 16,
  },
  quantity: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  notification: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationBadge: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    marginTop: 8,
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
});