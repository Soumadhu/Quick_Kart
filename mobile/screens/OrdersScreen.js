import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Helper function to get icon for product type
const getProductIcon = (productName) => {
  const name = productName.toLowerCase();
  
  if (name.includes('apple')) return { type: 'ionicons', name: 'md-apple' };
  if (name.includes('banana')) return { type: 'ionicons', name: 'banana' };
  if (name.includes('milk')) return { type: 'material', name: 'local-drink' };
  if (name.includes('bread')) return { type: 'material', name: 'breakfast' };
  if (name.includes('rice')) return { type: 'material', name: 'rice' };
  if (name.includes('egg')) return { type: 'ionicons', name: 'egg' };
  
  // Default icon
  return { type: 'material', name: 'shopping-bag' };
};

// Mock order data - replace with actual API call in production
const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2023-001',
    date: '2023-10-20',
    status: 'Delivered',
    items: [
      { id: '101', name: 'Fresh Apples', quantity: 2, price: 120 },
      { id: '102', name: 'Banana Bunch', quantity: 1, price: 45 },
    ],
    total: 285,
    deliveryAddress: '123 Main St, City, Country',
  },
  {
    id: '2',
    orderNumber: 'ORD-2023-002',
    date: '2023-10-18',
    status: 'In Transit',
    items: [
      { id: '201', name: 'Milk 1L', quantity: 2, price: 50 },
      { id: '202', name: 'Bread', quantity: 1, price: 35 },
    ],
    total: 135,
    deliveryAddress: '123 Main St, City, Country',
  },
];

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchOrders = async () => {
      try {
        // In a real app, you would fetch this from your backend
        // const response = await fetch('your-api-endpoint/orders');
        // const data = await response.json();
        setOrders(mockOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const renderProductIcon = (productName) => {
    const icon = getProductIcon(productName);
    const size = 20;
    const color = '#666';
    
    switch(icon.type) {
      case 'ionicons':
        return <Ionicons name={icon.name} size={size} color={color} style={styles.productIcon} />;
      case 'material':
        return <MaterialIcons name={icon.name} size={size} color={color} style={styles.productIcon} />;
      case 'material-community':
        return <MaterialCommunityIcons name={icon.name} size={size} color={color} style={styles.productIcon} />;
      default:
        return <MaterialIcons name="shopping-bag" size={size} color={color} style={styles.productIcon} />;
    }
  };

  const renderOrderItem = ({ item }) => {
    const statusStyles = [
      styles.statusBadge,
      item.status === 'Delivered' ? styles.statusDelivered : 
      item.status === 'In Transit' ? styles.statusInTransit :
      styles.statusProcessing
    ];

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
          <Text style={statusStyles}>
            {item.status}
          </Text>
        </View>
        
        <Text style={styles.orderDate}>
          Placed on {new Date(item.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Text>
        
        <View style={styles.itemsContainer}>
          {item.items.slice(0, 2).map((product, index) => {
            const icon = renderProductIcon(product.name);
            return (
              <View key={`${item.id}-${index}`} style={styles.productItem}>
                {icon}
                <Text style={styles.productName} numberOfLines={1}>
                  {product.quantity}x {product.name}
                </Text>
              </View>
            );
          })}
          {item.items.length > 2 && (
            <Text style={styles.moreItems}>
              +{item.items.length - 2} more {item.items.length === 3 ? 'item' : 'items'}
            </Text>
          )}
        </View>
        
        <View style={styles.orderFooter}>
          <Text style={styles.totalAmount}>₹{item.total.toFixed(2)}</Text>
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
          >
            <Text style={styles.trackButtonText}>
              {item.status === 'Delivered' ? 'View Details' : 'Track Order'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="time-outline" size={40} color="#ccc" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Orders Yet</Text>
        <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
        <TouchableOpacity 
          style={styles.shopNowButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.shopNowText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  listContainer: {
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusDelivered: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  statusInTransit: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productIcon: {
    width: 24,
    marginRight: 12,
    textAlign: 'center',
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    marginLeft: 4,
  },
  statusProcessing: {
    backgroundColor: '#fff3e0',
    color: '#ef6c00',
  },
  moreItems: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  trackButton: {
    backgroundColor: '#0C831F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  shopNowButton: {
    marginTop: 24,
    backgroundColor: '#0C831F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
