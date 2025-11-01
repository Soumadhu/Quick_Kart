import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onRemoveFromCart, 
  cartQuantity = 0,
  onPress 
}) => {
  const [quantity, setQuantity] = useState(cartQuantity);
  const scaleValue = new Animated.Value(1);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleAddToCart = () => {
    animateButton();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    onAddToCart(product, newQuantity);
  };

  const handleRemoveFromCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newQuantity = Math.max(0, quantity - 1);
    setQuantity(newQuantity);
    onRemoveFromCart(product, newQuantity);
  };

  const renderQuantityControls = () => (
    <View style={styles.quantityContainer}>
      <TouchableOpacity 
        style={styles.quantityButton} 
        onPress={handleRemoveFromCart}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={16} color="#51CC5E" />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{quantity}</Text>
      <TouchableOpacity 
        style={styles.quantityButton} 
        onPress={handleAddToCart}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={16} color="#51CC5E" />
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.imageUrl || product.image }} 
          style={styles.productImage}
          resizeMode="contain"
          onError={(error) => console.log('Image load error:', error.nativeEvent.error, 'URI:', product.imageUrl || product.image)}
        />
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}% OFF</Text>
          </View>
        )}
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productWeight} numberOfLines={1}>
          {product.weight || '1 pc'}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{product.price}</Text>
          {product.originalPrice && (
            <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
          )}
        </View>
        
        {quantity > 0 ? (
          <Animated.View style={[styles.addButton, { transform: [{ scale: scaleValue }] }]}>
            {renderQuantityControls()}
          </Animated.View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFE3E3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FF6B6B',
    fontSize: 10,
    fontWeight: '700',
  },
  detailsContainer: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 4,
    height: 40,
    lineHeight: 18,
  },
  productWeight: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: '#F2FFF3',
    borderWidth: 1,
    borderColor: '#51CC5E',
    borderRadius: 6,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#51CC5E',
    fontSize: 14,
    fontWeight: '700',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#51CC5E',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
});

export default ProductCard;
