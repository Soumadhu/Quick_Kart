import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AdminPanel() {
  const navigation = useNavigation();

  const menuItems = [
    { title: 'Dashboard', screen: 'AdminDashboard' },
    { title: 'Users', screen: 'AdminUsers' },
    { title: 'Products', screen: 'AdminProducts' },
    { title: 'Orders', screen: 'AdminOrders' },
    { title: 'Settings', screen: 'AdminSettings' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Panel</Text>
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuText: {
    fontSize: 18,
    color: '#2c3e50',
  },
});
