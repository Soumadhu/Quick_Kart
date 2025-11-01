import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useBanners } from '../../context/BannersContext';

export default function BannerManager() {
  const { banners, saveBanners } = useBanners();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState(null);

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
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const addBanner = async () => {
    console.log('BannerManager: Adding new banner...');
    console.log('BannerManager: Current image:', image);
    console.log('BannerManager: Current title:', title);
    console.log('BannerManager: Current subtitle:', subtitle);
    
    if (!image) {
      console.log('BannerManager: No image selected');
      Alert.alert('No image selected', 'Please select an image for the banner');
      return;
    }

    if (!title.trim()) {
      console.log('BannerManager: No title provided');
      Alert.alert('Title required', 'Please enter a title for the banner');
      return;
    }

    try {
      const newBanner = {
        id: Date.now().toString(),
        imageUrl: image,
        title: title.trim(),
        subtitle: subtitle.trim(),
        createdAt: new Date().toISOString(),
      };

      console.log('BannerManager: New banner object created:', newBanner);
      
      const updatedBanners = [...banners, newBanner];
      console.log('BannerManager: Updated banners array:', updatedBanners);
      
      console.log('BannerManager: Calling saveBanners...');
      const success = await saveBanners(updatedBanners);
      
      if (success) {
        console.log('BannerManager: Banner saved successfully');
        // Reset form
        setImage(null);
        setTitle('');
        setSubtitle('');
        Alert.alert('Success', 'Banner added successfully');
      } else {
        console.error('BannerManager: Failed to save banner');
        throw new Error('Failed to save banner');
      }
    } catch (error) {
      console.error('BannerManager: Error in addBanner:', error);
      Alert.alert('Error', 'Failed to add banner: ' + error.message);
    }
  };

  const removeBanner = async (id) => {
    try {
      const updatedBanners = banners.filter(banner => banner.id !== id);
      const success = await saveBanners(updatedBanners);
      
      if (success) {
        Alert.alert('Success', 'Banner removed');
      } else {
        throw new Error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error removing banner:', error);
      Alert.alert('Error', 'Failed to remove banner');
    }
  };

  const renderBannerItem = ({ item }) => (
    <View style={styles.bannerItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
      <View style={styles.bannerInfo}>
        <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.bannerSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        ) : null}
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => removeBanner(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Manage Banners</Text>
      
      <View style={styles.formContainer}>
        <TouchableOpacity 
          style={styles.imagePicker} 
          onPress={pickImage}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#999" />
              <Text>Tap to select an image</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Banner Title (required)"
          value={title}
          onChangeText={setTitle}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Banner Subtitle (optional)"
          value={subtitle}
          onChangeText={setSubtitle}
          multiline
          numberOfLines={2}
        />
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={addBanner}
          disabled={!image || !title.trim()}
        >
          <Text style={styles.addButtonText}>Add Banner</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionSubtitle}>Current Banners ({banners.length})</Text>
      
      {banners.length > 0 ? (
        <FlatList
          data={banners}
          renderItem={renderBannerItem}
          keyExtractor={item => item.id}
          style={styles.bannerList}
          contentContainerStyle={styles.bannerListContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={50} color="#ddd" />
          <Text style={styles.emptyStateText}>No banners added yet</Text>
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
  imagePicker: {
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#51CC5E',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  bannerList: {
    flex: 1,
  },
  bannerListContent: {
    paddingBottom: 24,
  },
  bannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bannerImage: {
    width: 80,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    color: '#999',
    textAlign: 'center',
  },
});
