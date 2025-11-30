import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import riderService from '../../src/services/riderService';

const RiderProfileScreen = ({ navigation, route }) => {
  const [rider, setRider] = useState({
    name: 'Loading...',
    email: 'Loading...',
    phone: 'Loading...',
    rating: 0,
    totalDeliveries: 0,
    memberSince: new Date().toISOString(),
    vehicle: 'Loading...',
    vehicleNumber: 'Loading...',
    profile_picture: 'https://randomuser.me/api/portraits/men/1.jpg'
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Construct full URL for profile picture with cache busting
  const getProfilePictureUrl = (path) => {
    if (!path) return 'https://randomuser.me/api/portraits/men/1.jpg';
    // If it's already a full URL, add timestamp
    if (path.startsWith('http')) {
      const separator = path.includes('?') ? '&' : '?';
      return `${path}${separator}t=${new Date().getTime()}`;
    }
    // Otherwise, construct the full URL to the server with timestamp
    return `http://192.168.0.103:5000/${path}?t=${new Date().getTime()}`;
  };

  // Fetch rider profile data
  const fetchRiderProfile = async (isRefreshing = false) => {
    try {
      setLoading(!isRefreshing);
      setError('');
      
      // Fetch rider profile from the backend
      const response = await riderService.getRiderProfile();
      
      if (response && response.rider) {
        const riderData = response.rider;
        setRider({
          name: riderData.name || 'Not provided',
          email: riderData.email || 'Not provided',
          phone: riderData.phone || 'Not provided',
          rating: parseFloat(riderData.rating) || 0,
          totalDeliveries: parseInt(riderData.total_deliveries) || 0,
          memberSince: riderData.created_at || new Date().toISOString(),
          vehicle: riderData.vehicle_model || 'Not provided',
          vehicleNumber: riderData.vehicle_number || 'Not provided',
          profile_picture: getProfilePictureUrl(riderData.profile_picture)
        });
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching rider profile:', error);
      
      if (error.message === 'session_expired') {
        // Handle session expiration
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear any stored tokens and navigate to login
                AsyncStorage.removeItem('riderToken');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      } else {
        setError(error.message || 'Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };
  
  // Handle pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchRiderProfile(true);
  };
  
  // Handle profile updates from navigation params
  useEffect(() => {
    if (route.params?.updatedProfile) {
      const updatedProfile = route.params.updatedProfile;
      setRider(prev => ({
        ...prev,
        ...updatedProfile,
        // Force update the profile picture URL with a new timestamp
        profile_picture: updatedProfile.profile_picture 
          ? getProfilePictureUrl(updatedProfile.profile_picture)
          : prev.profile_picture
      }));
    }
  }, [route.params?.updatedProfile]);

  // Load rider data when component mounts and when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Force refresh when screen comes into focus
      fetchRiderProfile(true);
    });

    // Initial fetch
    fetchRiderProfile();

    return unsubscribe;
  }, [navigation]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('riderToken');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during sign out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };
  
  // Format date to show only year
  const formatMemberSince = (dateString) => {
    if (!dateString) return 'Member';
    try {
      return `Member since ${new Date(dateString).getFullYear()}`;
    } catch (error) {
      return 'Member';
    }
  };

  const menuItems = [
    { 
      icon: 'person-outline', 
      title: 'Edit Name',
      onPress: () => navigation.navigate('EditProfile', { 
        field: 'name', 
        currentValue: rider.name,
        title: 'Edit Name',
        fieldLabel: 'Full Name',
        fieldType: 'text'
      })
    },
    { 
      icon: 'email', 
      title: 'Update Email',
      onPress: () => navigation.navigate('EditProfile', { 
        field: 'email', 
        currentValue: rider.email,
        title: 'Update Email',
        fieldLabel: 'Email Address',
        fieldType: 'email',
        keyboardType: 'email-address'
      })
    },
    { 
      icon: 'phone', 
      title: 'Update Phone',
      onPress: () => navigation.navigate('EditProfile', { 
        field: 'phone', 
        currentValue: rider.phone,
        title: 'Update Phone',
        fieldLabel: 'Phone Number',
        fieldType: 'phone',
        keyboardType: 'phone-pad'
      })
    },
    { 
      icon: 'directions-bike', 
      title: 'Vehicle Details',
      onPress: () => navigation.navigate('EditProfile', { 
        field: 'vehicle', 
        currentValue: rider.vehicle,
        title: 'Update Vehicle Details',
        fieldLabel: 'Vehicle Model',
        fieldType: 'vehicle',
        additionalData: {
          vehicleNumber: rider.vehicleNumber
        }
      })
    },
    { 
      icon: 'receipt', 
      title: 'Delivery History',
      onPress: () => navigation.navigate('DeliveryHistory')
    },
    { 
      icon: 'help-outline', 
      title: 'Help & Support',
      onPress: () => navigation.navigate('HelpSupport')
    },
    { 
      icon: 'settings', 
      title: 'Settings',
      onPress: () => navigation.navigate('Settings')
    },
    { 
      icon: 'exit-to-app', 
      title: 'Sign Out', 
      onPress: () => {
        Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', onPress: handleSignOut, style: 'destructive' }
          ]
        );
      },
      isDanger: true
    },
  ];

  const handleMenuItemPress = (item) => {
    if (item.onPress) {
      item.onPress();
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={50} color="#ff4444" style={{ marginBottom: 15 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchRiderProfile()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('EditProfile', { field: 'photo' })}
          >
            <Image 
              source={{ uri: rider.profile_picture }} 
              style={styles.avatar}
            />
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#F8C400" />
              <Text style={styles.ratingText}>{rider.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.editIcon}>
              <Icon name="edit" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.name}>{rider.name}</Text>
          <Text style={styles.email}>{rider.email}</Text>
          <Text style={styles.phone}>{rider.phone}</Text>
          
          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rider.totalDeliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rider.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>
                {rider.memberSince 
                  ? `Member since ${new Date(rider.memberSince).getFullYear()}` 
                  : 'Member'}
              </Text>
            </View>
          </View>
          
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('NewDelivery')}
            >
              <Icon name="add-circle" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>New Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Earnings')}
            >
              <Icon name="attach-money" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>Earnings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.menuItem,
                item.isDanger && styles.dangerMenuItem
              ]}
              onPress={() => handleMenuItemPress(item)}
            >
              <View style={styles.menuIconContainer}>
                <Icon 
                  name={item.icon} 
                  size={24} 
                  color={item.isDanger ? '#f44336' : '#666'} 
                />
              </View>
              <Text style={[
                styles.menuText,
                item.isDanger && styles.dangerText
              ]}>
                {item.title}
              </Text>
              {!item.isDanger && (
                <Icon name="chevron-right" size={24} color="#999" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>QuickKart Rider App v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Profile header styles
  profileHeader: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  ratingContainer: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
    color: '#555',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  
  // Stats section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
  },
  
  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9f0',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  actionText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Menu styles
  menuContainer: {
    marginTop: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
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
  dangerMenuItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  dangerText: {
    color: '#f44336',
  },
  
  // Version info
  versionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    color: '#999',
    fontSize: 12,
  },
});

export default RiderProfileScreen;