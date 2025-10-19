import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RiderProfileScreen = ({ navigation }) => {
  // Sample rider data - in a real app, this would come from your state management or API
  const rider = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    rating: 4.8,
    totalDeliveries: 124,
    memberSince: '2023',
    vehicle: 'Honda Activa',
    vehicleNumber: 'KA01AB1234',
  };

  const menuItems = [
    { icon: 'person-outline', title: 'Edit Profile' },
    { icon: 'directions-bike', title: 'Vehicle Details' },
    { icon: 'receipt', title: 'Delivery History' },
    { icon: 'help-outline', title: 'Help & Support' },
    { icon: 'settings', title: 'Settings' },
    { icon: 'exit-to-app', title: 'Sign Out' },
  ];

  const handleMenuItemPress = (item) => {
    // Handle menu item press
    console.log(`Pressed: ${item.title}`);
    if (item.title === 'Sign Out') {
      // Handle sign out
      navigation.reset({
        index: 0,
        routes: [{ name: 'RoleSelection' }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }} 
              style={styles.avatar}
            />
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#F8C400" />
              <Text style={styles.ratingText}>{rider.rating}</Text>
            </View>
          </View>
          <Text style={styles.name}>{rider.name}</Text>
          <Text style={styles.email}>{rider.email}</Text>
          <Text style={styles.phone}>{rider.phone}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rider.totalDeliveries}+</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rider.memberSince}</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rider.vehicle}</Text>
              <Text style={styles.statLabel}>Vehicle</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item)}
            >
              <View style={styles.menuIconContainer}>
                <Icon name={item.icon} size={24} color="#666" />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              <Icon name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#F8C400',
  },
  ratingContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ratingText: {
    marginLeft: 2,
    fontWeight: 'bold',
    color: '#555',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  phone: {
    fontSize: 16,
    color: '#444',
    marginBottom: 15,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },
  menuContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
});

export default RiderProfileScreen;
