import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const BlinkitHeader = ({ location = 'Home', onLocationPress, onSearchPress, onCartPress, cartItemCount = 0 }) => {
  return (
    <View style={styles.container}>
      {/* Top Bar with Location */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.locationContainer} onPress={onLocationPress}>
          <Ionicons name="location-outline" size={20} color="#51CC5E" />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationText} numberOfLines={1}>
              {location || 'Select Location'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cartButton} onPress={onCartPress}>
          <Ionicons name="cart-outline" size={24} color="#333" />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{Math.min(cartItemCount, 9)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchContainer} onPress={onSearchPress} activeOpacity={0.8}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Search for products and more...</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: width * 0.7,
  },
  locationTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: '#999',
    fontSize: 14,
  },
});

export default BlinkitHeader;
