import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CATEGORY_SIZE = (width - 64) / 4; // 16px padding on each side, 16px between items

const CategoriesRow = ({ categories = [], onCategoryPress }) => {
  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => onCategoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.categoryIconContainer}>
        <Ionicons name={item.icon} size={24} color="#51CC5E" />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => `category-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    width: CATEGORY_SIZE,
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIconContainer: {
    width: CATEGORY_SIZE * 0.6,
    height: CATEGORY_SIZE * 0.6,
    borderRadius: (CATEGORY_SIZE * 0.6) / 2,
    backgroundColor: '#F2FFF3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
    height: 32,
  },
});

export default CategoriesRow;
