import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  SafeAreaView, 
  ActivityIndicator, 
  RefreshControl, 
  ScrollView,
  Alert,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Icons from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { getApiBaseUrl } from '../src/services/apiConfig';
import { useAuth } from '../src/contexts/AuthContext';
import { useProfile } from '../src/contexts/ProfileContext';
import { getAuthToken } from '../src/services/authService';
import { clearCart, getCart } from '../shared/cartService';
import orderService from '../src/services/orderService';
import socketService from '../src/services/socketService';

const { width } = Dimensions.get('window');

const OrderConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token: authToken } = useAuth();
  const { profile, location: userLocation } = useProfile();
  const { 
    amount, 
    method, 
    orderId: initialOrderId, 
    orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    items = [],
    deliveryAddress = route.params?.deliveryAddress || {},
    paymentDetails = route.params?.paymentDetails || {}
  } = route.params || {};
  
  // Animation value for status updates
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  // Initialize order state with proper delivery address from profile context
  const [order, setOrder] = useState(() => {
    // Get delivery address from profile context or route params
    const profileAddress = {
      name: profile?.name || '',
      street: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      pincode: profile?.pincode || '',
      phone: profile?.phone || '',
      location: userLocation ? {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude
      } : null
    };
    
    const initialDeliveryAddress = profileAddress;
    
    return {
      id: initialOrderId,
      status: 'PENDING_ADMIN_DECISION',
      items: items,
      total: amount || items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: method || 'Online Payment',
      orderNumber,
      deliveryAddress: initialDeliveryAddress,
      paymentDetails: paymentDetails || {}
    };
  });
  
  // Get status message based on order status
  const getStatusMessage = (status) => {
    const statusMap = {
      'PENDING': 'Your order is pending admin approval',
      'PENDING_ADMIN_DECISION': 'Your order is pending admin approval',
      'ADMIN_ACCEPTED': 'Order accepted! Your items are being prepared',
      'PREPARING': 'Your order is being prepared and will be ready soon',
      'READY_FOR_DELIVERY': 'Your order is ready for delivery',
      'OUT_FOR_DELIVERY': 'Your order is out for delivery',
      'DELIVERED': 'Order delivered successfully!',
      'CANCELLED': 'Order was cancelled',
      'REJECTED_BY_ADMIN': order.rejection_reason 
        ? `Order was rejected: ${order.rejection_reason}`
        : 'Order was rejected by admin'
    };
    
    return statusMap[status] || 'Processing your order';
  };
  
  // Get status icon based on order status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ADMIN_ACCEPTED':
        return { name: 'checkmark-circle', color: '#2ecc71' };
      case 'REJECTED_BY_ADMIN':
        return { name: 'close-circle', color: '#e74c3c' };
      case 'DELIVERED':
        return { name: 'checkmark-done-circle', color: '#27ae60' };
      case 'OUT_FOR_DELIVERY':
        return { name: 'bicycle', color: '#3498db' };
      case 'READY_FOR_DELIVERY':
        return { name: 'rocket', color: '#9b59b6' };
      default:
        return { name: 'time', color: '#f39c12' };
    }
  };
  
  // Get status container style based on order status
  const getStatusContainerStyle = (status) => {
    switch (status) {
      case 'ADMIN_ACCEPTED':
        return styles.statusAccepted;
      case 'REJECTED_BY_ADMIN':
        return styles.statusRejected;
      case 'DELIVERED':
        return styles.statusDelivered;
      case 'OUT_FOR_DELIVERY':
        return styles.statusOutForDelivery;
      case 'READY_FOR_DELIVERY':
        return styles.statusReadyForDelivery;
      default:
        return styles.statusPending;
    }
  };
  
  // Animate status update
  const animateStatusUpdate = () => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Handle WebSocket order status updates
  useEffect(() => {
    if (!order.id) return;
    
    const initializeSocket = async () => {
      try {
        // Initialize socket connection
        const socket = await socketService.initialize(`/order/${order.id}`);
        if (!socket) return;
        
        const handleStatusUpdate = (data) => {
          if (data.orderId === order.id) {
            console.log('Received status update:', data);
            
            // Update order status
            setOrder(prev => ({
              ...prev,
              status: data.status,
              updatedAt: new Date().toISOString()
            }));
            
            // Animate the status update
            animateStatusUpdate();
            
            // Show alert for important status changes
            if (data.status === 'ADMIN_ACCEPTED') {
              Alert.alert(
                'Order Confirmed!',
                'Your order has been confirmed and is being prepared.',
                [{ text: 'OK' }]
              );
            } else if (data.status === 'REJECTED_BY_ADMIN') {
              Alert.alert(
                'Order Rejected',
                'Your order has been rejected. Please contact support for assistance.',
                [{ text: 'OK' }]
              );
            } else if (data.status === 'OUT_FOR_DELIVERY') {
              Alert.alert(
                'On the way!',
                'Your order is out for delivery and will be with you soon!',
                [{ text: 'Track Order' }]
              );
            }
          }
        };

        // Join order-specific room
        console.log(`Joining order room: order_${order.id}`);
        socket.emit('join_order_room', { orderId: order.id });
        
        // Listen for status updates
        socket.on('order_status_update', handleStatusUpdate);
        
        // Request current order status
        socket.emit('get_order_status', { orderId: order.id });

        // Cleanup function
        return () => {
          console.log('Cleaning up WebSocket listeners for order:', order.id);
          socket.off('order_status_update', handleStatusUpdate);
          socket.emit('leave_order_room', { orderId: order.id });
        };
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    };

    const cleanup = initializeSocket();
    
    // Return cleanup function
    return () => {
      if (typeof cleanup?.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [order.id]);
  
  // Update order state when profile or location changes
  useEffect(() => {
    if (profile) {
      // Get the full address from profile
      const fullAddress = profile?.address || '';
      
      // Create a simple address object with the full address
      const profileAddress = {
        name: profile?.name || user?.displayName || 'Customer',
        fullAddress: fullAddress,
        phone: profile?.phone || user?.phoneNumber || '',
        location: userLocation ? {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude
        } : null
      };
      
      console.log('Updating order with address:', profileAddress);
      setOrder(prev => ({
        ...prev,
        deliveryAddress: profileAddress
      }));
    }
  }, [profile, userLocation, user]);
  
  // Handle real-time order status updates
  useEffect(() => {
    if (!order?.id) return;

    const handleOrderUpdate = (data) => {
      console.log('Received order update:', data);
      if (data.orderId === order.id) {
        setOrder(prev => ({
          ...prev,
          status: data.status,
          updatedAt: new Date().toISOString()
        }));
        
        // Show status update to user
        const statusMessages = {
          'ADMIN_ACCEPTED': 'Your order has been accepted and is being prepared!',
          'PREPARING': 'Your order is being prepared!',
          'READY_FOR_DELIVERY': 'Your order is ready for delivery!',
          'OUT_FOR_DELIVERY': 'Your order is out for delivery!',
          'DELIVERED': 'Your order has been delivered!',
          'REJECTED_BY_ADMIN': `Order rejected: ${data.reason || 'No reason provided'}`,
          'CANCELLED': 'Order has been cancelled'
        };
        
        if (statusMessages[data.status]) {
          Alert.alert('Order Update', statusMessages[data.status]);
        }
      }
    };

    // Subscribe to order updates
    socketService.subscribe('order_status_update', handleOrderUpdate);
    
    // Join order room for real-time updates
    socketService.emit('join_order_room', { orderId: order.id });
    
    // Set up polling as a fallback
    const pollInterval = setInterval(() => {
      orderService.getOrder(order.id)
        .then(updatedOrder => {
          if (updatedOrder.status !== order.status) {
            handleOrderUpdate({
              orderId: order.id,
              status: updatedOrder.status,
              reason: updatedOrder.rejection_reason
            });
          }
        })
        .catch(error => console.error('Error polling order status:', error));
    }, 30000); // Poll every 30 seconds
    
    return () => {
      socketService.unsubscribe('order_status_update', handleOrderUpdate);
      clearInterval(pollInterval);
    };
  }, [order?.id]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const orderCreated = useRef(false);
  const isMounted = useRef(true);
  
  // Function to get image source
  const getImageSource = (item) => {
    if (!item) return require('../assets/icon.png');
    
    // Try to get image from item or its product
    const imageUrl = item.image_url || (item.product?.image_url) || item.image || (item.product?.image);
    
    if (imageUrl) {
      // If it's already a full URL, use it as is
      if (imageUrl.startsWith('http') || imageUrl.startsWith('file:')) {
        return { uri: imageUrl };
      }
      
      // Otherwise, construct the full URL
      const baseUrl = getApiBaseUrl().replace(/\/$/, '');
      const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      return { uri: `${baseUrl}/${cleanPath}` };
    }
    
    // Fallback to placeholder if no image found
    return require('../assets/icon.png');
  };

  // Order update handler
  const handleOrderUpdate = useCallback((updatedOrder) => {
    console.log('Order updated:', updatedOrder);
    if (updatedOrder && isMounted.current) {
      setOrder(prev => ({
        ...prev,
        ...updatedOrder,
        status: updatedOrder.status || prev.status,
        updatedAt: updatedOrder.updated_at || new Date().toISOString()
      }));
    }
  }, []);

  // Calculate estimated delivery time (30-45 minutes from now by default)
  const [estimatedDelivery, setEstimatedDelivery] = useState(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 30 + Math.floor(Math.random() * 16));
    return date;
  });

  // Get estimated delivery time based on status
  const getEstimatedDeliveryTime = (status) => {
    const now = new Date();
    if (status === 'ADMIN_ACCEPTED' || status === 'PREPARING') {
      now.setMinutes(now.getMinutes() + 15); // 15 minutes after approval
    } else if (status === 'READY_FOR_DELIVERY' || status === 'OUT_FOR_DELIVERY') {
      now.setMinutes(now.getMinutes() + 30); // 30 minutes after approval
    } else {
      now.setMinutes(now.getMinutes() + 45); // Default 45 minutes
    }
    return now;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Save order to backend using orderService
  const saveOrder = useCallback(async () => {
    // Prevent duplicate order creation
    if (orderCreated.current) {
      console.log('Order already created, skipping duplicate');
      return null;
    }
    
    console.log('saveOrder called');
    
    // Check if user is authenticated
    if (!user) {
      console.log('User not authenticated, redirecting to login...');
      // Navigate to login with callback to retry order after login
      navigation.navigate('Login', {
        screen: 'Checkout',
        params: { 
          fromCheckout: true,
          orderData: {
            items: order.items,
            total: order.total,
            deliveryAddress: order.deliveryAddress,
            paymentMethod: order.paymentMethod
          }
        }
      });
      throw new Error('User not authenticated');
    }
    
    // Use the authenticated user's ID
    const userId = user.id;

    try {
      setIsLoading(true);
      
      // Ensure items have the correct structure
      const orderItems = order.items.map(item => ({
        product_id: String(item.id || item.product?.id || ''),
        name: item.name || item.product?.name || 'Unknown Product',
        quantity: item.quantity || 1,
        price: parseFloat(item.price || 0),
        total: parseFloat((item.price || 0) * (item.quantity || 1))
      }));
      
      const orderData = {
        user_id: userId,
        total_amount: parseFloat(order.total || 0),
        items: orderItems,
        delivery_address: order.deliveryAddress || {},
        payment_method: order.paymentMethod || 'credit_card',
        status: 'PENDING_ADMIN_DECISION'
      };

      console.log('Saving order with data:', orderData);
      
      // Use the orderService to create the order
      const savedOrder = await orderService.createOrder(orderData);
      console.log('Order saved successfully:', savedOrder);
      
      // Mark order as created to prevent duplicates
      orderCreated.current = true;
      
      // Clear the cart after successful order
      try {
        await clearCart();
      } catch (cartError) {
        console.warn('Failed to clear cart:', cartError);
        // Don't fail the order if cart clearing fails
      }
      
      return savedOrder;
    } catch (error) {
      console.error('Error in saveOrder:', error);
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [order, navigation, user?.id]);

  // Initialize order and WebSocket connection
  const initializeOrderAndSocket = useCallback(async (orderData) => {
    if (!orderData?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Initializing WebSocket connection for order:', orderData.id);
      
      // Initialize socket connection with the order-specific namespace
      const socket = await socketService.initialize(`/order/${orderData.id}`);
      if (!socket) {
        console.warn('Failed to initialize WebSocket connection');
        throw new Error('Failed to connect to WebSocket server');
      }
      
      // Subscribe to order updates with error handling
      const handleOrderUpdateWrapper = (data) => {
        try {
          console.log('Received order update:', data);
          handleOrderUpdate(data);
        } catch (error) {
          console.error('Error processing order update:', error);
        }
      };
      
      const unsubscribe = socketService.subscribe('order_updated', handleOrderUpdateWrapper);
      
      // Notify server we're ready to receive updates for this order
      await socketService.emit('join_order_room', { orderId: orderData.id });
      
      // Return cleanup function
      return () => {
        console.log('Cleaning up WebSocket subscription for order:', orderData.id);
        unsubscribe();
        // Note: We don't disconnect the socket here as it's managed by the service
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      throw error; // Re-throw to be caught by the outer catch if needed
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [handleOrderUpdate]);

  // Initialize order and WebSocket
  useEffect(() => {
    const isMountedRef = { current: true };
    console.log('useEffect running, isMounted:', isMountedRef.current);

    const initializeOrderProcess = async () => {
      console.log('initializeOrderAndSocket called');
      
      // Prevent multiple order creations if already in progress
      if (isLoading || orderCreated.current) {
        console.log('Order creation already in progress or completed, skipping');
        return;
      }

      try {
        setIsLoading(true);
        
        // If no order ID, create a new order
        if (!order.id) {
          console.log('No order ID found, creating new order...');
          try {
            const savedOrder = await saveOrder();
            if (savedOrder && isMountedRef.current) {
              console.log('Order created successfully:', savedOrder);
              setOrder(prev => ({
                ...prev,
                id: savedOrder.id,
                status: savedOrder.status || 'PENDING_ADMIN_DECISION',
                orderNumber: savedOrder.order_number || prev.orderNumber,
                createdAt: savedOrder.created_at || new Date().toISOString(),
                updatedAt: savedOrder.updated_at || new Date().toISOString()
              }));
              
              // Initialize WebSocket after order is created
              const unsubscribe = await initializeOrderAndSocket(savedOrder);
              if (unsubscribe) {
                return unsubscribe; // Return cleanup function
              }
            } else if (!savedOrder && isMountedRef.current) {
              console.log('No order was created (possibly duplicate)');
            }
          } catch (error) {
            console.error('Error in order creation:', error);
            if (isMountedRef.current) {
              setError(error);
            }
          }
        } else {
          // If we already have an order ID, just initialize the WebSocket
          console.log('Using existing order ID:', order.id);
          const unsubscribe = await initializeOrderAndSocket(order);
          if (unsubscribe) {
            return unsubscribe; // Return cleanup function
          }
        }
      } catch (error) {
        console.error('Error in initializeOrderAndSocket:', error);
        if (isMountedRef.current) {
          setError(error);
        }
      } finally {
        console.log('initializeOrderProcess completed, setting loading to false');
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Initialize the order and WebSocket
    const cleanup = initializeOrderProcess();
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (typeof cleanup?.then === 'function') {
        cleanup.then(unsubscribe => {
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
          }
        });
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [order.id, saveOrder, initializeOrderAndSocket]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // The socket service manages its own cleanup
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Re-fetch order details if needed
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>
          {isLoading ? 'Placing your order...' : 'Loading order details...'}
        </Text>
      </View>
    );
  }

  const statusIcon = getStatusIcon(order.status);
  const statusContainerStyle = getStatusContainerStyle(order.status);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
      >
        {/* Status Bar */}
        <Animated.View 
          style={[
            styles.statusContainer, 
            statusContainerStyle,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Ionicons 
            name={statusIcon.name} 
            size={24} 
            color="#fff" 
            style={styles.statusIcon} 
          />
          <Text style={styles.statusText}>
            {getStatusMessage(order.status)}
          </Text>
        </Animated.View>
        
        {/* Order Confirmation Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order #{order.orderNumber || order.id?.slice(-6)}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Order Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Number:</Text>
            <Text style={styles.detailValue}>{order.orderNumber || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Date:</Text>
            <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>{order.paymentMethod || 'Online Payment'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[
              styles.statusBadge,
              order.status === 'DELIVERED' && styles.statusDelivered,
              (order.status === 'CANCELLED' || order.status === 'REJECTED_BY_ADMIN') && styles.statusCancelled,
              (order.status === 'PENDING' || order.status === 'PENDING_ADMIN_DECISION') && styles.statusPending,
              (order.status === 'PREPARING' || order.status === 'READY_FOR_DELIVERY' || order.status === 'OUT_FOR_DELIVERY') && styles.statusProcessing
            ]}>
              {order.status ? order.status.replace(/_/g, ' ') : 'PROCESSING'}
            </Text>
          </View>
        </View>

        {/* Order Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => {
              console.log('Order item:', JSON.stringify(item, null, 2));
              return (
              <View key={`${item.id || index}-${index}`} style={styles.orderItem}>
                <View style={styles.orderItemImageContainer}>
                  <Image 
                    source={getImageSource(item)}
                    style={styles.orderItemImage} 
                    resizeMode="cover"
                    onError={(e) => console.log('Image load error:', e.nativeEvent.error, 'for item:', item.id)}
                  />
                </View>
                <View style={styles.orderItemDetails}>
                  <Text style={styles.orderItemName} numberOfLines={1}>
                    {item.name || item.product?.name || `Item ${index + 1}`}
                  </Text>
                  <Text style={styles.orderItemPrice}>
                    {item.quantity || 1} x ₹{(item.price || item.product?.price || 0).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.orderItemTotal}>
                  ₹{((item.quantity || 1) * (item.price || item.product?.price || 0)).toFixed(2)}
                </Text>
              </View>
            );
            })
          ) : (
            <Text style={styles.noItemsText}>No items in this order</Text>
          )}
          
          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ₹{order.items ? order.items.reduce((sum, item) => {
                  const price = item.price || item.product?.price || 0;
                  const quantity = item.quantity || 1;
                  return sum + (price * quantity);
                }, 0).toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₹0.00</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (18%)</Text>
              <Text style={styles.summaryValue}>
                ₹{order.items ? (order.items.reduce((sum, item) => {
                  const price = item.price || item.product?.price || 0;
                  const quantity = item.quantity || 1;
                  return sum + (price * quantity);
                }, 0) * 0.18).toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₹{order.items ? (order.items.reduce((sum, item) => {
                  const price = item.price || item.product?.price || 0;
                  const quantity = item.quantity || 1;
                  return sum + (price * quantity);
                }, 0) * 1.18).toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={20} color="#6200ee" style={styles.addressIcon} />
            <View style={styles.addressDetails}>
              <Text style={styles.addressName}>
                {order.deliveryAddress?.name || 'Your Delivery Address'}
              </Text>
              <Text style={styles.addressText}>
                {order.deliveryAddress?.fullAddress || 
                 (order.deliveryAddress?.location 
                   ? `Location: ${order.deliveryAddress.location.latitude.toFixed(6)}, ${order.deliveryAddress.location.longitude.toFixed(6)}`
                   : 'No address or location provided'
                 )}
              </Text>
              {order.deliveryAddress?.phone && (
                <Text style={styles.addressPhone}>
                  Phone: {order.deliveryAddress.phone}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Order Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.trackOrderButton]}
            onPress={() => {
              // Navigate to order tracking
              if (order.id) {
                navigation.navigate('OrderTracking', { orderId: order.id });
              } else {
                Alert.alert('Info', 'Order tracking will be available once your order is confirmed.');
              }
            }}
          >
            <Ionicons name="navigate-circle-outline" size={20} color="#6200ee" />
            <Text style={[styles.actionButtonText, { color: '#6200ee' }]}>
              {order.id ? 'Track Order' : 'Order Processing...'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.helpButton]}
            onPress={() => navigation.navigate('Help')}
          >
            <Ionicons name="help-circle-outline" size={20} color="#666" />
            <Text style={[styles.actionButtonText, { color: '#666' }]}>Get Help</Text>
          </TouchableOpacity>
        </View>

        {/* Back to Home Button */}
        <TouchableOpacity 
          style={styles.backToHomeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backToHomeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  // Status Styles
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 0,
    marginBottom: 1,
    backgroundColor: '#3498db', // Default blue
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusAccepted: {
    backgroundColor: '#2ecc71', // Green
  },
  statusRejected: {
    backgroundColor: '#e74c3c', // Red
  },
  statusDelivered: {
    backgroundColor: '#27ae60', // Dark green
  },
  statusOutForDelivery: {
    backgroundColor: '#3498db', // Blue
  },
  statusReadyForDelivery: {
    backgroundColor: '#9b59b6', // Purple
  },
  statusPending: {
    backgroundColor: '#f39c12', // Orange
  },
  statusIcon: {
    marginRight: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // Order Details Styles
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  statusDelivered: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4CAF50',
  },
  statusCancelled: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#F44336',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    color: '#FF9800',
  },
  statusProcessing: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    color: '#2196F3',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  orderItemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#f9f9f9',
  },
  orderItemImage: {
    width: '100%',
    height: '100%',
  },
  orderItemImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  orderItemDetails: {
    flex: 1,
    marginRight: 8,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  noItemsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 8,
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 13,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  trackOrderButton: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  helpButton: {
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    flexDirection: 'row',
  },
  trackButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4caf50',
    marginRight: 10,
  },
  trackButtonText: {
    color: '#4caf50',
    fontWeight: '600',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#4caf50',
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  backToHomeButton: {
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
    textAlign: 'center',
    maxWidth: '80%',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  summaryValue: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  deliveryIcon: {
    backgroundColor: '#e8f5e9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeline: {
    position: 'absolute',
    left: 30,
    top: 20,
    bottom: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  activeDot: {
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#a5d6a7',
  },
  inactiveDot: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  trackingSteps: {
    marginLeft: 50,
  },
  trackingStep: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepTitle: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
    marginBottom: 4,
  },
  stepTime: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  inactiveStep: {
    color: '#bdc3c7',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  trackButton: {
    backgroundColor: '#6200ee',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderConfirmationScreen;