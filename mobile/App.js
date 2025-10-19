import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#F8C400',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <Text>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: () => <Text>🛒</Text>,
          headerShown: true,
          headerTitle: 'My Cart',
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: () => <Text>📦</Text>,
          headerShown: true,
          headerTitle: 'My Orders',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={UserProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text>👤</Text>,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
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
            gestureEnabled: false  // Prevent going back to splash
          }}
        />
        <Stack.Screen 
          name="HomeTabs" 
          component={HomeTabs} 
          options={{ 
            headerShown: false,
            gestureEnabled: false  // Prevent going back to role selection
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
          name="RiderTabs" 
          component={RiderTabs} 
          options={{ 
            headerShown: false,
            gestureEnabled: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}