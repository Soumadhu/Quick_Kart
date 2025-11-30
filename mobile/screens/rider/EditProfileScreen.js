import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import riderService from '../../src/services/riderService';
import { colors } from '../../src/theme';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { 
    field, 
    currentValue = '', 
    title = 'Edit Profile',
    fieldLabel = '',
    fieldType = 'text',
    keyboardType = 'default',
    additionalData = {}
  } = route.params || {};
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicle: '',
    vehicleNumber: additionalData.vehicleNumber || '',
    profile_picture: null
  });
  
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [currentFieldValue, setCurrentFieldValue] = useState(currentValue);

  // Set the title in the header
  useEffect(() => {
    navigation.setOptions({
      title: title,
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
      },
    });
    
    // If we have a current value, set it
    if (currentValue) {
      setCurrentFieldValue(currentValue);
    }
    
    // If it's a photo field, set up the image picker
    if (field === 'photo') {
      pickImage();
    }
  }, [navigation, title, field, currentValue]);
  
  // Fetch profile data if not provided
  useEffect(() => {
    if (field && !currentValue) {
      fetchProfileData();
    }
  }, [field]);

  const fetchProfileData = async () => {
    try {
      const response = await riderService.getRiderProfile();
      if (response && response.rider) {
        const { name, email, phone, vehicle, vehicle_number, profile_picture } = response.rider;
        setFormData({
          name: name || '',
          email: email || '',
          phone: phone || '',
          vehicle: vehicle || '',
          vehicleNumber: vehicle_number || '',
          profile_picture: profile_picture || null
        });
        if (profile_picture) {
          setImage({ uri: profile_picture });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile data');
      console.error('Error fetching profile:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage({ uri: result.assets[0].uri });
        await handleSubmit({ profile_picture: result.assets[0] });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image');
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (overrideData = null) => {
    try {
      setLoading(true);
      
      let dataToSubmit;
      
      if (overrideData) {
        // For image uploads
        dataToSubmit = overrideData;
      } else {
        // For regular form fields
        dataToSubmit = { [field]: currentFieldValue };
        
        // Handle vehicle details together
        if (field === 'vehicle' && additionalData.vehicleNumber) {
          dataToSubmit.vehicleNumber = additionalData.vehicleNumber;
        }
      }
      
      // Prepare submission data
      const submissionData = {
        ...formData,
        vehicle_number: formData.vehicleNumber,
        ...dataToSubmit
      };

      // If there's a new image, handle file upload
      if ((image && image.uri) || (overrideData && overrideData.profile_picture)) {
        // Create form data for file upload
        const formDataToSend = new FormData();
        const imageUri = overrideData?.profile_picture?.uri || image.uri;
        
        // Extract file name and type from URI
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formDataToSend.append('profile_picture', {
          uri: imageUri,
          name: `profile_${Date.now()}.${fileType}`,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`
        });
        
        // Append other fields
        Object.keys(submissionData).forEach(key => {
          if (key !== 'profile_picture') {
            formDataToSend.append(key, submissionData[key]);
          }
        });

        console.log('Sending profile update with image:', formDataToSend);
        
        // Make API call to update with image
        const response = await riderService.updateRiderProfile(formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response && response.success) {
          Alert.alert('Success', 'Profile updated successfully');
          // Navigate back to the Profile tab in RiderTabs
          navigation.navigate('RiderTabs', { 
            screen: 'Profile',
            params: {
              updatedProfile: {
                ...submissionData,
                profile_picture: response.rider?.profile_picture || imageUri
              },
              refresh: true
            }
          });
        } else {
          throw new Error(response?.error || 'Failed to update profile');
        }
      } else {
        // Update without image
        const response = await riderService.updateRiderProfile(submissionData);
        
        if (response && response.success) {
          Alert.alert('Success', 'Profile updated successfully');
          // Navigate back to the Profile tab in RiderTabs
          navigation.navigate('RiderTabs', { 
            screen: 'Profile',
            params: {
              updatedProfile: response.rider || submissionData,
              refresh: true
            }
          });
        } else {
          throw new Error(response?.error || 'Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const renderField = () => {
    if (field === 'photo') {
      return (
        <View style={styles.photoContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
            {image ? (
              <Image source={image} style={styles.profileImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Icon name="add-a-photo" size={40} color="#666" />
                <Text style={styles.photoText}>Add Profile Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Render other fields based on the field parameter
    const fields = {
      name: (
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => handleChange('name', text)}
          placeholder="Full Name"
        />
      ),
      email: (
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      ),
      phone: (
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => handleChange('phone', text)}
          placeholder="Phone Number"
          keyboardType="phone-pad"
        />
      ),
      vehicle: (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.vehicle}
            onValueChange={(itemValue) => handleChange('vehicle', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Vehicle Type" value="" />
            <Picker.Item label="Bicycle" value="bicycle" />
            <Picker.Item label="Bike" value="bike" />
            <Picker.Item label="Scooter" value="scooter" />
            <Picker.Item label="Car" value="car" />
          </Picker>
        </View>
      ),
      vehicleNumber: (
        <TextInput
          style={styles.input}
          value={formData.vehicleNumber}
          onChangeText={(text) => handleChange('vehicleNumber', text)}
          placeholder="Vehicle Number"
        />
      ),
    };

    return (
      <View style={styles.formContainer}>
        {fields[field]}
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getTitle = () => {
    if (field === 'photo') return 'Update Profile Photo';
    if (field === 'name') return 'Edit Name';
    if (field === 'email') return 'Edit Email';
    if (field === 'phone') return 'Edit Phone';
    if (field === 'vehicle') return 'Edit Vehicle Type';
    if (field === 'vehicleNumber') return 'Edit Vehicle Number';
    return 'Edit Profile';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.content}>
        {renderField()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 30,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  photoButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 30,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  formContainer: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
