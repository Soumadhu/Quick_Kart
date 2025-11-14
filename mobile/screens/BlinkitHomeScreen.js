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
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories } from '../shared/mockData';
import { addToCart, removeFromCart, getCart, subscribeToCartUpdates } from '../shared/cartService';
import { useAuth } from '../src/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import * as productService from '../src/services/productService';

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
  const [products, setProducts] = useState([]);
  const [darkStoreProducts, setDarkStoreProducts] = useState([]);
  const [scrollY] = useState(new Animated.Value(0));
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => {
    const product = products.find(p => p.id === item.id);
    return total + ((product?.price || 0) * item.quantity);
  }, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Handle scroll events
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Load products and cart items on component mount
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    const loadData = async (retry = false) => {
      if (!isMounted) return;
      
      try {
        if (!retry) {
          console.log('Loading products...');
          setIsLoading(true);
        }
        
        try {
          // Load products from API
          const productsData = await productService.getProducts();
          console.log('Products loaded:', productsData.length);
          
          if (isMounted) {
            setProducts(productsData);
            
            // Save products to AsyncStorage for offline access
            try {
              await AsyncStorage.setItem('cachedProducts', JSON.stringify(productsData));
            } catch (storageError) {
              console.error('Error caching products:', storageError);
            }
          }
          
          // Load cart
          const cart = await getCart();
          if (isMounted) {
            setCartItems(cart);
          }
          
          // Reset retry count on success
          retryCount = 0;
          
        } catch (error) {
          console.error('Error in API call:', error);
          
          // Retry logic for network errors or timeouts
          if (retryCount < MAX_RETRIES && 
              (error.message.includes('timed out') || 
               error.message.includes('Network request failed'))) {
            retryCount++;
            console.log(`Retrying... Attempt ${retryCount} of ${MAX_RETRIES}`);
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            return loadData(true);
          }
          
          throw error; // Re-throw to be caught by outer catch
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
        
        // Show error to user if this was the last attempt
        if (retryCount >= MAX_RETRIES || !error.message.includes('timed out')) {
          Alert.alert(
            'Connection Issue',
            'Unable to load products. Showing cached data if available.',
            [{ text: 'OK', style: 'default' }]
          );
        }
        
        // Try to load cached products if API fails
        try {
          const cachedProducts = await AsyncStorage.getItem('cachedProducts');
          if (cachedProducts && isMounted) {
            console.log('Using cached products');
            setProducts(JSON.parse(cachedProducts));
          }
        } catch (cacheError) {
          console.error('Error loading cached products:', cacheError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    // Subscribe to cart updates
    const unsubscribe = subscribeToCartUpdates((updatedCart) => {
      if (isMounted) {
        setCartItems([...updatedCart]);
      }
    });

    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error refreshing products:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Handle adding item to cart
  const handleAddToCart = (product, quantity) => {
    addToCart(product, quantity);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleRemoveFromCart = (product, quantity) => {
    removeFromCart(product.id, quantity);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  const searchedProducts = searchQuery
    ? filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredProducts;

  const getCartQuantity = (productId) => {
    const item = cartItems.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const renderProductItem = ({ item }) => {
    const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
    return (
      <ProductCard
        product={item}
        cartQuantity={cartItem?.quantity || 0}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <BlinkitHeader 
        location="Home"
        onLocationPress={() => navigation.navigate('Location')}
        onSearchPress={() => navigation.navigate('Search')}
        onCartPress={() => navigation.navigate('Cart')}
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
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.scrollContent}>
          {/* Banner Carousel */}
          <BannerCarousel />
          
          {/* Categories */}
          <CategoriesRow 
            categories={categoriesWithIcons}
            onCategorySelect={setSelectedCategory}
            selectedCategory={selectedCategory}
          />
          
          {/* Products Grid */}
          <Text style={styles.sectionTitle}>
            {selectedCategory ? selectedCategory.name : 'Recommended for you'}
          </Text>
          
          <View style={styles.productsGrid}>
            <FlatList
              data={searchedProducts}
              renderItem={renderProductItem}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
            />
          </View>
        </View>
      </Animated.ScrollView>
      
      {/* Sticky Cart */}
      <StickyCart 
        itemCount={cartItemCount}
        totalAmount={cartTotal}
        onPress={() => navigation.navigate('Cart')}
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
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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