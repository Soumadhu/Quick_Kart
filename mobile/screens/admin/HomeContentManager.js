import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import the new managers
import BannerManager from '../../components/admin/BannerManager';
import BestSellersManager from '../../components/admin/BestSellersManager';

const Tab = createMaterialTopTabNavigator();

export default function HomeContentManager({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home Content Manager</Text>
        <View style={styles.headerRight} />
      </View>
      
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#51CC5E',
          tabBarInactiveTintColor: '#666',
          tabBarIndicatorStyle: {
            backgroundColor: '#51CC5E',
            height: 3,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
          },
        }}
      >
        <Tab.Screen 
          name="Banners" 
          component={BannerManager} 
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="images-outline" size={20} color={color} style={styles.tabIcon} />
            ),
          }}
        />
        <Tab.Screen 
          name="BestSellers" 
          component={BestSellersManager} 
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="star-outline" size={20} color={color} style={styles.tabIcon} />
            ),
            title: 'Best Sellers',
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 4,
  },
  headerRight: {
    width: 24,
  },
  tabIcon: {
    marginRight: 4,
  },
});