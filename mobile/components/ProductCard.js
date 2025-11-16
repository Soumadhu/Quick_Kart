import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
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

  // Generate random delivery time if not provided
  const getDeliveryTime = () => {
    if (product.deliveryTime) {
      return product.deliveryTime;
    }
    const times = ['3 MINS', '5 MINS', '8 MINS', '12 MINS', '15 MINS'];
    // Use product ID to generate consistent random time for the same product
    const idString = String(product.id || '');
    const index = Math.abs(idString.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % times.length;
    return times[index];
  };

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
        <Ionicons name="remove" size={14} color="#10B981" />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{quantity}</Text>
      <TouchableOpacity 
        style={styles.quantityButton} 
        onPress={handleAddToCart}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={14} color="#10B981" />
      </TouchableOpacity>
    </View>
  );

  // Star rating component
  const StarRating = ({ rating }) => {
    const renderStars = () => {
      const stars = [];
      const safeRating = Math.min(5, Math.max(0, Number(rating) || 0));
      const fullStars = Math.floor(safeRating);
      const hasHalfStar = safeRating % 1 !== 0;
      
      // Add full stars
      for (let i = 0; i < fullStars; i++) {
        stars.push(
          <Text key={`star-${i}`} style={styles.starIcon}>⭐</Text>
        );
      }
      
      // Add half star if needed
      if (hasHalfStar && fullStars < 5) {
        stars.push(
          <Text key="half-star" style={styles.starIcon}>⭐</Text>
        );
      }
      
      // Add empty stars
      const emptyStars = 5 - Math.ceil(safeRating);
      for (let i = 0; i < emptyStars; i++) {
        stars.push(
          <Text key={`empty-star-${i}`} style={styles.starIconEmpty}>☆</Text>
        );
      }
      
      return stars;
    };
    
    return (
      <View style={styles.starRatingContainer}>
        <View style={styles.starsContainer}>
          {renderStars()}
        </View>
        <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {product.image_url || product.imageUrl || product.image ? (
          <Image 
            source={{ uri: product.image_url || product.imageUrl || product.image }} 
            style={styles.productImage}
            resizeMode="contain"
            onError={(error) => console.log('Image load error:', error.nativeEvent.error, 'URI:', product.image_url || product.imageUrl || product.image)}
          />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}% OFF</Text>
          </View>
        )}
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.deliveryContainer}>
          <Ionicons name="time" size={10} color="#10B981" style={styles.timerIcon} />
          <Text style={styles.deliveryTime}>{getDeliveryTime()}</Text>
        </View>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productWeight} numberOfLines={1}>
          {product.weight || '1 pc'}
        </Text>
        
        {/* Add star rating */}
        {product.rating && typeof product.rating === 'number' && <StarRating rating={product.rating} />}
        
        <View style={styles.priceAddContainer}>
          <Text style={styles.price}>₹{product.price}</Text>
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
        {product.originalPrice && (
          <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '31.33%', // ~33.33% minus small margin for 3 columns
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 80,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FFE3E3',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  discountText: {
    color: '#FF6B6B',
    fontSize: 8,
    fontWeight: '700',
  },
  detailsContainer: {
    padding: 8,
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timerIcon: {
    marginRight: 2,
  },
  deliveryTime: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '600',
  },
  productName: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '700',
    marginBottom: 2,
    lineHeight: 14,
  },
  productWeight: {
    fontSize: 10,
    color: '#888888',
    marginBottom: 4,
    fontWeight: '400',
  },
  starRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 9,
    color: '#666',
    fontWeight: '500',
  },
  starIcon: {
    fontSize: 10,
    color: '#FFA500',
    marginRight: 1,
  },
  starIconEmpty: {
    fontSize: 10,
    color: '#FFA500',
    marginRight: 1,
    opacity: 0.3,
  },
  priceAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
  },
  originalPrice: {
    fontSize: 10,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  addButtonText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  quantityButton: {
    padding: 2,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    marginHorizontal: 6,
    minWidth: 16,
    textAlign: 'center',
  },
});

export default ProductCard;
