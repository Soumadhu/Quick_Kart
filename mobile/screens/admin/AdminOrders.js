import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  AppState
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../../src/services/apiConfig';
import orderService from '../../src/services/orderService';
import socketService from '../../src/services/socketService';
import { useAuth } from '../../src/contexts/AuthContext';

// Ensure there's no trailing slash in the API URL to prevent double /api
const API_URL = getApiBaseUrl().replace(/\/$/, '');

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  const { token: contextToken, logout } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  
  // Modified to not require authentication
  const getAuthToken = useCallback(async () => {
    return null; // No authentication required
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' &&
        isFocused
      ) {
        // App has come to the foreground, refresh orders
        fetchOrders();
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, [isFocused]);

  // Fetch pending orders
  const fetchOrders = useCallback(async () => {
    if (!isFocused) return;
    
    try {
      setLoading(true);
      setAuthError(null);
      
      // Get the base URL and ensure it doesn't end with a slash
      const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
      
      // Construct the correct API endpoint
      const url = `${baseUrl}/orders`;
      
      console.log('Fetching orders from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(contextToken && { 'Authorization': `Bearer ${contextToken}` })
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Orders data received:', data);
      
      // Process the received data to match the expected format
      const processedOrders = Array.isArray(data) 
        ? data 
        : (data.data || []);
      
      // Transform each order to match the expected format
      const formattedOrders = processedOrders.map(order => {
        // Parse delivery_address if it's a string
        let deliveryAddress = order.delivery_address;
        if (typeof deliveryAddress === 'string') {
          try {
            deliveryAddress = JSON.parse(deliveryAddress);
          } catch (e) {
            console.warn('Failed to parse delivery address:', e);
            deliveryAddress = {};
          }
        }
        
        return {
          id: order.id || order._id,
          order_number: order.order_number || `ORD-${(order.id || order._id || '').slice(-6)}`,
          status: order.status || 'PENDING',
          total_amount: order.total_amount || 0,
          created_at: order.created_at || new Date().toISOString(),
          updated_at: order.updated_at || new Date().toISOString(),
          user: order.user || {
            id: order.user_id,
            name: 'Customer',
            email: '',
            phone: deliveryAddress?.phone || ''
          },
          items: Array.isArray(order.items) 
            ? order.items.map(item => ({
                id: item.id || item._id,
                product_id: item.product_id,
                name: item.name || 'Product',
                quantity: item.quantity || 1,
                price: item.price || 0,
                total: (item.quantity || 1) * (item.price || 0)
              }))
            : [],
          delivery_address: deliveryAddress || {}
        };
      });
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      setAuthError(error.message || 'Failed to load orders');
      
      // Show alert only for non-auth errors
      if (!error.message.includes('session') && !error.message.includes('Authentication')) {
        Alert.alert(
          'Error', 
          error.message || 'Failed to load orders. Please check your connection and try again.',
          [
            { 
              text: 'Retry', 
              onPress: () => fetchOrders() 
            },
            { 
              text: 'OK', 
              style: 'cancel' 
            }
          ]
        );
      } else if (error.message.includes('session') || error.message.includes('Authentication')) {
        // Removed login redirect
      }
    } finally {
      if (isFocused) {
        setLoading(false);
        setRefreshing(false);
      }
    };
  }, [getAuthToken, isFocused, logout, navigation]);

  // Load orders on component mount and when focused
  useEffect(() => {
    if (isFocused) {
      fetchOrders();
    }
    
    // Setup WebSocket for real-time updates
    const initializeSocket = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;

        // Initialize socket connection using socketService
        await socketService.initialize('/admin/orders');
        
        // Subscribe to order status updates
        const unsubscribe = socketService.subscribe('order_status_updated', (data) => {
          console.log('Order status updated:', data);
          // Refresh orders when status is updated
          fetchOrders();
        });

        // Handle connection events
        socketService.socket?.on('connect', () => {
          console.log('Connected to WebSocket');
        });

        socketService.socket?.on('disconnect', () => {
          console.log('Disconnected from WebSocket');
        });

        socketService.socket?.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
        });
        
        return () => {
          // Unsubscribe from events when component unmounts
          unsubscribe?.();
        };
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    };

    initializeSocket();

    // Clean up on unmount
    return () => {
      // No need to manually disconnect as socketService manages the connection
    };
  }, [isFocused, getAuthToken]);

  // Reject order
  const handleRejectOrder = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await orderService.rejectOrder(selectedOrder.id, rejectReason);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id 
            ? { 
                ...order, 
                status: 'REJECTED_BY_ADMIN', 
                rejection_reason: rejectReason,
                updated_at: new Date().toISOString() 
              } 
            : order
        )
      );
      
      // Close modals and reset state
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedOrder(null);
      
      // Show success message
      Alert.alert('Success', 'Order has been rejected');
      
      // Emit socket event to notify user
      socketService.emit('order_status_update', {
        orderId: selectedOrder.id,
        status: 'REJECTED_BY_ADMIN',
        message: `Your order has been rejected. Reason: ${rejectReason}`,
        rejection_reason: rejectReason
      });
      
    } catch (error) {
      console.error('Error rejecting order:', error);
      Alert.alert('Error', error.message || 'Failed to reject order');
      setProcessing(false);
    }
  };

  
// Approve order
const handleApproveOrder = async (orderId) => {
  console.log(`[handleApproveOrder] Starting approval for order ${orderId}`);
  setProcessing(true);
  
  try {
    // 1. Call the order service to approve the order
    console.log(`[handleApproveOrder] Calling orderService.acceptOrder for order ${orderId}`);
    const response = await orderService.acceptOrder(orderId);
    console.log(`[handleApproveOrder] Order ${orderId} approved successfully:`, response);
    
    // 2. Update local state to reflect the new status
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: 'ADMIN_ACCEPTED', 
              updated_at: new Date().toISOString() 
            } 
          : order
      )
    );

    // 3. Show success message
    Alert.alert('Success', 'Order has been approved and the customer has been notified');
    
    try {
      // 4. Emit socket event to notify user in real-time
      if (socketService && socketService.emit) {
        console.log(`[handleApproveOrder] Sending socket update for order ${orderId}`);
        await socketService.emit('order_status_update', {
          orderId,
          status: 'ADMIN_ACCEPTED',
          message: 'Your order has been approved and is being prepared for delivery.',
          timestamp: new Date().toISOString()
        });
        
        // Also emit to admin room to update all admin panels
        await socketService.emit('admin_order_update', {
          orderId,
          status: 'ADMIN_ACCEPTED',
          timestamp: new Date().toISOString()
        });
      }
    } catch (socketError) {
      console.error(`[handleApproveOrder] Error in socket update:`, socketError);
    }
    
  } catch (error) {
    console.error(`[handleApproveOrder] Error in approval process:`, error);
    
    let errorMessage = 'Failed to approve order. Please try again.';
    if (error.response) {
      console.error('[handleApproveOrder] Error response:', error.response.data);
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.request) {
      console.error('[handleApproveOrder] No response received from server');
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      console.error('[handleApproveOrder] Error:', error.message);
      errorMessage = error.message || errorMessage;
    }
    
    Alert.alert('Error', errorMessage);
    
    // Refresh orders to get latest state
  } finally {
    setProcessing(false);
  }
};

const handleOrderAction = async (order, action) => {
  console.log(`[handleOrderAction] Action: ${action} for order:`, order.id);
  setSelectedOrder(order);
  
  if (action === 'approve') {
    await handleApproveOrder(order.id);
  } else if (action === 'reject') {
    setShowRejectModal(true);
  }
};

const renderStatusBadge = (status) => {
  let backgroundColor = '#f39c12'; // Default to yellow for pending
  let textColor = '#000';
  let statusText = status;
  
  switch (status) {
    case 'PENDING':
    case 'PENDING_ADMIN_DECISION':
      statusText = 'PENDING';
      backgroundColor = '#f39c12'; // Yellow for pending
      break;
    case 'ADMIN_ACCEPTED':
      statusText = 'ACCEPTED';
      backgroundColor = '#2ecc71'; // Green for accepted
      textColor = '#fff';
      break;
    case 'REJECTED_BY_ADMIN':
      statusText = 'REJECTED';
      backgroundColor = '#e74c3c'; // Red for rejected
      textColor = '#fff';
      break;
    case 'PREPARING':
      backgroundColor = '#3498db'; // Blue for preparing
      textColor = '#fff';
      break;
    case 'READY_FOR_DELIVERY':
      statusText = 'READY';
      backgroundColor = '#9b59b6'; // Purple for ready
      textColor = '#fff';
      break;
    case 'OUT_FOR_DELIVERY':
      statusText = 'ON THE WAY';
      backgroundColor = '#3498db'; // Blue for out for delivery
      textColor = '#fff';
      break;
    case 'DELIVERED':
      backgroundColor = '#27ae60'; // Green for delivered
      textColor = '#fff';
      break;
    case 'CANCELLED':
      backgroundColor = '#7f8c8d'; // Gray for cancelled
      textColor = '#fff';
      break;
    default:
      break;
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor }]}>
      <Text style={[styles.statusText, { color: textColor }]}>
        {statusText.replace(/_/g, ' ')}
      </Text>
    </View>
  );
};

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={64} color="#CCCCCC" />
        <Text style={styles.emptyText}>No pending orders</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchOrders}
        >
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchOrders();
          }}
          colors={['#FF6B6B']}
          tintColor="#FF6B6B"
        />
      }
    >
      {orders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.created_at).toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.orderDetails}>
            <Text style={styles.customerName}>
              {order.user?.name || 'Customer'}
            </Text>
            <Text style={styles.orderTotal}>
              ₹{order.total_amount?.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.orderItems}>
            {order.items?.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.itemPrice}>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.orderFooter}>
            <Text style={styles.totalAmount}>
              Total: ₹{order.total_amount?.toFixed(2) || '0.00'}
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleOrderAction(order, 'reject')}
                disabled={processing}
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleOrderAction(order, 'approve')}
                disabled={processing}
              >
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDate: {
    color: '#666',
    fontSize: 12,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  rejectionReason: {
    fontSize: 12,
    color: '#e74c3c',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#2ecc71',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#e74c3c',
  },
  confirmButton: {
    backgroundColor: '#2ecc71',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default AdminOrders;