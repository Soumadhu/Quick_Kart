import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, Linking, Platform, ActivityIndicator, StyleSheet, LogBox, Animated } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { BannersProvider } from './context/BannersContext';
import { ProfileProvider } from './src/contexts/ProfileContext';
import ErrorBoundary from './components/ErrorBoundary';
import { subscribeToCartUpdates, getCart } from './shared/cartService';
import ApiTest from './src/test/ApiTest';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'VirtualizedLists should never be nested',
  'Require cycle:',
]);

// Screens
import SplashScreen from './screens/SplashScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import BlinkitHomeScreen from './screens/BlinkitHomeScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import OrdersScreen from './screens/OrdersScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import EditAddressScreen from './screens/EditAddressScreen';
import PaymentGatewayScreen from './screens/PaymentGatewayScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import RiderLoginScreen from './screens/rider/RiderLoginScreen';
import RiderRegistrationScreen from './screens/rider/RiderRegistrationScreen';
import RiderTabs from './navigation/RiderTabs';
import AdminPanel from './screens/admin/AdminPanel';
import AdminOrders from './screens/admin/AdminOrders';
import DarkStore from './screens/admin/DarkStore';
import HomeContentManager from './screens/admin/HomeContentManager';
import AdminCategories from './app/screens/admin/AdminCategories';
import AdminRiders from './screens/admin/AdminRiders';
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const isLoggedIn = !!user;
  const [cartCount, setCartCount] = useState(0);
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  // Animate tab bar visibility
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isTabBarVisible ? 0 : 100,
        duration: 500, // Slower animation (increased from 300ms to 500ms)
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isTabBarVisible ? 1 : 0,
        duration: 500, // Slower animation (increased from 300ms to 500ms)
        useNativeDriver: true,
      }),
    ]).start();
  }, [isTabBarVisible]);

  // Handle scroll events to show/hide tab bar
  const handleScroll = (event) => {
    const currentScrollPos = event.nativeEvent.contentOffset.y;
    const isScrollingDown = currentScrollPos > scrollY && currentScrollPos > 10;

    if (isScrollingDown && isTabBarVisible) {
      setIsTabBarVisible(false);
    } else if (!isScrollingDown && !isTabBarVisible) {
      setIsTabBarVisible(true);
    }

    setScrollY(currentScrollPos);
  };

  // Pass scroll handler to home screen
  const screenOptions = (route) => {
    return {
      headerRight: route.name === 'HomeTab' ? headerRight : undefined,
      tabBarActiveTintColor: '#0C831F',
      tabBarInactiveTintColor: '#666',
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        height: 60,
        borderTopWidth: 0,
        elevation: 0,
        backgroundColor: '#fff',
        paddingBottom: Platform.OS === 'android' ? 20 : 10, // Further increased bottom padding
        paddingTop: 4, // Add some top padding for better spacing
        position: 'absolute',
        bottom: Platform.OS === 'android' ? 20 : 0, // Increased bottom margin on Android
        left: 0,
        right: 0,
        borderTopLeftRadius: 15, // Rounded corners for better look
        borderTopRightRadius: 15,
        transform: [{ translateY }],
        opacity: opacity,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5, // For Android shadow
      },
      tabBarItemStyle: {
        paddingVertical: 5,
      },
    };
  };

  // Subscribe to cart updates
  useEffect(() => {
    // Initial cart count
    const updateCartCount = (cart) => {
      const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
      setCartCount(count);
    };

    // Get initial cart
    updateCartCount(getCart());

    // Subscribe to cart updates
    const unsubscribe = subscribeToCartUpdates(updateCartCount);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [getCart, subscribeToCartUpdates]);

  // Sticky cart summary bar component with pop-up animation
  const StickyCartBar = () => {
    const [showBar, setShowBar] = useState(false);
    const popAnim = React.useRef(new Animated.Value(0)).current;

    // Handle pop-up animation when cart count changes
    useEffect(() => {
      if (cartCount > 0) {
        setShowBar(true);
        // Pop-up animation
        Animated.sequence([
          Animated.spring(popAnim, {
            toValue: 1.1,
            useNativeDriver: true,
            tension: 200,
            friction: 5,
          }),
          Animated.spring(popAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 10,
          })
        ]).start();
      } else {
        Animated.timing(popAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowBar(false));
      }
    }, [cartCount]);

    if (!showBar) return null;
    
    return (
      <Animated.View 
        style={[
          styles.stickyCartBar,
          { 
            transform: [
              { translateY: Animated.multiply(translateY, new Animated.Value(1)) },
              { scale: popAnim }
            ],
            opacity: opacity,
            bottom: Platform.OS === 'android' ? 80 : 70, // Position above the tab bar
          }
        ]}
      >
        <View style={styles.stickyCartContent}>
          <View style={styles.stickyCartTextContainer}>
            <Text style={styles.stickyCartCount}>{cartCount} {cartCount === 1 ? 'item' : 'items'} in cart</Text>
            <Text style={styles.stickyCartText}>View cart to checkout</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewCartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.viewCartButtonText}>View Cart</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const headerRight = () => (
    <TouchableOpacity
      style={{ marginRight: 15 }}
      onPress={() => navigation.navigate('Cart')}
    >
      <Ionicons name="cart-outline" size={24} color="#000" />
      {cartCount > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>
            {cartCount > 9 ? '9+' : cartCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => screenOptions(route)}
      >
        <Tab.Screen
          name="HomeTab"
          children={() => (
            <BlinkitHomeScreen
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />
          )}
          options={{
            tabBarIcon: ({ color, size }) => (
              <View style={styles.tabIconContainer}>
                <Ionicons name="home-outline" size={24} color={color} />
                <Text style={[styles.tabBarLabel, { color }]}>Home</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="CategoriesTab"
          component={CategoriesScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <View style={styles.tabIconContainer}>
                <Ionicons name="grid-outline" size={24} color={color} />
                <Text style={[styles.tabBarLabel, { color }]}>Categories</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="CheckoutTab"
          component={CheckoutScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Checkout');
            },
          })}
          options={{
            tabBarIcon: ({ color }) => (
              <View style={styles.tabIconContainer}>
                <Ionicons name="cart-outline" size={24} color={color} />
                <Text style={[styles.tabBarLabel, { color }]}>Checkout</Text>
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {cartCount > 9 ? '9+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="OrdersTab"
          component={OrdersScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <View style={styles.tabIconContainer}>
                <Ionicons name="receipt-outline" size={24} color={color} />
                <Text style={[styles.tabBarLabel, { color }]}>Orders</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="AccountTab"
          component={UserProfileScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <View style={styles.tabIconContainer}>
                <Ionicons name="person-outline" size={24} color={color} />
                <Text style={[styles.tabBarLabel, { color }]}>Account</Text>
              </View>
            ),
          }}
        />
      </Tab.Navigator>
      <StickyCartBar />
    </>
  );
}

function Navigation() {
  const navigation = useNavigation();

  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event?.url || event;
      if (url) {
        // Only handle admin deep links on web
        if (Platform.OS === 'web' && 
            (url.includes('http://localhost:8081/admin') ||
             url.includes('?admin=true'))) {
          navigation.navigate('AdminPanel');
        } else if (url.includes('quickkart://admin')) {
          // Block admin access on mobile
          if (Platform.OS !== 'web') {
            Alert.alert('Admin Access', 'Admin panel is only accessible via web browser at http://localhost:8081/admin');
            return;
          }
        }
      }
    };

    // Handle deep links when the app is opened from a URL
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if the app was opened with a deep link
    const checkInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          handleDeepLink(url);
        } else if (Platform.OS === 'web' && window.location && window.location.search) {
          // Handle web URL with query parameter
          if (window.location.search.includes('admin=true')) {
            navigation.navigate('AdminPanel');
          }
        }
      } catch (error) {
        console.error('Error getting initial URL', error);
      }
    };

    checkInitialURL();

    return () => {
      subscription?.remove();
    };
  }, [navigation]);

  // Handle web URL changes
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handlePopState = () => {
        if (window.location.pathname === '/admin' || window.location.search.includes('admin=true')) {
          navigation.navigate('AdminPanel');
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [navigation]);

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#F8C400',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
        options={{
          headerShown: false,
          gestureEnabled: false
        }}
      />
      <Stack.Screen
        name="Main"
        component={HomeTabs}
        options={{
          headerShown: false,
          gestureEnabled: false
        }}
      />
      <Stack.Screen
        name="HomeTabs"
        component={HomeTabs}
        options={{
          headerShown: false,
          gestureEnabled: false,
          headerStyle: {
            backgroundColor: 'transparent',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          }
        }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ headerTitle: 'Products' }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ headerTitle: 'Product Details' }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerTitle: 'My Cart' }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ headerTitle: 'Checkout' }}
      />
      <Stack.Screen
        name="EditAddress"
        component={EditAddressScreen}
        options={{
          headerTitle: 'Edit Address',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen
        name="PaymentGateway"
        component={PaymentGatewayScreen}
        options={{
          headerTitle: 'Payment',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen
        name="OrderConfirmation"
        component={OrderConfirmationScreen}
        options={{
          headerShown: false,
          gestureEnabled: false
        }}
      />
      <Stack.Screen
        name="RiderLogin"
        component={RiderLoginScreen}
        options={{
          title: 'Rider Login',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen
        name="RiderRegistration"
        component={RiderRegistrationScreen}
        options={{
          title: 'Rider Registration',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={require('./screens/rider/EditProfileScreen').default}
        options={{
          title: 'Edit Profile',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#F8C400',
          },
          headerTintColor: '#000',
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'Login',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#F8C400',
          },
          headerTintColor: '#000',
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Create Account',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#F8C400',
          },
          headerTintColor: '#000',
        }}
      />
      <Stack.Screen
        name="AdminOrders"
        component={AdminOrders}
        options={{
          title: 'Manage Orders',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#f8f9fa',
          },
          headerTintColor: '#2c3e50',
        }}
      />
      <Stack.Screen
        name="AdminPanel"
        component={AdminPanel}
        options={{
          title: 'Admin Panel',
          headerShown: Platform.OS === 'web',
          // Prevent navigation to this screen on mobile
          ...(Platform.OS !== 'web' ? {
            gestureEnabled: false,
            headerLeft: () => null,
            headerShown: false
          } : {})
        }}
      />
      <Stack.Screen
        name="HomeContentManager"
        component={HomeContentManager}
        options={{
          title: 'Manage Home Content',
          headerShown: true
        }}
      />
      <Stack.Screen
        name="AdminCategories"
        component={AdminCategories}
        options={{
          title: 'Category Management',
          headerShown: true
        }}
      />
      <Stack.Screen
        name="DarkStore"
        component={DarkStore}
        options={{
          title: 'Dark Store',
          headerShown: true
        }}
      />
      <Stack.Screen
        name="AdminRiders"
        component={AdminRiders}
        options={{
          title: 'Manage Riders',
          headerShown: true
        }}
      />
      <Stack.Screen
        name="RiderTabs"
        component={RiderTabs}
        options={{
          headerShown: false,
          gestureEnabled: false
        }}
      />
    </Stack.Navigator>
  );
}

const linking = {
  prefixes: [
    'quickkart://',
    'http://localhost:8081',
    'https://yourdomain.com'
  ],
  config: {
    screens: {
      AdminPanel: 'admin',
      // Add other screens here if needed
    },
  },
};

const styles = StyleSheet.create({
  stickyCartBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#0C831F',
    padding: 12,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stickyCartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stickyCartTextContainer: {
    flex: 1,
  },
  stickyCartCount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stickyCartText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 2,
  },
  viewCartButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  viewCartButtonText: {
    color: '#0C831F',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  cartBadge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabIcon: {
    fontSize: 24,
  },
});

export default function App() {
  console.log('App component rendering');

  return (
    <AuthProvider>
      <BannersProvider>
        <ProfileProvider>
        <NavigationContainer 
          linking={linking} 
          fallback={<SplashScreen />}
          onStateChange={(state) => console.log('Navigation state changed')}
          onError={(error) => {
            console.error('Navigation error:', error);
          }}
        >
          <StatusBar style="auto" />
          <ErrorBoundary>
            <View style={{ flex: 1, backgroundColor: 'white' }}>
              <Navigation />
            </View>
          </ErrorBoundary>
        </NavigationContainer>
      </ProfileProvider>
    </BannersProvider>
  </AuthProvider>
  );
}