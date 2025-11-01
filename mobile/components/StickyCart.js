import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const StickyCart = ({ itemCount = 0, totalAmount = 0, onPress, isVisible = true }) => {
  if (!isVisible || itemCount === 0) return null;

  return (
    <Animated.View style={styles.container}>
      <TouchableOpacity 
        style={styles.cartButton}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.cartIconContainer}>
          <Ionicons name="cart" size={24} color="#FFFFFF" />
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cartTextContainer}>
          <Text style={styles.cartTitle}>
            {itemCount} {itemCount === 1 ? 'Item' : 'Items'} | 
            <Text style={styles.cartAmount}> ₹{totalAmount.toFixed(2)}</Text>
          </Text>
          <Text style={styles.cartSubtitle}>Extra ₹{Math.max(0, 99 - totalAmount).toFixed(2)} for free delivery</Text>
        </View>
        
        <View style={styles.viewCartContainer}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 12,
    backgroundColor: '#51CC5E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cartIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#51CC5E',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cartTextContainer: {
    flex: 1,
  },
  cartTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cartAmount: {
    fontWeight: '700',
  },
  cartSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  viewCartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default StickyCart;
