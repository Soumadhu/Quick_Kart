import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileContext = createContext();

const PROFILE_STORAGE_KEY = '@user_profile';

const defaultProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  location: null,
  lastUpdated: null,
};

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from storage on mount and when user changes
  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      // Reset profile when user logs out
      setProfile(defaultProfile);
    }
  }, [user]);

  // Update location when user changes
  useEffect(() => {
    let isMounted = true;
    
    const updateLocation = async () => {
      if (user) {
        await startLocationUpdates();
      } else {
        setLocation(null);
      }
    };
    
    updateLocation();
    
    return () => {
      isMounted = false;
      stopLocationUpdates();
    };
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        // Merge with user data if available
        const updatedProfile = {
          ...parsedProfile,
          email: user?.email || parsedProfile.email,
          name: user?.displayName || user?.firstName ? 
            `${user.firstName} ${user.lastName || ''}`.trim() : 
            parsedProfile.name
        };
        
        setProfile(updatedProfile);
      } else if (user) {
        // Initialize with user data if no profile exists
        const newProfile = {
          ...defaultProfile,
          email: user.email || '',
          name: user.displayName || (user.firstName ? 
            `${user.firstName} ${user.lastName || ''}`.trim() : ''),
          phone: user.phone || ''
        };
        
        await saveProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (user) {
        // Fallback to user data if there's an error loading profile
        setProfile({
          ...defaultProfile,
          email: user.email || '',
          name: user.displayName || (user.firstName ? 
            `${user.firstName} ${user.lastName || ''}`.trim() : '')
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (newProfile) => {
    try {
      const updatedProfile = {
        ...profile,
        ...newProfile,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  const startLocationUpdates = async () => {
    try {
      console.log('Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const errorMsg = 'Permission to access location was denied';
        console.warn(errorMsg);
        setLocationError(errorMsg);
        return false;
      }

      // First get the current location immediately
      console.log('Getting current location...');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('Current location:', currentLocation.coords);
      setLocation(currentLocation);
      
      // Only update profile if location changed significantly
      const shouldUpdateProfile = !profile?.location || 
        (Math.abs(profile.location.latitude - currentLocation.coords.latitude) > 0.0001 ||
         Math.abs(profile.location.longitude - currentLocation.coords.longitude) > 0.0001);
      
      if (shouldUpdateProfile) {
        console.log('Saving updated location to profile...');
        await saveProfile({
          ...profile,
          location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
        });
      }
      
      // Then set up the watcher for future updates
      console.log('Setting up location watcher...');
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 10, // 10 meters
        },
        (newLocation) => {
          console.log('Location updated:', newLocation.coords);
          setLocation(newLocation);
          
          // Update profile with significant location changes
          if (profile?.location && 
              (Math.abs(profile.location.latitude - newLocation.coords.latitude) > 0.001 ||
               Math.abs(profile.location.longitude - newLocation.coords.longitude) > 0.001)) {
            console.log('Significant location change, updating profile...');
            saveProfile({
              ...profile,
              location: {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              },
            });
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Error getting location');
    }
  };

  const stopLocationUpdates = () => {
    // Location.watchPositionAsync returns a subscription that can be removed
    // We'll need to store the subscription if we want to remove it
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        location,
        locationError,
        isLoading,
        saveProfile,
        updateLocation: (newLocation) => {
          setLocation(newLocation);
          return saveProfile({
            ...profile,
            location: {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            },
          });
        },
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export default ProfileContext;
