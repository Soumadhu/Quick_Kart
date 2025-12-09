import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const OrderNotificationModal = ({ 
  visible, 
  order, 
  onClose, 
  onViewDetails, 
  onAcceptOrder,
  orderId,
  customerName,
  orderTotal,
  orderStatus
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    setIsVisible(visible);
    if (visible) {
      setIsProcessing(false);
    }
  }, [visible, order]);

  if (!order) return null;

  const handleViewDetails = () => {
    onClose();
    if (onViewDetails) {
      onViewDetails();
    } else if (order.id || order.order_id) {
      navigation.navigate('AdminOrders', { 
        screen: 'OrderDetails', 
        params: { orderId: order.id || order.order_id } 
      });
    }
  };

  const handleAcceptOrder = async () => {
    try {
      setIsProcessing(true);
      if (onAcceptOrder) {
        await onAcceptOrder();
      }
      // onClose will be called after successful API call
    } catch (error) {
      console.error('Error accepting order:', error);
      setIsProcessing(false);
    }
  };

  const formatPrice = (amount) => {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    return '₹' + amount.toFixed(2);
  };

  const getOrderStatusText = (status) => {
    switch(status) {
      case 'PENDING_ADMIN_DECISION':
        return 'Pending Approval';
      case 'PREPARING':
        return 'Preparing';
      case 'READY_FOR_DELIVERY':
        return 'Ready for Delivery';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status || 'Processing';
    }
  };

  const statusColors = {
    'PENDING_ADMIN_DECISION': '#f39c12',
    'PREPARING': '#3498db',
    'READY_FOR_DELIVERY': '#9b59b6',
    'OUT_FOR_DELIVERY': '#e67e22',
    'DELIVERED': '#2ecc71',
    'CANCELLED': '#e74c3c'
  };

  const currentStatus = order.status || order.order_status || 'PENDING_ADMIN_DECISION';
  const statusColor = statusColors[currentStatus] || '#7f8c8d';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getOrderStatusText(currentStatus)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>
              Order #{order.order_number || order.id || 'N/A'}
            </Text>
            <Text style={styles.orderTotal}>
              Total: {formatPrice(order.total_amount || orderTotal || 0)}
            </Text>
            
            {order.user && (
              <View style={styles.customerInfo}>
                <Ionicons name="person" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.customerText}>
                  {order.user.name || customerName || 'Customer'}
                </Text>
              </View>
            )}
            
            {order.delivery_address && (
              <View style={styles.deliveryInfo}>
                <Ionicons 
                  name="location" 
                  size={16} 
                  color="#666" 
                  style={styles.infoIcon} 
                />
                <Text style={styles.deliveryText} numberOfLines={2}>
                  {order.delivery_address.address_line1 || 'Delivery address not specified'}
                </Text>
              </View>
            )}
            
            <View style={styles.itemsContainer}>
              <Text style={styles.sectionTitle}>Order Items:</Text>
              {order.items && order.items.length > 0 ? (
                order.items.slice(0, 3).map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.quantity}x {item.name || 'Item'}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {formatPrice(item.price * (item.quantity || 1))}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noItemsText}>No items in this order</Text>
              )}
              
              {order.items && order.items.length > 3 && (
                <Text style={styles.moreItemsText}>
                  +{order.items.length - 3} more items
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.viewButton]} 
              onPress={handleViewDetails}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>View Details</Text>
            </TouchableOpacity>
            
            {currentStatus === 'PENDING_ADMIN_DECISION' && (
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.acceptButton,
                  isProcessing && styles.disabledButton
                ]}
                onPress={handleAcceptOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>
                    Accept Order
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: 5,
    marginRight: -5,
  },
  orderInfo: {
    marginBottom: 20,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  customerText: {
    fontSize: 15,
    color: '#2c3e50',
  },
  deliveryText: {
    flex: 1,
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  itemsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#34495e',
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  moreItemsText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 5,
  },
  noItemsText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    flexDirection: 'row',
  },
  viewButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  acceptButton: {
    backgroundColor: '#2ecc71',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
});

export default OrderNotificationModal;
