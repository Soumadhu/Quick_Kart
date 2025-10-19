import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Mock data - replace with actual API call
const mockOrders = [
  {
    id: '1',
    orderId: '#ORD12345',
    customerName: 'John Doe',
    address: '123 Main St, City, Country',
    items: '3 items',
    total: '$45.99',
    status: 'PICKUP', // PICKUP, IN_TRANSIT, DELIVERED
    phone: '+1234567890',
    distance: '2.5 km',
  },
  {
    id: '2',
    orderId: '#ORD12346',
    customerName: 'Jane Smith',
    address: '456 Oak Ave, Town, Country',
    items: '5 items',
    total: '$78.50',
    status: 'IN_TRANSIT',
    phone: '+1987654321',
    distance: '1.8 km',
  },
];

const OrderCard = ({ order, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardHeader}>
      <Text style={styles.orderId}>{order.orderId}</Text>
      <View style={[
        styles.statusBadge,
        order.status === 'PICKUP' && styles.pickupBadge,
        order.status === 'IN_TRANSIT' && styles.inTransitBadge,
        order.status === 'DELIVERED' && styles.deliveredBadge,
      ]}>
        <Text style={styles.statusText}>
          {order.status.replace('_', ' ')}
        </Text>
      </View>
    </View>
    
    <View style={styles.customerInfo}>
      <Icon name="person" size={18} color="#555" />
      <Text style={styles.customerName}>{order.customerName}</Text>
    </View>
    
    <View style={styles.detailRow}>
      <Icon name="location-on" size={16} color="#888" />
      <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
        {order.address}
      </Text>
    </View>
    
    <View style={styles.detailRow}>
      <Icon name="shopping-cart" size={16} color="#888" />
      <Text style={styles.detailText}>{order.items}</Text>
      <Text style={[styles.detailText, { marginLeft: 20 }]}>•</Text>
      <Text style={[styles.detailText, { marginLeft: 10 }]}>{order.total}</Text>
    </View>
    
    <View style={styles.detailRow}>
      <Icon name="phone" size={16} color="#888" />
      <Text style={[styles.detailText, { color: '#0066cc' }]}>{order.phone}</Text>
      <Text style={[styles.detailText, { marginLeft: 'auto' }]}>
        <Icon name="directions-bike" size={16} color="#ff6b6b" /> {order.distance}
      </Text>
    </View>
    
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.callButton}>
        <Icon name="phone" size={18} color="#fff" />
        <Text style={styles.callButtonText}>Call</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navigateButton}>
        <Icon name="directions" size={18} color="#fff" />
        <Text style={styles.navigateButtonText}>Navigate</Text>
      </TouchableOpacity>
      
      {order.status === 'PICKUP' && (
        <TouchableOpacity style={styles.pickupButton}>
          <Text style={styles.pickupButtonText}>Picked Up</Text>
        </TouchableOpacity>
      )}
      
      {order.status === 'IN_TRANSIT' && (
        <TouchableOpacity style={styles.deliveredButton}>
          <Text style={styles.deliveredButtonText}>Mark Delivered</Text>
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
);

const AssignedOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load orders
  const loadOrders = () => {
    // TODO: Replace with actual API call
    setRefreshing(true);
    setTimeout(() => {
      setOrders(mockOrders);
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOrderPress = (order) => {
    // Navigate to order details
    navigation.navigate('OrderDetails', { order });
  };

  const handleRefresh = () => {
    loadOrders();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assigned Deliveries</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#0066cc" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard 
            order={item} 
            onPress={() => handleOrderPress(item)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#ff6b6b']}
            tintColor="#ff6b6b"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="assignment" size={60} color="#ddd" />
            <Text style={styles.emptyText}>No assigned deliveries</Text>
            <Text style={styles.emptySubtext}>New delivery requests will appear here</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 5,
  },
  listContent: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupBadge: {
    backgroundColor: '#fff3e0',
  },
  inTransitBadge: {
    backgroundColor: '#e3f2fd',
  },
  deliveredBadge: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    flexWrap: 'wrap',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  callButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196f3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  navigateButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  pickupButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  pickupButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  deliveredButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  deliveredButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default AssignedOrdersScreen;
