import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the authentication token from AsyncStorage
export const getAuthToken = async () => {
  try {
    // Check all possible token locations
    const [token, userToken, riderToken] = await AsyncStorage.multiGet([
      'token',           // Default token key
      'userToken',       // User token
      'riderToken'       // Rider token
    ]);
    
    // Return the first valid token found
    const validToken = token[1] || userToken[1] || riderToken[1];
    
    if (validToken) {
      // Normalize the token (remove quotes if present)
      const normalizedToken = validToken.replace(/^"(.*)"$/, '$1');
      // If we found a token in a non-default location, update it to the default location
      if (token[1] !== normalizedToken) {
        await AsyncStorage.setItem('token', normalizedToken);
      }
      return normalizedToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Set the authentication token in AsyncStorage
export const setAuthToken = async (token) => {
  try {
    // Store token with the key 'token' for consistency
    await AsyncStorage.setItem('token', token);
    // Remove any legacy 'userToken' if it exists
    await AsyncStorage.removeItem('userToken');
    return true;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return false;
  }
};

// Remove the authentication token from AsyncStorage
export const removeAuthToken = async () => {
  try {
    // Remove both token keys to ensure complete cleanup
    await AsyncStorage.multiRemove(['token', 'userToken']);
    return true;
  } catch (error) {
    console.error('Error removing auth token:', error);
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};
