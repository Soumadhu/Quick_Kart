import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OrderStatusScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params || {};
  
  const [currentStatus, setCurrentStatus] = useState('PENDING');

  const statuses = [
    { id: 'PICKED_UP', label: 'Picked Up', icon: 'check-circle' },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: 'delivery-dining' },
    { id: 'DELIVERED', label: 'Delivered', icon: 'done-all' },
  ];

  const updateStatus = (status) => {
    // TODO: Implement API call to update order status
    setCurrentStatus(status);
    // Show success message
    alert(`Order status updated to: ${status.replace('_', ' ')}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{orderId || 'N/A'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusContainer}>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status.id}
              style={[
                styles.statusButton,
                currentStatus === status.id && styles.statusButtonActive
              ]}
              onPress={() => updateStatus(status.id)}
              disabled={currentStatus === status.id}
            >
              <Icon 
                name={status.icon} 
                size={24} 
                color={currentStatus === status.id ? '#fff' : '#F8C400'} 
              />
              <Text style={[
                styles.statusText,
                currentStatus === status.id && styles.statusTextActive
              ]}>
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID:</Text>
            <Text style={styles.infoValue}>#{orderId || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, styles[`status${currentStatus}`]]}>
              {currentStatus.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusButtonActive: {
    backgroundColor: '#F8C400',
    borderColor: '#F8C400',
  },
  statusText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  statusTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  orderInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statusPENDING: {
    color: '#FFA000',
    fontWeight: 'bold',
  },
  statusPICKED_UP: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  statusOUT_FOR_DELIVERY: {
    color: '#3F51B5',
    fontWeight: 'bold',
  },
  statusDELIVERED: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default OrderStatusScreen;
