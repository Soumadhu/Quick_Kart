import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProduct } from '../src/services/productService';

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId, product: initialProduct } = route.params;
  const [product, setProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [tempRating, setTempRating] = useState(0);
  
  const handleReviewSubmit = () => {
    if (newReview.rating === 0) {
      alert('Please select a rating');
      return;
    }
    
    // In a real app, you would submit this to your API here
    const review = {
      id: Date.now().toString(),
      user: 'You', // In a real app, this would be the logged-in user's name
      rating: newReview.rating,
      date: new Date().toISOString().split('T')[0],
      comment: newReview.comment
    };
    
    // Add the new review to the beginning of the reviews array
    setReviews(prevReviews => [review, ...prevReviews]);
    
    // Reset the form
    setNewReview({ rating: 0, comment: '' });
    setTempRating(0);
    setShowReviewForm(false);
  };
  
  // Mock reviews data - in a real app, this would come from your API
  const [reviews, setReviews] = useState([
    {
      id: '1',
      user: 'John D.',
      rating: 5,
      date: '2023-11-15',
      comment: 'Excellent product! Fresh and delicious. Will definitely buy again.'
    },
    {
      id: '2',
      user: 'Sarah M.',
      rating: 4,
      date: '2023-11-10',
      comment: 'Good quality, but could be fresher. Delivery was fast though.'
    },
    {
      id: '3',
      user: 'Rahul K.',
      rating: 5,
      date: '2023-11-05',
      comment: 'Amazing taste and quality. Highly recommended!'
    }
  ]);

  // Function to render star ratings
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <Ionicons 
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={16} 
        color="#FFD700" 
        style={styles.starIcon}
      />
    ));
  };

  // Function to render a single review item
  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>{item.user}</Text>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating)}
          <Text style={styles.reviewDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  // Process image URL to handle blob URLs and other formats
  const getImageSource = (url) => {
    if (!url) return null;
    
    // If it's a blob URL, return it as is
    if (url.startsWith('blob:')) {
      return { uri: url };
    }
    
    // If it's a relative path, prepend the base URL
    if (!url.startsWith('http') && !url.startsWith('file:')) {
      // You might want to add your API base URL here if needed
      // return { uri: `http://your-api-base-url/${url}` };
      return { uri: url };
    }
    
    return { uri: url };
  };

  // Fetch product details if not provided
  useEffect(() => {
    if (!initialProduct && productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const productData = await getProduct(productId);
          // Ensure we have a valid image URL
          if (productData && !productData.image_url) {
            productData.image_url = null; // Set to null if no image URL
          }
          setProduct(productData);
        } catch (err) {
          console.error('Error fetching product:', err);
          setError('Failed to load product details');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [productId, initialProduct]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0C831F" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image 
            source={getImageSource(product.image_url)}
            style={styles.productImage}
            resizeMode="contain"
            onError={(e) => {
              console.log('Failed to load image:', e.nativeEvent.error);
              // If image fails to load, set image_url to null to show placeholder
              setProduct(prev => ({ ...prev, image_url: null }));
            }}
            onLoadStart={() => console.log('Starting to load image:', product.image_url)}
            onLoadEnd={() => console.log('Finished loading image')}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image Available</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productUnit}>{product.unit}</Text>

        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {product.rating}</Text>
          <Text style={styles.deliveryTime}>⚡ {product.deliveryTime}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price}</Text>
          {product.originalPrice && (
            <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
          )}
          {product.originalPrice && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>

        <View style={styles.stockInfo}>
          <Text style={styles.stockText}>
            {product.stock > 10 ? '✅ In Stock' : `⚠️ Only ${product.stock} left!`}
          </Text>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>About Product</Text>
          <Text style={styles.description}>
            Fresh and high-quality {product.name.toLowerCase()} delivered directly to your doorstep. 
            Carefully selected for maximum freshness and taste.
          </Text>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
              <Text style={styles.seeAllButton}>
                {showAllReviews ? 'Show Less' : `See All (${reviews.length})`}
              </Text>
            </TouchableOpacity>
          </View>
          
          {reviews.length > 0 ? (
            <>
              <FlatList
                data={showAllReviews ? reviews : reviews.slice(0, 2)}
                renderItem={renderReviewItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
                }
              />
              
              {reviews.length > 2 && !showAllReviews && (
                <TouchableOpacity 
                  style={styles.loadMoreContainer}
                  onPress={() => setShowAllReviews(true)}
                >
                  <Text style={styles.loadMoreText}>+{reviews.length - 2} more reviews</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
          )}
          
          {showReviewForm ? (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormTitle}>Write Your Review</Text>
              <View style={styles.ratingInputContainer}>
                <Text style={styles.ratingLabel}>Your Rating:</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity 
                      key={star}
                      onPress={() => setNewReview({...newReview, rating: star})}
                      onPressIn={() => setTempRating(star)}
                      onPressOut={() => setTempRating(0)}
                    >
                      <Ionicons 
                        name={star <= (tempRating || newReview.rating) ? 'star' : 'star-outline'}
                        size={28} 
                        color="#FFD700"
                        style={styles.starInput}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.commentContainer}>
                <Text style={styles.commentLabel}>Your Review:</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Share your experience with this product..."
                  multiline
                  numberOfLines={4}
                  value={newReview.comment}
                  onChangeText={(text) => setNewReview({...newReview, comment: text})}
                />
              </View>
              <View style={styles.reviewFormButtons}>
                <TouchableOpacity 
                  style={[styles.reviewFormButton, styles.cancelButton]}
                  onPress={() => {
                    setShowReviewForm(false);
                    setNewReview({ rating: 0, comment: '' });
                    setTempRating(0);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.reviewFormButton, styles.submitButton]}
                  onPress={handleReviewSubmit}
                >
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.writeReviewButton}
              onPress={() => setShowReviewForm(true)}
            >
              <Ionicons name="create-outline" size={18} color="#0C831F" />
              <Text style={styles.writeReviewText}>Write a Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  imageContainer: {
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 10,
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rating: {
    fontSize: 14,
    marginRight: 16,
  },
  deliveryTime: {
    fontSize: 14,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stockInfo: {
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20, // Add some bottom padding to ensure content isn't hidden behind tab bar
  },
  // Reviews Section Styles
  reviewsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllButton: {
    color: '#0C831F',
    fontSize: 14,
    fontWeight: '500',
  },
  reviewItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    fontWeight: '600',
    fontSize: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  noReviewsText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 15,
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  loadMoreText: {
    color: '#0C831F',
    fontWeight: '500',
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  writeReviewText: {
    color: '#0C831F',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Review Form Styles
  reviewForm: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
  },
  reviewFormTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  ratingInputContainer: {
    marginBottom: 15,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starInput: {
    marginRight: 5,
  },
  commentContainer: {
    marginBottom: 15,
  },
  commentLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 100,
    fontSize: 14,
    color: '#333',
  },
  reviewFormButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  reviewFormButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginLeft: 10,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#0C831F',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
