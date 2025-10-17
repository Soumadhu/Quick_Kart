import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { categories, products } from '../shared/mockData';
import AuthModal from './AuthModal';

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const filteredProducts = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const handleLogin = async (credentials) => {
    // TODO: Implement actual login logic
    console.log('Login with:', credentials);
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleRegister = async (userData) => {
    // TODO: Implement actual registration logic
    console.log('Register with:', userData);
    // Auto-login after registration
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: item.color + '20' }]}
      onPress={() => navigation.navigate('Categories', { categoryId: item.id })}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <Text style={styles.productImage}>{item.image}</Text>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productUnit}>{item.unit}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{item.price}</Text>
        {item.originalPrice && (
          <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
        )}
      </View>
      <Text style={styles.deliveryTime}>⚡ {item.deliveryTime}</Text>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>ADD</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8C400" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topStrip}>
          <View style={styles.header}>
            <View>
              <Text style={styles.deliveryLabel}>Delivery in 8 minutes</Text>
              <Text style={styles.location}>Home - Mumbai 400001 📍</Text>
            </View>
            <TouchableOpacity 
              style={isLoggedIn ? styles.userButton : styles.authButton}
              onPress={() => isLoggedIn ? handleLogout() : setShowAuthModal(true)}
            >
              {isLoggedIn ? (
                <>
                  <Text style={styles.userIcon}>👤</Text>
                  <Text style={styles.userText}>My Account</Text>
                </>
              ) : (
                <Text style={styles.authButtonText}>Login / Register</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
      <ScrollView style={styles.scrollView}>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Products</Text>
        <FlatList
          numColumns={2}
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.productRow}
          scrollEnabled={false}
        />
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    backgroundColor: '#E6B800',
  },
  topStrip: {
    backgroundColor: '#E6B800',
    paddingTop: 10,
    paddingBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8C400',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  location: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
    color: '#111',
  },
  authButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  authButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  // Add these styles for when user is logged in
  userButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userIcon: {
    marginRight: 6,
    fontSize: 16,
  },
  userText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 12,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productImage: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  deliveryTime: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#F8C400',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
