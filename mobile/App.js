import React, { useEffect } from 'react';
import { Text, View, Linking, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Screens
import SplashScreen from './screens/SplashScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import HomeScreen from './screens/HomeScreen';
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
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: {
          height: 48,
          paddingBottom: 4,
          paddingTop: 4,
          backgroundColor: 'white',
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 30,
          left: 20,
          right: 20,
          borderRadius: 12,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.05)',
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 2,
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTint: '#888',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color, fontSize: 12, marginBottom: 5 }}>Home</Text>
          ),
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <Text style={[styles.tabIcon, { color }]}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color, fontSize: 12, marginBottom: 5 }}>Cart</Text>
          ),
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <Text style={[styles.tabIcon, { color }]}>🛒</Text>
              {isLoggedIn && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>0</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color, fontSize: 12, marginBottom: 5 }}>Orders</Text>
          ),
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <Text style={[styles.tabIcon, { color }]}>📦</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    right: -8,
    top: -3,
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
});

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
        name="HomeTabs" 
        component={HomeTabs} 
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#000',
          headerStyle: {
            backgroundColor: 'transparent',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          gestureEnabled: false
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

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer 
        linking={linking}
        fallback={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#F8C400" />
          </View>
        }
      >
        <StatusBar style="light" />
        <Navigation />
      </NavigationContainer>
    </AuthProvider>
  );
}