import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RiderTabs from './RiderTabs';
import OrderDetailsScreen from '../screens/rider/OrderDetailsScreen';

const Stack = createNativeStackNavigator();

const RiderStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="RiderTabs" 
        component={RiderTabs} 
      />
      <Stack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen} 
        options={{
          headerShown: true,
          title: 'Order Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

export default RiderStack;
