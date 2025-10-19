import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import Rider Screens
import AssignedOrdersScreen from '../screens/rider/AssignedOrdersScreen';
import RiderMapViewScreen from '../screens/rider/RiderMapViewScreen';
import EarningsScreen from '../screens/rider/EarningsScreen';
import RiderProfileScreen from '../screens/rider/RiderProfileScreen';

const Tab = createBottomTabNavigator();

const RiderTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Orders') {
              iconName = 'list-alt';
            } else if (route.name === 'Map') {
              iconName = 'map';
            } else if (route.name === 'Earnings') {
              iconName = 'attach-money';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            }
            return <Icon name={iconName} size={size} color={color} style={styles.tabBarIcon} />;
          },
          tabBarActiveTintColor: '#F8C400',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#eee',
            height: 55 + insets.bottom,
            elevation: 8,
          },
          tabBarItemStyle: {
            height: 55,
            padding: 0,
            margin: 0,
            justifyContent: 'center',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            margin: 0,
            padding: 0,
            marginTop: 2,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Orders" component={AssignedOrdersScreen} />
        <Tab.Screen name="Map" component={RiderMapViewScreen} />
        <Tab.Screen name="Earnings" component={EarningsScreen} />
        <Tab.Screen name="Profile" component={RiderProfileScreen} />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight,
  },
  tabBarIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
});

export default RiderTabs;
