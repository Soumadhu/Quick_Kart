import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { users } from '../shared/mockData';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(users[0]);

  const handleSaveAddress = (updatedAddress) => {
    setUser(prevUser => {
      const existingIndex = prevUser.addresses.findIndex(a => a.id === updatedAddress.id);
      const newAddresses = [...prevUser.addresses];
      
      if (existingIndex >= 0) {
        // Update existing address
        newAddresses[existingIndex] = updatedAddress;
      } else {
        // Add new address
        newAddresses.push(updatedAddress);
      }

      // If this is set as default, unset others
      if (updatedAddress.isDefault) {
        newAddresses.forEach(addr => {
          if (addr.id !== updatedAddress.id) {
            addr.isDefault = false;
          }
        });
      }

      return { ...prevUser, addresses: newAddresses };
    });
  };

  const handleDeleteAddress = (addressId) => {
    setUser(prevUser => ({
      ...prevUser,
      addresses: prevUser.addresses.filter(addr => addr.id !== addressId)
    }));
  };

  const handleAddAddress = () => {
    navigation.navigate('EditAddress', {
      onSave: handleSaveAddress,
    });
  };

  const handleEditAddress = (address) => {
    navigation.navigate('EditAddress', {
      address: { ...address },
      onSave: handleSaveAddress,
      onDelete: handleDeleteAddress,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.contact}>{user.phone}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved Addresses</Text>
        {user.addresses.map((address) => (
          <TouchableOpacity 
            key={address.id} 
            style={styles.addressCard}
            onPress={() => handleEditAddress(address)}
          >
            <View style={styles.addressHeader}>
              <Text style={styles.addressType}>{address.type}</Text>
              <View style={styles.addressActions}>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
                <Text style={styles.editText}>Edit</Text>
              </View>
            </View>
            <Text style={styles.addressText}>{address.address}</Text>
            <Text style={styles.addressText}>
              {address.city} - {address.pincode}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddAddress}
        >
          <Text style={styles.addButtonText}>+ Add New Address</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>My Orders</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>❤️</Text>
          <Text style={styles.menuText}>Wishlist</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🎟️</Text>
          <Text style={styles.menuText}>Coupons</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>💬</Text>
          <Text style={styles.menuText}>Help & Support</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Settings</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8C400',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contact: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressType: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 12,
  },
  defaultText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '500',
  },
  editText: {
    color: '#F8C400',
    fontSize: 14,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addButton: {
    borderWidth: 1,
    borderColor: '#F8C400',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#F8C400',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  menuArrow: {
    fontSize: 20,
    color: '#999',
  },
  logoutButton: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ff4444',
    fontWeight: '600',
    fontSize: 16,
  },
});