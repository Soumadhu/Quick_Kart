import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
  { 
    title: 'Dashboard', 
    screen: 'AdminDashboard',
    icon: 'speedometer',
  },
  { 
    title: 'Home Content', 
    screen: 'HomeContentManager',
    icon: 'home',
  },
  { 
    title: 'Products', 
    screen: 'AdminProducts',
    icon: 'shopping-bag',
  },
  { 
    title: 'Categories', 
    screen: 'AdminCategories',
    icon: 'grid',
  },
  { 
    title: 'Orders', 
    screen: 'AdminOrders',
    icon: 'cart',
  },
  { 
    title: 'Users', 
    screen: 'AdminUsers',
    icon: 'people',
  },
  { 
    title: 'Settings', 
    screen: 'AdminSettings',
    icon: 'settings',
  },
];

export default function WebAdminPanel() {
  const router = useRouter();

  const handleNavigate = (screen) => {
    if (Platform.OS === 'web') {
      window.history.pushState({}, '', `/admin/${screen}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Panel</Text>
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleNavigate(item.screen)}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={item.icon} 
                size={24} 
                color="#3498db" 
              />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color="#95a5a6" 
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    margin: 20,
    color: '#2c3e50',
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  arrowIcon: {
    marginLeft: 10,
  },
});
