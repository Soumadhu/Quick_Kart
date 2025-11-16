import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as productService from '../../src/services/productService';
import { categories } from '../../shared/mockData';

// Configure base URL based on platform
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000' 
  : 'http://10.0.2.2:5000';

// Debug logging function
const log = (message, data = '') => {
  if (__DEV__) {
    console.log(`[DarkStore] ${message}`, data);
  }
};

const DarkStore = () => {
  log('Component rendering started');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    description: '',
    category: '1',
    unit: 'pcs',
    stock: '0',
    image: null,
  });
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    log('Component mounted');
    let isMounted = true;
    
    const initialize = async () => {
      try {
        log('Starting to load products...');
        await loadProducts();
        if (isMounted) {
          log('Products loaded successfully', { productCount: products.length });
        }
      } catch (error) {
        log('Error in useEffect:', error);
        if (isMounted) {
          Alert.alert('Error', 'Failed to initialize component: ' + error.message);
        }
      }
    };
    
    initialize();
    
    return () => {
      isMounted = false;
      log('Component unmounted');
    };
  }, []); // Empty dependency array means this runs once on mount

  const loadProducts = async () => {
    log('Starting to load products...');
    try {
      setIsLoading(true);
      log('Calling productService.getProducts()');
      const productsData = await productService.getProducts();
      log('Products data received:', { count: productsData?.length, data: JSON.stringify(productsData, null, 2) });
      
      if (!productsData || !Array.isArray(productsData)) {
        throw new Error('Invalid products data received');
      }
      
      // Ensure all products have required fields
      const processedProducts = productsData.map(product => ({
        id: product.id,
        name: product.name || 'Unnamed Product',
        price: Number(product.price) || 0,
        description: product.description || '',
        image_url: product.image_url || null,
        _isLocalFile: product._isLocalFile || false,
        // Add any other required fields with defaults
        ...product
      }));
      
      setProducts(processedProducts);
      log('Products state updated with', processedProducts.length, 'products');
    } catch (error) {
      console.error('Error in loadProducts:', error);
      Alert.alert('Error', 'Failed to load products. ' + (error.message || 'Please check your connection and try again.'));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData({ ...formData, image: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.price) {
        throw new Error('Name and price are required fields');
      }

      // Validate price format
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      // Validate original price if provided
      let originalPrice = null;
      if (formData.originalPrice) {
        originalPrice = parseFloat(formData.originalPrice);
        if (isNaN(originalPrice) || originalPrice <= 0) {
          throw new Error('Please enter a valid original price');
        }
        if (originalPrice <= price) {
          throw new Error('Original price must be greater than selling price');
        }
      }

      // Validate stock
      const stock = parseInt(formData.stock, 10) || 0;
      if (stock < 0) {
        throw new Error('Stock cannot be negative');
      }

      setIsSubmitting(true);
      
      const productToSave = {
        name: formData.name.trim(),
        price: price,
        originalPrice: originalPrice,
        description: (formData.description || '').trim(),
        category: formData.category || '1',
        unit: formData.unit || 'pcs',
        stock: stock,
        rating: 0,
        deliveryTime: '30-45 min'
      };

      console.log('Attempting to save product:', {
        ...productToSave,
        hasImage: !!formData.image
      });

      const savedProduct = await productService.saveProductWithImage(
        productToSave, 
        formData.image
      );
      
      console.log('Product saved successfully:', savedProduct);

      // Reset form
      setFormData({
        name: '',
        price: '',
        originalPrice: '',
        description: '',
        category: '1',
        unit: 'pcs',
        stock: '0',
        image: null,
      });

      // Refresh the products list
      await loadProducts();

      // Show success message
      Alert.alert(
        'Success', 
        'Product added successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to home screen
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleSubmit:', {
        error: error.message,
        stack: error.stack,
        formData: { ...formData, image: formData.image ? '[HAS_IMAGE]' : 'none' }
      });
      
      let errorMessage = 'Failed to save product';
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      Alert.alert(
        'Delete Product',
        'Are you sure you want to delete this product?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await productService.deleteProduct(productId);
                await loadProducts();
                Alert.alert('Success', 'Product deleted successfully!');
              } catch (error) {
                console.error('Error deleting product:', error);
                Alert.alert('Error', 'Failed to delete product');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing delete confirmation:', error);
    }
  };

  const navigation = useNavigation();

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', { 
      productId: product.id,
      product: product // Pass the entire product object for immediate display
    });
  };

  const renderProductItem = ({ item }) => {
    console.log('Rendering product item:', {
      id: item.id,
      name: item.name,
      image_url: item.image_url,
      hasImage: !!item.image_url,
      isLocalFile: item._isLocalFile
    });
    
    // Helper function to render the image or placeholder
    const renderImage = () => {
      console.log('Rendering image for product:', {
        id: item.id,
        name: item.name,
        image_url: item.image_url,
        isLocalFile: item._isLocalFile,
        API_BASE_URL: API_BASE_URL
      });

      if (!item.image_url) {
        console.log('No image URL provided, showing placeholder');
        return (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name="image" size={32} color="#9CA3AF" />
          </View>
        );
      }

      let source = { uri: '' };
      let imageUrl = item.image_url || '';
      
      try {
        console.log('Processing image URL:', imageUrl);
        
        // Clean up the URL first
        imageUrl = imageUrl.trim();
        
        // Handle blob URLs (local files from image picker)
        if (imageUrl.startsWith('blob:')) {
          console.log('Using blob URL:', imageUrl);
          source = { uri: imageUrl };
        } 
        // Handle local file paths
        else if (item._isLocalFile || imageUrl.startsWith('file:') || imageUrl.startsWith('/')) {
          console.log('Using local file path:', imageUrl);
          source = { uri: imageUrl };
        } 
        // Handle remote URLs
        else if (imageUrl.startsWith('http')) {
          // Check for placeholder URLs that might fail
          if (imageUrl.includes('via.placeholder.com') || imageUrl.includes('placeholder.com')) {
            console.log('Placeholder URL detected, using fallback placeholder');
            return (
              <View style={[styles.productImage, styles.productImagePlaceholder]}>
                <Ionicons name="image" size={32} color="#9CA3AF" />
              </View>
            );
          }
          
          // Clean up any duplicate base URLs
          const baseUrls = [
            'http://localhost:5000',
            'http://10.0.2.2:5000',
            'https://your-production-api.com' // Add production URL if needed
          ];
          
          // Check for and remove duplicate base URLs
          for (const baseUrl of baseUrls) {
            const duplicate = `${baseUrl}${baseUrl}`;
            if (imageUrl.includes(duplicate)) {
              imageUrl = imageUrl.replace(duplicate, baseUrl);
              console.log('Cleaned duplicate base URL:', imageUrl);
            }
          }
          
          console.log('Using remote URL:', imageUrl);
          source = { uri: imageUrl };
        } 
        // Handle relative paths
        else {
          // Clean up the path and ensure no leading slashes
          const cleanPath = imageUrl.replace(/^[\/\\]+/g, '');
          const fullUrl = `${API_BASE_URL}/${cleanPath}`;
          console.log('Constructed full URL from relative path:', fullUrl);
          source = { uri: fullUrl };
        }
      } catch (error) {
        console.error('Error processing image URL:', error);
        console.error('Problematic URL was:', imageUrl);
        // Return a placeholder source to prevent errors
        return (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name="image" size={32} color="#9CA3AF" />
          </View>
        );
      }

      return (
        <Image 
          source={source}
          style={styles.productImage}
          resizeMode="cover"
          onError={(error) => {
            console.log('Image load error:', error.nativeEvent.error);
            console.log('Failed to load image from:', item.image_url);
            // Note: In React Native, you can't dynamically replace the Image component
            // The placeholder will be shown on next render if needed
          }}
        />
      );
    };
    
    return (
      <View style={styles.productItem}>
        <TouchableOpacity 
          style={styles.productContent}
          onPress={() => handleProductPress(item)}
          activeOpacity={0.7}
        >
          {renderImage()}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.productDescription} numberOfLines={1}>
              {item.description || 'No description'}
            </Text>
            <View style={styles.productDetails}>
              <Text style={styles.productPrice}>₹{item.price?.toFixed?.(2) || '0.00'}</Text>
              {item.originalPrice && item.originalPrice > item.price && (
                <Text style={styles.originalPrice}>₹{Number(item.originalPrice).toFixed(2)}</Text>
              )}
              <Text style={styles.productStock}>{item.stock || 0} in stock</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteProduct(item.id);
          }}
        >
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  log('Rendering component', { isLoading, productsCount: products.length });

  // Simple loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Products</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadProducts}
            >
              <Ionicons name="refresh" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heading}>Add New Product</Text>
          
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={pickImage}
            disabled={isSubmitting}
          >
            {formData.image ? (
              <Image 
                source={{ uri: formData.image }} 
                style={styles.previewImage} 
                resizeMode="cover"
              />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={24} color="#4F46E5" />
                <Text style={styles.uploadButtonText}>Upload Image</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Original Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={formData.originalPrice}
                onChangeText={(text) => setFormData({ ...formData, originalPrice: text })}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter product description"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                <Ionicons 
                  name="chevron-down" 
                  size={20} 
                  color="#6B7280" 
                  style={styles.pickerIcon}
                />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={styles.select}
                >
                  {categories && categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pickerContainer}>
                <Ionicons 
                  name="chevron-down" 
                  size={20} 
                  color="#6B7280" 
                  style={styles.pickerIcon}
                />
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  style={styles.select}
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilogram</option>
                  <option value="g">Gram</option>
                  <option value="L">Liter</option>
                  <option value="ml">Milliliter</option>
                  <option value="dozen">Dozen</option>
                  <option value="pack">Pack</option>
                </select>
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Stock</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={formData.stock}
              onChangeText={(text) => setFormData({ ...formData, stock: text })}
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.submitButton, 
              (isSubmitting || !formData.name || !formData.price || !formData.image) && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={isSubmitting || !formData.name || !formData.price || !formData.image}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Product</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>All Products ({products.length})</Text>
          
          {products.length > 0 ? (
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.productsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No products added yet</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#4B5563',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 150,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  uploadButtonText: {
    marginTop: 8,
    color: '#4B5563',
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  productItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  productContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  productStock: {
    fontSize: 14,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginTop: 16,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  pickerContainer: {
    position: 'relative',
  },
  pickerIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  select: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    appearance: 'none',
    paddingRight: 36,
  },
});

export default DarkStore;