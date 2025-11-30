import api from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const registerRider = async (riderData) => {
  try {
    // Ensure all required fields are present and properly formatted
    const requestData = {
      name: riderData.name,
      email: riderData.email,
      phone: riderData.phone,
      password: riderData.password,
      vehicle_number: riderData.vehicle_number
    };

    console.log('Sending registration request with data:', requestData);
    const response = await api.post('/api/riders/register', requestData);
    return response.data;
  } catch (error) {
    console.error('Registration error details:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data?.error || 
                         error.response.data?.message || 
                         'Registration failed. Please check your input.';
      throw new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message || 'An error occurred during registration');
    }
  }
};

const loginRider = async (credentials) => {
  try {
    console.log('[RiderService] Logging in with credentials:', credentials);
    console.log('[RiderService] API base URL:', api.defaults.baseURL);
    
    const response = await api.post('/api/riders/login', credentials);
    console.log('[RiderService] Login response:', response.status, response.data);
    
    // If login is successful, store the token and user data
    if (response.data && response.data.token) {
      await AsyncStorage.setItem('riderToken', response.data.token);
      
      // Store user data if available
      if (response.data.rider) {
        await AsyncStorage.setItem('riderData', JSON.stringify(response.data.rider));
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    if (error.response) {
      const errorMessage = error.response.data?.error || 'Invalid email or password';
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'An error occurred during login');
    }
  }
};

const getRiderProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        throw new Error('session_expired');
      }
      throw new Error(error.response.data?.error || 'Failed to fetch profile');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'An error occurred while fetching profile');
    }
  }
};

const updateRiderProfile = async (profileData, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('riderToken');
    let dataToSend = profileData;
    let isFileUpload = false;
    
    // Check if this is a file upload by checking for FormData or file object
    if (profileData instanceof FormData || 
        (typeof profileData === 'object' && 
         profileData.uri && 
         (profileData.type || '').startsWith('image/'))) {
      isFileUpload = true;
      
      // If it's not already a FormData object, create one
      if (!(profileData instanceof FormData)) {
        const formData = new FormData();
        formData.append('profile_picture', profileData);
        dataToSend = formData;
      }
    } else if (typeof profileData === 'object') {
      // For non-file updates, send as JSON
      dataToSend = {};
      
      // Map the fields to match the backend expectations
      if (profileData.name) dataToSend.name = profileData.name;
      if (profileData.email) dataToSend.email = profileData.email;
      if (profileData.phone) dataToSend.phone = profileData.phone;
      if (profileData.vehicle) dataToSend.vehicle_model = profileData.vehicle;
      if (profileData.vehicle_number) dataToSend.vehicle_number = profileData.vehicle_number;
      if (profileData.vehicleNumber) dataToSend.vehicle_number = profileData.vehicleNumber;
    }
    
    const config = {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': isFileUpload ? 'multipart/form-data' : 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };
    
    // For debugging
    if (isFileUpload) {
      console.log('Sending file upload request to /profile');
    } else {
      console.log('Sending update request to /profile with data:', dataToSend);
    }
    
    const response = await api.put('/profile', dataToSend, config);
    console.log('Update response:', response.data);
    
    // Update stored rider data if available
    if (response.data && response.data.rider) {
      const currentData = await AsyncStorage.getItem('riderData');
      let riderData = currentData ? JSON.parse(currentData) : {};
      
      // Update only the changed fields
      const updatedRider = { ...riderData, ...response.data.rider };
      await AsyncStorage.setItem('riderData', JSON.stringify(updatedRider));
    }
    
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.response) {
      const errorMessage = error.response.data?.error || 
                         error.response.data?.message || 
                         'Failed to update profile';
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'An error occurred while updating profile');
    }
  }
};

export default {
  registerRider,
  loginRider,
  getRiderProfile,
  updateRiderProfile,
};