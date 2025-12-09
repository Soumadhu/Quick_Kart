import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEYS = {
  AUTH: '@auth_token',
  RIDER: 'riderToken',
  USER: 'userToken'
};
const USER_KEY = '@user_data';

// Store the authentication token
const storeToken = async (token, userType = 'user') => {
  try {
    const key = userType === 'rider' ? TOKEN_KEYS.RIDER : TOKEN_KEYS.USER;
    // Store in both the new key and legacy key for backward compatibility
    await AsyncStorage.multiSet([
      [key, token],
      [TOKEN_KEYS.AUTH, token] // Legacy key
    ]);
    return true;
  } catch (error) {
    console.error('Error storing auth token:', error);
    return false;
  }
};

// Get the stored authentication token
const getAuthToken = async () => {
  try {
    // First try to get from any of the possible token locations
    const [userToken, riderToken, legacyToken] = await AsyncStorage.multiGet([
      TOKEN_KEYS.USER,
      TOKEN_KEYS.RIDER,
      TOKEN_KEYS.AUTH // Legacy key
    ]);

    // Return the first valid token found
    return userToken[1] || riderToken[1] || legacyToken[1] || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Remove the authentication token (logout)
const removeToken = async () => {
  try {
    await AsyncStorage.multiRemove([
      TOKEN_KEYS.AUTH,
      TOKEN_KEYS.USER,
      TOKEN_KEYS.RIDER
    ]);
    return true;
  } catch (error) {
    console.error('Error removing auth tokens:', error);
    return false;
  }
};

// Store user data
const storeUser = async (userData) => {
  try {
    const jsonValue = JSON.stringify(userData);
    await AsyncStorage.setItem(USER_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

// Get stored user data
const getUser = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Clear all auth-related data
const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

export {
  storeToken,
  getAuthToken,
  removeToken,
  storeUser,
  getUser,
  clearAuthData
};
