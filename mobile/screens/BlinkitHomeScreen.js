import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories, products } from '../shared/mockData';
import { addToCart, removeFromCart, getCart, subscribeToCartUpdates } from '../shared/cartService';
import { useAuth } from '../src/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

// Import new components
import BlinkitHeader from '../components/BlinkitHeader';
import { BannerCarousel } from '../components';
import CategoriesRow from '../components/CategoriesRow';
import ProductCard from '../components/ProductCard';
import StickyCart from '../components/StickyCart';

const { width } = Dimensions.get('window');

// Banners are now managed by BannersContext and BannerManager

// Add icons to categories
const categoriesWithIcons = categories.map((category, index) => ({
  ...category,
  icon: [
    'ios-basket', 'ios-restaurant', 'ios-wine', 'ios-pizza', 'ios-cafe',
    'ios-ice-cream', 'ios-nutrition', 'ios-water', 'ios-flower', 'ios-medkit'
  ][index % 10] || 'ios-grid'
}));

const BlinkitHomeScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkStoreProducts, setDarkStoreProducts] = useState([]);
  const [scrollY] = useState(new Animated.Value(0));
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Handle scroll events
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Load cart items
  const loadCart = useCallback(async () => {
    try {
      const items = await getCart();
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }, []);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadCart();
    setIsRefreshing(false);
  }, [loadCart]);

  // Handle adding item to cart
  const handleAddToCart = async (product, quantity = 1) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Handle both product object and product ID
      const productId = product?.id || product;
      const productData = typeof product === 'object' ? product : { id: productId };
      
      // Check if item already exists in the cart
      const existingItemIndex = cartItems.findIndex(item => 
        item.id === productId || 
        (item.product && item.product.id === productId)
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item's quantity
        const existingItem = cartItems[existingItemIndex];
        const newQuantity = (existingItem.quantity || 1) + quantity;
        const updatedItem = { ...existingItem, quantity: newQuantity };
        
        // Update in cart service
        await addToCart(updatedItem);
      } else {
        // Add new item
        const newItem = { 
          ...productData, 
          quantity,
          addedAt: new Date().toISOString()
        };
        await addToCart(newItem);
      }
      
      // Refresh cart and provide feedback
      await loadCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show success notification
      setNotification({
        visible: true,
        message: `${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart`,
        itemCount: quantity
      });
      
      // Hide notification after delay
      setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
      }, 2000);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Show error notification
      setNotification({
        visible: true,
        message: 'Failed to add item to cart',
        isError: true
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
      }, 2000);
      
      // Revert to last good state on error
      try {
        await loadCart();
      } catch (e) {
        console.error('Error reverting cart state:', e);
      }
    }
  };

  // Handle removing item from cart
  const handleRemoveFromCart = async (product, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(product.id);
      } else {
        await addToCart({ ...product, quantity });
      }
      await loadCart();
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  // Navigate to cart
  const navigateToCart = () => {
    navigation.navigate('Cart');
  };

  // Navigate to search
  const navigateToSearch = () => {
    navigation.navigate('Search');
  };

  // Navigate to location selector
  const navigateToLocation = () => {
    navigation.navigate('Location');
  };

  // Load Dark Store products
  const loadDarkStoreProducts = async () => {
    console.log('Loading Dark Store products...');
    try {
      // Clear any existing products first to prevent duplicates
      setDarkStoreProducts([]);
      
      const storedProducts = await AsyncStorage.getItem('darkStoreProducts');
      console.log('Raw stored products:', storedProducts);
      
      if (storedProducts) {
        let parsedProducts;
        try {
          parsedProducts = JSON.parse(storedProducts);
          console.log('Successfully parsed products:', parsedProducts);
          
          if (!Array.isArray(parsedProducts)) {
            console.error('Stored products is not an array:', parsedProducts);
            parsedProducts = [];
          }
        } catch (e) {
          console.error('Error parsing stored products:', e);
          parsedProducts = [];
        }
        
        if (parsedProducts.length > 0) {
          // Format to match the existing product structure
          const formattedProducts = parsedProducts.map(product => ({
            ...product,
            id: `darkstore_${product.id || Date.now()}`,
            isDarkStore: true,
            // Ensure all required fields are present with defaults
            originalPrice: product.originalPrice || null,
            unit: product.unit || '1 pc',
            stock: product.stock || 100,
            rating: product.rating || 4.5,
            deliveryTime: product.deliveryTime || '10 mins',
            // Ensure the price is a number
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
          }));
          
          console.log('Successfully formatted products:', formattedProducts);
          setDarkStoreProducts(formattedProducts);
        } else {
          console.log('No valid products found in storage');
          setDarkStoreProducts([]);
        }
      } else {
        console.log('No Dark Store products found in storage');
        setDarkStoreProducts([]);
      }
    } catch (error) {
      console.error('Error in loadDarkStoreProducts:', error);
      setDarkStoreProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to Dark Store updates
  useEffect(() => {
    // Load products immediately
    loadDarkStoreProducts();
    
    // Set up a listener for when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused, reloading Dark Store products...');
      loadDarkStoreProducts();
    });
    
    // Set up an interval to check for Dark Store updates
    const interval = setInterval(loadDarkStoreProducts, 10000); // Check every 10 seconds
    
    // Clean up
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [navigation]);

  // Get all products (both regular and Dark Store products)
  const getAllProducts = useCallback(() => {
    console.log('Getting all products. Dark Store products:', darkStoreProducts);
    return [...products, ...darkStoreProducts];
  }, [products, darkStoreProducts]);

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? [...products, ...darkStoreProducts].filter(product => 
        product.category === selectedCategory.name || 
        product.categoryId === selectedCategory.id
      )
    : [...products, ...darkStoreProducts];

  // Get cart quantity for a product
  const getCartQuantity = (productId) => {
    const item = cartItems.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(selectedCategory?.id === category.id ? null : category);
  };

  // Subscribe to cart updates
  useEffect(() => {
    const handleCartUpdate = (updatedCart) => {
      if (!Array.isArray(updatedCart)) {
        console.warn('Received invalid cart data:', updatedCart);
        return;
      }

      // Create a map of the current cart items for quick lookup
      const currentItemsMap = new Map(
        cartItems.map(item => [item.id || (item.product && item.product.id), item])
      );

      // Merge with updated cart, preserving any local state not in the update
      const mergedCart = updatedCart.map(item => {
        const itemId = item.id || (item.product && item.product.id);
        const currentItem = currentItemsMap.get(itemId);
        
        // If we have a current item with a different quantity, preserve the current quantity
        if (currentItem && currentItem.quantity && currentItem.quantity > 1) {
          return {
            ...item,
            quantity: currentItem.quantity,
            product: item.product || item
          };
        }
        
        return {
          ...item,
          id: itemId || Math.random().toString(36).substr(2, 9),
          quantity: item.quantity || 1,
          product: item.product || item
        };
      });

      // Only update if there are actual changes
      if (JSON.stringify(mergedCart) !== JSON.stringify(cartItems)) {
        setCartItems(mergedCart);
      }
    };

    // Subscribe to cart updates
    const unsubscribe = subscribeToCartUpdates(handleCartUpdate);
    
    // Initial cart load
    const loadCart = async () => {
      try {
        const cart = await getCart();
        handleCartUpdate(cart);
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };
    
    loadCart();
    
    // Clean up
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [cartItems]); // Add cartItems to dependencies to ensure proper updates

  const getCartItemCount = (productId) => {
    const item = cartItems.find(item => item.id === productId || (item.product && item.product.id === productId));
    return item ? (item.quantity || 0) : 0;
  };

  useEffect(() => {
    if (cartItems.length > 0) {
      const needsUpdate = cartItems.some(item => !item.product);
      if (needsUpdate) {
        const updatedCartItems = cartItems.map(item => ({
          ...item,
          product: item.product || { ...item },
          quantity: item.quantity || 1
        }));
        
        if (JSON.stringify(updatedCartItems) !== JSON.stringify(cartItems)) {
          setCartItems(updatedCartItems);
        }
      }
    }
  }, [cartItems]);

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item?.product?.price || item?.price || 0;
      const quantity = item?.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      if (newQuantity < 0) return;
      
      // Update local state first for immediate feedback
      setCartItems(prevItems => {
        const itemIndex = prevItems.findIndex(item => 
          item.id === productId || 
          (item.product && item.product.id === productId)
        );
        
        if (itemIndex >= 0) {
          const updatedItems = [...prevItems];
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            quantity: newQuantity
          };
          return updatedItems;
        }
        return prevItems;
      });
      
      // Then update in the cart service
      await updateCartQuantity(productId, newQuantity);
      
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <BlinkitHeader 
        location="Home"
        onLocationPress={navigateToLocation}
        onSearchPress={navigateToSearch}
        onCartPress={navigateToCart}
        cartItemCount={cartItemCount}
      />
      
      {/* Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.scrollContent}>
          {/* Banner Carousel */}
          <BannerCarousel />
          
          {/* Categories */}
          <CategoriesRow 
            categories={categoriesWithIcons}
            onCategorySelect={handleCategorySelect}
            selectedCategory={selectedCategory}
          />
          
          {/* Products Grid */}
          <Text style={styles.sectionTitle}>
            {selectedCategory ? selectedCategory.name : 'Recommended for you'}
          </Text>
          
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product, 1)}
                onRemoveFromCart={() => handleRemoveFromCart(product, 0)}
                cartQuantity={getCartQuantity(product.id)}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
              />
            ))}
          </View>
        </View>
      </Animated.ScrollView>
      
      {/* Sticky Cart */}
      <StickyCart 
        itemCount={cartItemCount}
        totalAmount={cartTotal}
        onPress={navigateToCart}
        isVisible={cartItemCount > 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for sticky cart
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  notification: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 4,
  },
  notificationText: {
    color: 'white',
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default BlinkitHomeScreen;