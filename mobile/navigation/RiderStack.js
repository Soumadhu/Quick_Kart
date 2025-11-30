import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import RiderTabs from './RiderTabs';
import OrderDetailsScreen from '../screens/rider/OrderDetailsScreen';
import EditProfileScreen from '../screens/rider/EditProfileScreen';

const Stack = createNativeStackNavigator();

// Function to get the header title based on the route
const getHeaderTitle = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Orders';
  
  switch (routeName) {
    case 'Orders':
      return 'My Orders';
    case 'Map':
      return 'Delivery Map';
    case 'Earnings':
      return 'My Earnings';
    case 'Profile':
      return 'My Profile';
    default:
      return 'Rider';
  }
};

const RiderStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen 
        name="RiderTabs" 
        component={RiderTabs} 
        options={({ route }) => ({
          headerShown: false,
          headerTitle: getHeaderTitle(route),
        })}
      />
      <Stack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen} 
        options={{
          title: 'Order Details',
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
    </Stack.Navigator>
  );
};

export default RiderStack;
