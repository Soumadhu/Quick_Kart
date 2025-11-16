import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { users } from '../shared/mockData';
import { updateUser, getUserById } from '../src/services/userService';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(users[0]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user.name,
    phone: user.phone,
    email: user.email
  });

  // Load user data from database on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('Loading user data from database...');
      const userData = await getUserById('1');
      if (userData) {
        console.log('User data found in database:', userData);
        setUser(userData);
        setEditedUser({
          name: userData.name,
          phone: userData.phone,
          email: userData.email
        });
      } else {
        console.log('No user data found in database, using mock data');
      }
    } catch (error) {
      console.error('Error loading user data from database:', error);
    }
  };

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

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditedUser({
      name: user.name,
      phone: user.phone,
      email: user.email
    });
  };

  const handleSaveProfile = async () => {
    console.log('handleSaveProfile called');
    console.log('Current user state:', user);
    console.log('Edited user state:', editedUser);
    
    // Validate inputs
    if (!editedUser.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    
    if (!editedUser.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    if (!editedUser.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedUser.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      // Prepare updated user data
      const updatedUserData = {
        id: user.id || '1', // Use existing ID or default to '1'
        name: editedUser.name.trim(),
        phone: editedUser.phone.trim(),
        email: editedUser.email.trim(),
        avatar: user.avatar || null
      };

      console.log('Prepared user data for database:', updatedUserData);

      // Save to database
      const savedUser = await updateUser(updatedUserData);
      console.log('User saved to database:', savedUser);
      
      // Update local state
      setUser(prevUser => ({
        ...prevUser,
        ...updatedUserData
      }));
      
      console.log('Local state updated');
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully and saved to database');
    } catch (error) {
      console.error('Error saving profile to database:', error);
      Alert.alert('Error', `Failed to save profile to database: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedUser({
      name: user.name,
      phone: user.phone,
      email: user.email
    });
  };

  // Test function to verify database operations
  const testDatabase = async () => {
    try {
      console.log('Testing database operations...');
      
      // Test 1: Save a test user
      const testUser = {
        id: 'test1',
        name: 'Test User',
        phone: '1234567890',
        email: 'test@example.com'
      };
      
      console.log('Saving test user...');
      await updateUser(testUser);
      console.log('Test user saved successfully');
      
      // Test 2: Retrieve the user
      console.log('Retrieving test user...');
      const retrievedUser = await getUserById('test1');
      console.log('Retrieved user:', retrievedUser);
      
      // Test 3: Update the user
      console.log('Updating test user...');
      const updatedUser = {
        ...testUser,
        name: 'Updated Test User'
      };
      await updateUser(updatedUser);
      console.log('Test user updated successfully');
      
      // Test 4: Verify the update
      console.log('Verifying update...');
      const finalUser = await getUserById('test1');
      console.log('Final user after update:', finalUser);
      
      Alert.alert('Database Test', 'Database operations completed successfully! Check console for details.');
    } catch (error) {
      console.error('Database test failed:', error);
      Alert.alert('Database Test Failed', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(isEditingProfile ? editedUser.name : user.name).charAt(0).toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.editProfileButton} onPress={isEditingProfile ? handleSaveProfile : handleEditProfile}>
            <Text style={styles.editProfileButtonText}>{isEditingProfile ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
        
        {isEditingProfile ? (
          <View style={styles.editFieldsContainer}>
            <TextInput
              style={styles.editInput}
              value={editedUser.name}
              onChangeText={(text) => setEditedUser(prev => ({ ...prev, name: text }))}
              placeholder="Name"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.editInput}
              value={editedUser.phone}
              onChangeText={(text) => setEditedUser(prev => ({ ...prev, phone: text }))}
              placeholder="Phone"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.editInput}
              value={editedUser.email}
              onChangeText={(text) => setEditedUser(prev => ({ ...prev, email: text }))}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.contact}>{user.phone}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        )}
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

      <TouchableOpacity style={styles.logoutButton} onPress={testDatabase}>
        <Text style={styles.logoutText}>Test Database</Text>
      </TouchableOpacity>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  editProfileButton: {
    backgroundColor: '#F8C400',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  editProfileButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  editFieldsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  editInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  cancelButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#999',
  },
  cancelButtonText: {
    color: '#999',
    fontWeight: '600',
    fontSize: 14,
  },
});