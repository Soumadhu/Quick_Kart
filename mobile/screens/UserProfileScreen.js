import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Switch, 
  Alert, 
  Linking,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useProfile } from '../src/contexts/ProfileContext';

const UserProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { profile, saveProfile, location, locationError, isLoading } = useProfile();
  
  const [editing, setEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...profile });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Update tempProfile when profile changes
  useEffect(() => {
    if (profile) {
      setTempProfile(profile);
    }
  }, [profile]);

  const handleEditProfile = () => {
    setTempProfile({ ...profile });
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      await saveProfile(tempProfile);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleInputChange = (field, value) => {
    setTempProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationPress = async () => {
    try {
      if (location) {
        const url = `https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        }
      }
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  const handleLogout = () => {
    // Clear token from storage
    // AsyncStorage.removeItem('userToken');
    Alert.alert('Logged Out', 'You have been successfully logged out.');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleAddPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'This would open payment method addition screen');
  };

  const openLink = async (url) => {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: user?.photoURL || 'https://via.placeholder.com/100' }} 
            style={styles.avatar}
          />
          {editing && (
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0]}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        {location ? (
          <TouchableOpacity 
            style={styles.locationContainer}
            onPress={handleLocationPress}
          >
            <Ionicons name="location" size={16} color="#0C831F" />
            <Text style={styles.locationText}>
              {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
            </Text>
            <Ionicons name="open-outline" size={16} color="#0C831F" style={styles.locationIcon} />
          </TouchableOpacity>
        ) : locationError ? (
          <Text style={styles.errorText}>{locationError}</Text>
        ) : (
          <Text style={styles.loadingText}>Getting location...</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!editing ? (
            <TouchableOpacity onPress={handleEditProfile}>
              <Ionicons name="pencil" size={20} color="#0C831F" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSaveProfile}>
              <Ionicons name="checkmark" size={24} color="#0C831F" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={tempProfile.name || ''}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Enter your name"
            />
          ) : (
            <Text style={styles.infoValue}>
              {profile?.name || user?.displayName || 'Not provided'}
            </Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={tempProfile.phone || ''}
              onChangeText={(text) => handleInputChange('phone', text)}
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
            />
          ) : (
            <Text style={styles.infoValue}>{profile?.phone || 'Not provided'}</Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address</Text>
          {editing ? (
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              value={tempProfile.address || ''}
              onChangeText={(text) => handleInputChange('address', text)}
              multiline
              numberOfLines={3}
              placeholder="Enter your full address"
            />
          ) : (
            <Text style={styles.infoValue}>
              {profile?.address || 'No address provided'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <Ionicons name="receipt-outline" size={20} color="#0C831F" />
          <Text style={styles.actionButtonText}>My Orders</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Addresses')}
        >
          <Ionicons name="location-outline" size={20} color="#0C831F" />
          <Text style={styles.actionButtonText}>Saved Addresses</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Payments')}
        >
          <Ionicons name="card-outline" size={20} color="#0C831F" />
          <Text style={styles.actionButtonText}>Payment Methods</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={[styles.infoRow, styles.switchContainer]}>
          <View style={styles.switchLabelContainer}>
            <Ionicons name="notifications-outline" size={20} color="#666" style={styles.switchIcon} />
            <Text style={styles.infoLabel}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#D3D3D3', true: '#90EE90' }}
            thumbColor={notificationsEnabled ? '#0C831F' : '#f4f3f4'}
          />
        </View>
        
        <View style={[styles.infoRow, styles.switchContainer]}>
          <View style={styles.switchLabelContainer}>
            <Ionicons name="moon-outline" size={20} color="#666" style={styles.switchIcon} />
            <Text style={styles.infoLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#D3D3D3', true: '#90EE90' }}
            thumbColor={darkMode ? '#0C831F' : '#f4f3f4'}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => openLink('https://example.com/faq')}
      >
        <Text style={styles.menuIcon}>❓</Text>
        <Text style={styles.menuText}>FAQ</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => openLink('mailto:support@quickkart.com')}
      >
        <Text style={styles.menuIcon}>📧</Text>
        <Text style={styles.menuText}>Contact Support</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => openLink('https://example.com/privacy')}
      >
        <Text style={styles.menuIcon}>🔒</Text>
        <Text style={styles.menuText}>Privacy Policy</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>App Version 1.0.0</Text>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 40,
    paddingBottom: 30,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    elevation: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f0f9f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  locationText: {
    marginLeft: 4,
    color: '#0C831F',
    fontSize: 12,
    fontWeight: '500',
  },
  locationIcon: {
    marginLeft: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 8,
  },
  loadingText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 5,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchIcon: {
    marginRight: 10,
  },
  switchContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#999',
  },
  versionContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  versionText: {
    color: '#999',
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoutText: {
    color: '#ff4444',
    fontWeight: '600',
    fontSize: 16,
  },
  addButtonText: {
    color: '#F8C400',
    fontWeight: '600',
  },
});

export default UserProfileScreen;
