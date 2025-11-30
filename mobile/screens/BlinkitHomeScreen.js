import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
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
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToCart, removeFromCart, updateCartQuantity, getCart, subscribeToCartUpdates } from '../shared/cartService';
import { useAuth } from '../src/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import * as productService from '../src/services/productService';
import * as categoryService from '../src/services/categoryService';

// Import new components
import BlinkitHeader from '../components/BlinkitHeader';
import { BannerCarousel } from '../components';
import CategoriesRow from '../components/CategoriesRow';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');

// Banners are now managed by BannersContext and BannerManager

const BlinkitHomeScreen = ({ onScroll, scrollEventThrottle = 16 }) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [darkStoreProducts, setDarkStoreProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [scrollY] = useState(new Animated.Value(0));
  const [currentLocation, setCurrentLocation] = useState('Locating...');
  const [locationError, setLocationError] = useState(null);
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => {
    const product = products.find(p => p.id === item.id);
    return total + ((product?.price || 0) * item.quantity);
  }, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Handle scroll events
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event) => {
        // Forward the scroll event to the parent component
        if (onScroll) {
          onScroll(event);
        }
      }
    }
  );

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setCurrentLocation('Location access needed');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address && address[0]) {
        const { city, region, street, name } = address[0];
        const locationText = [street, name, city, region].filter(Boolean).join(', ');
        setCurrentLocation(locationText || 'Current Location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to get location');
      setCurrentLocation('Location unavailable');
    }
  };

  // Load products and cart items on component mount
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    const loadData = async (retry = false) => {
      if (!isMounted) return;
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          console.log('Loading timeout reached, setting isLoading to false');
          setIsLoading(false);
        }
      }, 10000); // 10 second timeout
      
      try {
        if (!retry) {
          console.log('Loading data...');
          setIsLoading(true);
        }
        
        try {
          // Load products from API
          console.log('Loading products from API...');
          const productsData = await productService.getProducts();
          console.log('Products loaded:', productsData.length);

          // Load categories from API
          console.log('Loading categories from API...');
          const categoriesData = await categoryService.fetchCategories();
          console.log('Categories loaded:', categoriesData.length);

          if (isMounted) {
            setProducts(productsData);
            setCategories(categoriesData);

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
          console.error('Error in data loading:', error);
          
          // Retry logic for network errors or timeouts
          if (retryCount < MAX_RETRIES && 
              (error.message.includes('timed out') || 
               error.message.includes('Network request failed'))) {
            retryCount++;
            console.log(`Retrying data load (${retryCount}/${MAX_RETRIES})...`);
            setTimeout(() => loadData(true), 1000 * retryCount);
          } else {
            console.error('Max retries reached or unrecoverable error:', error);
            if (isMounted) {
              setIsLoading(false);
              // Use fallback data to prevent app from hanging
              console.log('Using fallback data');
              setProducts([]);
              setCategories([
                { id: 1, name: 'Vegetables & Fruits', image: null, imageUrl: null },
                { id: 2, name: 'Dairy & Bakery', image: null, imageUrl: null },
                { id: 3, name: 'Electronics', image: null, imageUrl: null },
                { id: 4, name: 'Home & Kitchen', image: null, imageUrl: null },
                { id: 5, name: 'Personal Care', image: null, imageUrl: null }
              ]);
            }
          }
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
            const parsedProducts = JSON.parse(cachedProducts);
            
            // Ensure cached products have ratings
            const processedCachedProducts = parsedProducts.map(product => {
              let rating = product.rating;
              if (!rating || typeof rating !== 'number') {
                const idString = String(product.id || '');
                const seed = idString.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                rating = 3.5 + (seed % 15) / 10;
                rating = Math.round(rating * 10) / 10;
                console.log(`Generated rating ${rating} for cached product ${product.id}`);
              }
              return { ...product, rating };
            });
            
            setProducts(processedCachedProducts);
          }
        } catch (cacheError) {
          console.error('Error loading cached products:', cacheError);
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted && !retry) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    getCurrentLocation();

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

  // Refresh products when screen comes into focus (e.g., after adding a new product)
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        try {
          const productsData = await productService.getProducts();
          const categoriesData = await categoryService.fetchCategories();
          setProducts(productsData);
          setCategories(categoriesData);
          console.log('Products and categories refreshed on screen focus');
        } catch (error) {
          console.error('Error refreshing data on focus:', error);
        }
      };

      refreshData();
    }, [])
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        categoryService.fetchCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error refreshing data:', error);
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
    if (quantity <= 0) {
      removeFromCart(product.id);
    } else {
      updateCartQuantity(product.id, quantity);
    }
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
    ? products.filter(product => product.category === selectedCategory.name)
    : products;

  // Enhanced search with recommendations
  const searchedProducts = searchQuery
    ? filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredProducts;

  // Get search recommendations based on existing products
  const getSearchRecommendations = (query) => {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    const recommendations = products
      .filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        (product.category && product.category.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 5); // Limit to 5 recommendations
    
    return recommendations;
  };

  const handleSearchPress = () => {
    setIsSearchFocused(true);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchFocused(false);
    }
  };
  
  const handleSearchClose = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
  };

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
        location={currentLocation}
        onLocationPress={getCurrentLocation}
        onSearchPress={handleSearchPress}
        onCartPress={() => navigation.navigate('Cart')}
        cartItemCount={cartItemCount}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchFocus={handleSearchFocus}
        isSearchFocused={isSearchFocused}
      />
      {locationError && (
        <View style={styles.locationErrorContainer}>
          <Text style={styles.locationError}>{locationError}</Text>
        </View>
      )}
      
      {/* Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {isSearchFocused && searchQuery.length >= 2 && (
          <View style={searchStyles.recommendationsContainer}>
            <Text style={searchStyles.recommendationsTitle}>Recommendations</Text>
            {getSearchRecommendations(searchQuery).map((product) => (
              <TouchableOpacity
                key={product.id}
                style={searchStyles.recommendationItem}
                onPress={() => {
                  setSearchQuery(product.name);
                  setIsSearchFocused(false);
                }}
              >
                <Text style={searchStyles.recommendationText}>{product.name}</Text>
                <Text style={searchStyles.recommendationPrice}>₹{product.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <View style={styles.scrollContent}>
          {/* Banner Carousel */}
          <BannerCarousel />
          
          {/* Categories */}
          <CategoriesRow 
            categories={categories}
            onCategoryPress={(category) => {
              navigation.navigate('Categories', { categoryId: category.id });
            }}
          />
          
          {/* Products Grid */}
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Search Results for "${searchQuery}"` : (selectedCategory ? selectedCategory.name : 'Recommended for you')}
          </Text>
          
          <View style={styles.productsGrid}>
            <FlatList
              data={searchedProducts}
              renderItem={renderProductItem}
              keyExtractor={item => item.id.toString()}
              numColumns={3}
              key="3-columns"
            />
          </View>
        </View>
      </Animated.ScrollView>
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
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginLeft: 16,
    marginRight: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationErrorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    alignItems: 'center',
  },
  locationError: {
    color: '#D32F2F',
    fontSize: 12,
  },
});

const searchStyles = StyleSheet.create({
  recommendationsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  recommendationPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default BlinkitHomeScreen;