import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, Linking, Platform, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { BannersProvider } from './context/BannersContext';
import ErrorBoundary from './components/ErrorBoundary';
import { subscribeToCartUpdates, getCart } from './shared/cartService';

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
import RiderTabs from './navigation/RiderTabs';
import AdminPanel from './screens/admin/AdminPanel';
import DarkStore from './screens/admin/DarkStore';
import HomeContentManager from './screens/admin/HomeContentManager';
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const isLoggedIn = !!user;
  const [cartCount, setCartCount] = useState(0);
  
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
  
  const headerRight = () => (
    <TouchableOpacity 
      style={styles.headerButton} 
      onPress={() => navigation.navigate('Checkout')}
    >
      <Ionicons name="cart" size={24} color="#007AFF" />
      {cartCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {cartCount > 9 ? '9+' : cartCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerRight: route.name === 'HomeTab' ? headerRight : undefined,
        tabBarActiveTintColor: '#0C831F', // Blinkit green
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarShowLabel: false, // Hide default labels
        tabBarStyle: {
          height: 60,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          backgroundColor: '#fff',
          paddingBottom: 8,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 12,
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={BlinkitHomeScreen} 
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
  );
}

function Navigation() {
  const navigation = useNavigation();

  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event?.url || event;
      if (url) {
        if (url.includes('quickkart://admin') || 
            url.includes('http://localhost:8081/admin') || 
            url.includes('?admin=true')) {
          navigation.navigate('AdminPanel');
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
        } else if (window.location.search.includes('admin=true')) {
          // Handle web URL with query parameter
          navigation.navigate('AdminPanel');
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
        name="AdminPanel" 
        component={AdminPanel}
        options={{ 
          title: 'Admin Panel',
          headerShown: true
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
        name="DarkStore" 
        component={DarkStore}
        options={{ 
          title: 'Dark Store',
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
      </BannersProvider>
    </AuthProvider>
  );
}