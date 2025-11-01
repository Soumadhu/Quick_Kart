import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BANNERS_KEY = '@banners_data';

const BannersContext = createContext();

export const BannersProvider = ({ children }) => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBanners = async () => {
    console.log('BannersContext: Loading banners from storage...');
    try {
      const savedBanners = await AsyncStorage.getItem(BANNERS_KEY);
      console.log('BannersContext: Retrieved banners from storage:', savedBanners);
      
      if (savedBanners) {
        const parsedBanners = JSON.parse(savedBanners);
        console.log('BannersContext: Parsed banners:', parsedBanners);
        setBanners(parsedBanners);
      } else {
        console.log('BannersContext: No saved banners found in storage');
        setBanners([]);
      }
    } catch (error) {
      console.error('BannersContext: Error loading banners:', error);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('BannersContext: Initializing...');
    loadBanners();
  }, []);

  const saveBanners = async (bannersToSave) => {
    console.log('BannersContext: Saving banners:', bannersToSave);
    try {
      const stringifiedBanners = JSON.stringify(bannersToSave);
      console.log('BannersContext: Stringified banners for storage:', stringifiedBanners);
      
      await AsyncStorage.setItem(BANNERS_KEY, stringifiedBanners);
      console.log('BannersContext: Successfully saved banners to storage');
      
      setBanners(bannersToSave);
      return true;
    } catch (error) {
      console.error('BannersContext: Error saving banners:', error);
      return false;
    }
  };

  return (
    <BannersContext.Provider value={{ banners, isLoading, saveBanners, loadBanners }}>
      {children}
    </BannersContext.Provider>
  );
};

export const useBanners = () => {
  const context = useContext(BannersContext);
  if (context === undefined) {
    throw new Error('useBanners must be used within a BannersProvider');
  }
  return context;
};

export default BannersContext;
