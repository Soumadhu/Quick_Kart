import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import * as productService from '../src/services/productService';

const AddEditProductScreen = ({ route, navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('1');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { product } = route.params || {};

  useEffect(() => {
    if (product) {
      // If editing an existing product
      setIsEditing(true);
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
      setUnit(product.unit || 'pcs');
      setCategory(product.category || '1');
      setStock(product.stock ? product.stock.toString() : '');
      setImage(product.image || null);
      
      // Set the title in the header
      navigation.setOptions({
        title: 'Edit Product',
      });
    } else {
      navigation.setOptions({
        title: 'Add New Product',
      });
    }
  }, [product]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!name || !price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      const productData = {
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        unit,
        category,
        stock: stock ? parseInt(stock, 10) : 0,
      };

      if (isEditing) {
        productData.id = product.id;
        // Only update the image if a new one was selected
        const imageToUse = image === product.image ? null : image;
        await productService.saveProduct(productData, imageToUse);
      } else {
        await productService.saveProduct(productData, image);
      }

      Alert.alert(
        'Success',
        isEditing ? 'Product updated successfully!' : 'Product added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter product name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter product description"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Original Price (₹)</Text>
          <TextInput
            style={styles.input}
            value={originalPrice}
            onChangeText={setOriginalPrice}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Unit</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={unit}
              onValueChange={(itemValue) => setUnit(itemValue)}
              style={styles.picker}
              dropdownIconColor="#666"
            >
              <Picker.Item label="Pieces" value="pcs" />
              <Picker.Item label="Kilogram" value="kg" />
              <Picker.Item label="Gram" value="g" />
              <Picker.Item label="Liter" value="L" />
              <Picker.Item label="Milliliter" value="ml" />
              <Picker.Item label="Dozen" value="dozen" />
              <Picker.Item label="Pack" value="pack" />
            </Picker>
          </View>
        </View>

        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Stock</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            style={styles.picker}
            dropdownIconColor="#666"
          >
            <Picker.Item label="Fruits & Vegetables" value="1" />
            <Picker.Item label="Dairy & Breakfast" value="2" />
            <Picker.Item label="Snacks & Munchies" value="3" />
            <Picker.Item label="Beverages" value="4" />
            <Picker.Item label="Instant & Frozen" value="5" />
            <Picker.Item label="Bakery & Biscuits" value="6" />
            <Picker.Item label="Cleaning & Household" value="7" />
            <Picker.Item label="Personal Care" value="8" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Product Image</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera" size={32} color="#9CA3AF" />
              <Text style={styles.placeholderText}>Tap to add an image</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {isEditing ? 'Update Product' : 'Add Product'}
          </Text>
        )}
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity
          style={[styles.deleteButton, isLoading && styles.buttonDisabled]}
          onPress={async () => {
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
                        await productService.deleteProduct(product.id);
                        Alert.alert(
                          'Success',
                          'Product deleted successfully!',
                          [
                            {
                              text: 'OK',
                              onPress: () => navigation.goBack(),
                            },
                          ]
                        );
                      } catch (error) {
                        console.error('Error deleting product:', error);
                        Alert.alert('Error', 'Failed to delete product. Please try again.');
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error showing delete confirmation:', error);
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.deleteButtonText}>Delete Product</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  pickerContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#111827',
  },
  imagePicker: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderText: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddEditProductScreen;
