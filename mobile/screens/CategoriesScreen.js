import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addToCart, removeFromCart, updateCartQuantity, getCart, subscribeToCartUpdates } from '../shared/cartService';
import * as categoryService from '../src/services/categoryService';
import * as productService from '../src/services/productService';
import * as Haptics from 'expo-haptics';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');
const CATEGORY_CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function CategoriesScreen({ navigation, route }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const nav = useNavigation();

  useEffect(() => {
    loadData();
    
    // Load cart items
    const loadCart = () => {
      const cart = getCart();
      setCartItems(cart);
    };
    loadCart();

    // Subscribe to cart updates
    const unsubscribe = subscribeToCartUpdates(loadCart);
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesData, productsData] = await Promise.all([
        categoryService.fetchCategories(),
        productService.getProducts()
      ]);
      
      // Add subcategories to main categories
      const categoriesWithSubcategories = categoriesData.map(category => {
        let subcategories = [];
        
        // Define subcategories based on main category
        switch(category.name) {
          case 'Vegetables & Fruits':
            subcategories = [
              { id: `${category.id}-veg`, name: 'Vegetables', parentId: category.id },
              { id: `${category.id}-fruit`, name: 'Fruits', parentId: category.id }
            ];
            break;
          case 'Electronics':
            subcategories = [
              { id: `${category.id}-mobile`, name: 'Mobile Phones', parentId: category.id },
              { id: `${category.id}-laptop`, name: 'Laptops', parentId: category.id },
              { id: `${category.id}-accessories`, name: 'Accessories', parentId: category.id }
            ];
            break;
          case 'Home & Kitchen':
            subcategories = [
              { id: `${category.id}-kitchen`, name: 'Kitchen', parentId: category.id },
              { id: `${category.id}-home`, name: 'Home Decor', parentId: category.id }
            ];
            break;
          case 'Personal Care':
            subcategories = [
              { id: `${category.id}-skincare`, name: 'Skin Care', parentId: category.id },
              { id: `${category.id}-haircare`, name: 'Hair Care', parentId: category.id }
            ];
            break;
          default:
            subcategories = [];
        }
        
        return {
          ...category,
          subcategories
        };
      });
      
      setCategories(categoriesWithSubcategories);
      setProducts(productsData);
      
      // Set initial category from route params or first category
      const initialCategory = route.params?.categoryId 
        ? categoriesWithSubcategories.find(c => c.id === route.params.categoryId)
        : categoriesWithSubcategories[0];
      setSelectedCategory(initialCategory);
      
      // Auto-select first subcategory if available
      if (initialCategory?.subcategories?.length > 0) {
        setSelectedSubcategory(initialCategory.subcategories[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product, quantity) => {
    if (quantity <= 0) {
      removeFromCart(product.id);
    } else {
      updateCartQuantity(product.id, quantity);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveFromCart = (product, quantity) => {
    if (quantity <= 0) {
      removeFromCart(product.id);
    } else {
      updateCartQuantity(product.id, quantity);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getProductsForSubcategory = (subcategory) => {
    // Show all products regardless of category
    return products;
  };

  const renderCategory = ({ item }) => {
    const isSelected = selectedCategory?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryCard, isSelected && styles.selectedCategoryCard]}
        onPress={() => {
          setSelectedCategory(item);
          // Auto-select first subcategory when category changes
          if (item.subcategories?.length > 0) {
            setSelectedSubcategory(item.subcategories[0]);
          } else {
            setSelectedSubcategory(null);
          }
        }}
        activeOpacity={0.8}
      >
        <View style={styles.categoryImageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.categoryImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.categoryPlaceholder}>
              <Text style={styles.categoryPlaceholderText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSubcategory = ({ item }) => {
    const isSelected = selectedSubcategory?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.subcategoryCard, isSelected && styles.selectedSubcategoryCard]}
        onPress={() => setSelectedSubcategory(item)}
        activeOpacity={0.8}
      >
        <Text style={[styles.subcategoryName, isSelected && styles.selectedSubcategoryName]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item }) => {
    const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
    const cartQuantity = cartItem?.quantity || 0;
    
    return (
      <ProductCard
        product={item}
        cartQuantity={cartQuantity}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onPress={() => nav.navigate('ProductDetails', { productId: item.id })}
      />
    );
  };

  const categoryProducts = selectedSubcategory 
    ? getProductsForSubcategory(selectedSubcategory)
    : products; // Show all products when no subcategory is selected

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Categories Grid */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.categoriesList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Subcategories Horizontal List */}
      {selectedCategory?.subcategories?.length > 0 && (
        <View style={styles.subcategoriesContainer}>
          <FlatList
            data={selectedCategory.subcategories}
            renderItem={renderSubcategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subcategoriesList}
          />
        </View>
      )}

      {/* Selected Category/Subcategory Header */}
      {selectedCategory && (
        <View style={[styles.categoryHeader, { backgroundColor: '#F2FFF3' }]}>
          <Text style={styles.categoryTitle}>
            {selectedSubcategory ? selectedSubcategory.name : selectedCategory.name}
          </Text>
          <Text style={styles.productCount}>
            {categoryProducts.length} products
          </Text>
        </View>
      )}

      {/* Products Grid */}
      <View style={styles.productsGrid}>
        <FlatList
          data={categoryProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          key="3-columns"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Subcategories styles
  subcategoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  subcategoriesList: {
    paddingHorizontal: 16,
  },
  subcategoryCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedSubcategoryCard: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  subcategoryName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedSubcategoryName: {
    color: '#fff',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  // Categories grid styles
  categoriesContainer: {
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  categoriesList: {
    padding: 16,
  },
  categoryCard: {
    width: CATEGORY_CARD_WIDTH - 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategoryCard: {
    backgroundColor: '#F2FFF3',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  categoryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2FFF3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  categoryPlaceholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#666',
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  categoryHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  productCount: {
    fontSize: 14,
    color: '#666',
  },
  productsGrid: {
    flex: 1,
  },
});
