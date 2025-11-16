import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://192.168.0.102:5000/api' 
  : 'http://localhost:5000/api';

const STATIC_BASE_URL = Platform.OS === 'web' 
  ? 'http://192.168.0.102:5000' 
  : 'http://localhost:5000';

export const fetchCategories = async () => {
  // Try different URLs in order of preference
  const possibleUrls = [
    'http://192.168.0.102:5000/api/categories',
    'http://10.0.2.2:5000/api/categories',
    'http://DESKTOP-KIV0NJ6:5000/api/categories', // Try computer hostname
    'http://localhost:5000/api/categories'
  ];

  for (const url of possibleUrls) {
    try {
      console.log('Trying to fetch categories from:', url);
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const categories = await response.json();
        console.log('Categories fetched successfully:', categories.length);
        
        // Extract base URL from the working URL
        const baseUrl = url.replace('/api/categories', '');
        
        // Add full image URLs to categories
        return categories.map(category => ({
          ...category,
          imageUrl: category.image ? `${baseUrl}/${category.image}` : null
        }));
      }
    } catch (error) {
      console.log(`Failed to fetch from ${url}:`, error.message);
      continue; // Try next URL
    }
  }
  
  // All URLs failed, return fallback data
  console.error('All URLs failed, using fallback mock categories');
  return [
    { id: 1, name: 'Vegetables & Fruits', image: null, imageUrl: null },
    { id: 2, name: 'Dairy & Bakery', image: null, imageUrl: null },
    { id: 3, name: 'Electronics', image: null, imageUrl: null },
    { id: 4, name: 'Home & Kitchen', image: null, imageUrl: null },
    { id: 5, name: 'Personal Care', image: null, imageUrl: null }
  ];
};

export const getCategoryImageUrl = (category) => {
  if (!category.image) return null;
  return `${STATIC_BASE_URL}/${category.image}`;
};
