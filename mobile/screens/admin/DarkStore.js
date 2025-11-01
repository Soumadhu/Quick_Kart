import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DarkStore = () => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Grocery',
    image: null,
  });
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const storedProducts = await AsyncStorage.getItem('darkStoreProducts');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const pickImage = async () => {
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
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.image) {
      Alert.alert('Error', 'Please fill in all required fields and select an image');
      return;
    }

    setIsLoading(true);
    try {
      const newProduct = {
        id: Date.now().toString(),
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        image: formData.image,
        isDarkStore: true,
        // Add required fields for product display
        originalPrice: null,
        unit: '1 pc',
        stock: 100,
        rating: 4.5,
        deliveryTime: '10 mins'
      };

      // Get existing products first
      const existingProducts = await AsyncStorage.getItem('darkStoreProducts');
      const productsArray = existingProducts ? JSON.parse(existingProducts) : [];
      
      // Add new product
      const updatedProducts = [...productsArray, newProduct];
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem('darkStoreProducts', JSON.stringify(updatedProducts));
      
      // Update local state
      setProducts(updatedProducts);
      
      // Reset form
      setFormData({
        name: '',
        price: '',
        description: '',
        category: 'Grocery',
        image: null,
      });
      
      Alert.alert('Success', 'Product added successfully!');
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Product</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter product name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Price (₹) *</Text>
        <TextInput
          style={styles.input}
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9.]/g, '') })}
          placeholder="Enter price"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Enter product description"
          multiline
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerText}>
            {formData.category}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Product Image *</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {formData.image ? (
            <Image source={{ uri: formData.image }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={32} color="#666" />
              <Text style={styles.imagePlaceholderText}>Tap to select an image</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Adding...' : 'Add Product'}
        </Text>
      </TouchableOpacity>

      <View style={styles.productsList}>
        <Text style={styles.sectionTitle}>Your Products ({products.length})</Text>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
              <Text style={styles.productCategory}>{product.category}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#666',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  submitButton: {
    backgroundColor: '#0C831F',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0d8b3',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productsList: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C831F',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
});

export default DarkStore;
