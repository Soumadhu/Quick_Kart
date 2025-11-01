import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, TextInput, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// In-memory storage for best seller segments
let bestSellersData = [];

export default function BestSellersManager({ navigation }) {
  const [segments, setSegments] = useState([...bestSellersData]);
  const [segmentName, setSegmentName] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = () => {
    try {
      setSegments([...bestSellersData]);
    } catch (error) {
      console.error('Error loading segments:', error);
      Alert.alert('Error', 'Failed to load segments');
    }
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 4 - selectedImages.length,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset, index) => ({
          id: `img-${Date.now()}-${index}`,
          uri: asset.uri,
        }));
        
        const updatedImages = [...selectedImages, ...newImages].slice(0, 4);
        setSelectedImages(updatedImages);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (id) => {
    setSelectedImages(selectedImages.filter(img => img.id !== id));
  };

  const addSegment = () => {
    if (!segmentName.trim()) {
      Alert.alert('Segment name required', 'Please enter a name for this segment');
      return;
    }

    if (selectedImages.length !== 4) {
      Alert.alert('Images required', 'Please select exactly 4 images for this segment');
      return;
    }

    try {
      const newSegment = {
        id: Date.now().toString(),
        name: segmentName.trim(),
        images: [...selectedImages],
        itemCount: 0, // This will be updated when items are added to this segment
        createdAt: new Date().toISOString(),
      };

      bestSellersData.push(newSegment);
      setSegments([...bestSellersData]);
      
      // Reset form
      setSegmentName('');
      setSelectedImages([]);
      
      Alert.alert('Success', 'Best Sellers segment added successfully');
    } catch (error) {
      console.error('Error adding segment:', error);
      Alert.alert('Error', 'Failed to add segment');
    }
  };

  const removeSegment = (id) => {
    try {
      bestSellersData = bestSellersData.filter(segment => segment.id !== id);
      setSegments([...bestSellersData]);
      Alert.alert('Success', 'Segment removed');
    } catch (error) {
      console.error('Error removing segment:', error);
      Alert.alert('Error', 'Failed to remove segment');
    }
  };

  const renderImageItem = ({ item }) => (
    <View style={styles.imageItem}>
      <Image source={{ uri: item.uri }} style={styles.imageThumbnail} />
      <TouchableOpacity 
        style={styles.removeImageButton}
        onPress={() => removeImage(item.id)}
      >
        <Ionicons name="close-circle" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  const renderSegmentItem = ({ item }) => (
    <View style={styles.segmentItem}>
      <View style={styles.segmentHeader}>
        <Text style={styles.segmentName}>{item.name}</Text>
        <Text style={styles.segmentCount}>{item.images.length} items</Text>
      </View>
      
      <View style={styles.segmentImages}>
        {item.images.map((img, index) => (
          <Image 
            key={index} 
            source={{ uri: img.uri }} 
            style={styles.segmentImage} 
          />
        ))}
      </View>
      
      <View style={styles.segmentActions}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => navigation.navigate('SegmentItems', { segmentId: item.id, segmentName: item.name })}
        >
          <Text style={styles.viewButtonText}>View Items ({item.itemCount})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => removeSegment(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Manage Best Sellers</Text>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Segment Name (e.g., Women Care, Electronics, Grocery)"
          value={segmentName}
          onChangeText={setSegmentName}
        />
        
        <Text style={styles.imagePickerLabel}>Select exactly 4 images for this segment:</Text>
        
        {selectedImages.length > 0 ? (
          <FlatList
            data={selectedImages}
            renderItem={renderImageItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageList}
          />
        ) : null}
        
        {selectedImages.length < 4 && (
          <TouchableOpacity 
            style={styles.addImagesButton}
            onPress={pickImages}
          >
            <Ionicons name="images-outline" size={24} color="#51CC5E" />
            <Text style={styles.addImagesText}>
              {selectedImages.length === 0 
                ? 'Add 4 Images' 
                : `Add ${4 - selectedImages.length} more image(s)`}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.addButton, (!segmentName.trim() || selectedImages.length !== 4) && styles.addButtonDisabled]}
          onPress={addSegment}
          disabled={!segmentName.trim() || selectedImages.length !== 4}
        >
          <Text style={styles.addButtonText}>Create Segment</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionSubtitle}>Current Segments ({segments.length})</Text>
      
      {segments.length > 0 ? (
        <FlatList
          data={segments}
          renderItem={renderSegmentItem}
          keyExtractor={item => item.id}
          style={styles.segmentList}
          contentContainerStyle={styles.segmentListContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="grid-outline" size={50} color="#ddd" />
          <Text style={styles.emptyStateText}>No segments added yet</Text>
          <Text style={styles.emptyStateSubtext}>Create your first best sellers segment above</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#555',
  },
  formContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  imagePickerLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  imageList: {
    paddingVertical: 8,
  },
  imageItem: {
    position: 'relative',
    marginRight: 10,
  },
  imageThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  addImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#51CC5E',
    borderStyle: 'dashed',
    borderRadius: 6,
    padding: 20,
    marginBottom: 16,
  },
  addImagesText: {
    marginLeft: 8,
    color: '#51CC5E',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#51CC5E',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  segmentList: {
    flex: 1,
  },
  segmentListContent: {
    paddingBottom: 24,
  },
  segmentItem: {
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
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  segmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  segmentCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  segmentImages: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  segmentImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  segmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  viewButton: {
    padding: 6,
  },
  viewButtonText: {
    color: '#51CC5E',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});
