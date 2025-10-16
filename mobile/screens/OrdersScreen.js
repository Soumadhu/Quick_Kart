import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { orders, products } from '../shared/mockData';

export default function OrdersScreen() {
  const getProductById = (id) => products.find(p => p.id === id);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return '#22C55E';
      case 'Out for Delivery':
        return '#3B82F6';
      case 'Pending':
        return '#F59E0B';
      default:
        return '#666';
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.orderDate}>
        {new Date(item.orderDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>

      <View style={styles.itemsList}>
        {item.items.map((orderItem, index) => {
          const product = getProductById(orderItem.productId);
          return (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.orderItemIcon}>{product?.image}</Text>
              <Text style={styles.orderItemName}>
                {product?.name} x {orderItem.quantity}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalAmount}>₹{item.total}</Text>
      </View>

      <TouchableOpacity style={styles.trackButton}>
        <Text style={styles.trackButtonText}>Track Order</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {orders.length === 0 ? (
        <View style={styles.emptyOrders}>
          <Text style={styles.emptyOrdersIcon}>📦</Text>
          <Text style={styles.emptyOrdersTitle}>No orders yet</Text>
          <Text style={styles.emptyOrdersSubtitle}>Your order history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  itemsList: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  orderItemName: {
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackButton: {
    backgroundColor: '#F8C400',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyOrders: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOrdersIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyOrdersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyOrdersSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});
