import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  SafeAreaView,
  Alert,
  Platform,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Icons from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrderNotificationModal from '../../components/admin/OrderNotificationModal';
import { io } from 'socket.io-client';
import { API_URL, getApiBaseUrl } from '../../src/services/apiConfig';
import { getAuthToken, setAuthToken } from '../../src/utils/auth';
import { useAuth } from '../../src/contexts/AuthContext';

// WebSocket URL configuration - using explicit port 5000 to match server
const WS_URL = 'ws://localhost:5000';
const WS_PATH = '/socket.io';
console.log('WebSocket URL:', WS_URL);
console.log('WebSocket Path:', WS_PATH);

// Connection state constants
const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
};

const menuItems = [
  { 
    title: 'Dashboard', 
    screen: 'AdminDashboard',
    icon: 'speedometer',
    iconSet: 'Ionicons',
    count: 0
  },
  { 
    title: 'Home Content', 
    screen: 'HomeContentManager',
    icon: 'home',
    iconSet: 'Ionicons'
  },
  { 
    title: 'Products', 
    screen: 'AdminProducts',
    icon: 'shopping-bag',
    iconSet: 'Ionicons',
    count: 125
  },
  { 
    title: 'Categories', 
    screen: 'AdminCategories',
    icon: 'grid',
    iconSet: 'Ionicons',
    count: 12
  },
  { 
    title: 'Orders', 
    screen: 'AdminOrders',
    icon: 'cart',
    iconSet: 'Ionicons',
    count: 0 // This will be updated dynamically
  },
  { 
    title: 'Dark Store', 
    screen: 'DarkStore',
    icon: 'storefront',
    iconSet: 'Ionicons',
    count: 0
  },
  { 
    title: 'Users', 
    screen: 'AdminUsers',
    icon: 'people',
    iconSet: 'Ionicons',
    count: 89
  },
  { 
    title: 'Riders', 
    screen: 'AdminRiders',
    icon: 'bicycle',
    iconSet: 'Ionicons',
    count: 15
  },
  { 
    title: 'Settings', 
    screen: 'AdminSettings',
    icon: 'settings',
    iconSet: 'Ionicons'
  },
];

const StatCard = ({ title, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
      <Icons.Ionicons name={icon} size={24} color={color} />
    </View>
  </View>
);

// Connection status indicator component
const ConnectionStatus = ({ isConnected, status }) => {
  return (
    <View style={[
      styles.connectionStatusContainer,
      isConnected ? styles.connectionStatusConnected : styles.connectionStatusDisconnected
    ]}>
      <View style={styles.connectionStatusContent}>
        <Text style={styles.connectionStatusText}>
          {isConnected ? 'Connected to Server' : 'Disconnected'}
        </Text>
        <Text style={styles.connectionStatusDetail}>
          {status}
        </Text>
      </View>
      {!isConnected && (
        <TouchableOpacity 
          style={styles.reconnectButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.reconnectButtonText}>Reconnect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function AdminPanel() {
  const { user, isAuthenticated, isLoading: authLoading, token } = useAuth();
  const navigation = useNavigation();
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [newOrder, setNewOrder] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  const { width } = useWindowDimensions();
  const socketRef = useRef(null);
  const responsiveStyles = getResponsiveStyles(width);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isMenuOpen, setMenuOpen] = useState(width > 768);

  // Handle view order details
  const handleViewOrderDetails = useCallback((orderId) => {
    console.log('Viewing order details for:', orderId);
    navigation.navigate('AdminOrders', { 
      screen: 'OrderDetails',
      params: { orderId }
    });
    setShowNotification(false);
  }, [navigation]);

  // Handle accept order from notification
  const handleAcceptOrder = useCallback(async (orderId) => {
    try {
      console.log('Accepting order:', orderId);
      setShowNotification(false);
      
      // Update local state
      setPendingOrders(prev => prev.filter(order => order.id !== orderId));
      setStats(prev => ({
        ...prev,
        pendingOrders: Math.max(0, prev.pendingOrders - 1)
      }));
      
      // Emit order accepted event
      if (socketRef.current) {
        socketRef.current.emit('order_status_update', {
          orderId,
          status: 'ACCEPTED',
          updatedAt: new Date().toISOString()
        });
      }
      
      Alert.alert('Success', 'Order accepted successfully');
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Failed to accept order. Please try again.');
    }
  }, []);

  const initializeWebSocket = useCallback(async () => {
    let isMounted = true;
    let socket;

    try {
      if (!isMounted) return;

      // Bypass authentication for development
      console.log('Skipping authentication check for development');

      setConnectionStatus('Connecting to server...');
      
      // Get authentication token
      const token = await getAuthToken();
      
      console.log('Using token:', token.substring(0, 20) + '...');
      
      // Configure socket options with better defaults
      const socketOptions = {
        // Authentication
        auth: { token },
        // Connection settings
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        
        // Transport settings
        transports: ['websocket', 'polling'],
        upgrade: true,
        forceNew: true,
        
        // Security (disabled for development)
        secure: false,
        rejectUnauthorized: false,
        
        // Path and protocol
        path: WS_PATH,
        
        // Debug settings
        debug: true,
        
        // Connection details
        hostname: 'localhost',
        port: '5000',
        protocol: 'ws'
      };
      
      console.log('Socket.io connection options:', JSON.stringify({
        ...socketOptions,
        auth: { token: '***' }, // Don't log the actual token
      }, null, 2));
      
      console.log('Creating WebSocket connection to:', WS_URL);
      console.log('Socket options:', JSON.stringify(socketOptions, null, 2));
      
      // Create socket connection with error handling
      socket = io(WS_URL, socketOptions);
      
      // Debug socket connection events
      const logEvent = (event, ...args) => {
        console.log(`[Socket Event] ${event}`, ...args);
      };
      
      // Log all socket events for debugging
      const events = ['connect', 'connect_error', 'disconnect', 'reconnect', 'reconnect_attempt', 'reconnect_error', 'reconnect_failed', 'error'];
      events.forEach(event => {
        socket.on(event, (...args) => logEvent(event, ...args));
      });
      
      // Enhanced connection handling
      socket.on('connect', () => {
        console.log('✅ Socket connected successfully!');
        console.log('🔌 Socket ID:', socket.id);
        console.log('🔗 Connected to:', WS_URL);
        setConnectionStatus('Connected');
        setIsConnected(true);
        
        // Emit authentication event if needed
        if (socketRef.current) {
          console.log(`🔑 Authenticating as admin user`);
          socket.emit('authenticate', { token });
        }
      });
      
      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        console.error('Error details:', {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type
        });
        setConnectionStatus(`Connection error: ${error.message}`);
        setIsConnected(false);
      });
      
      // Store socket reference
      socketRef.current = socket;
      
      // Connection established handler
      const onConnect = () => {
        console.log('🔌 WebSocket connection established');
        console.log('📡 Connection details:', {
          id: socket.id,
          connected: socket.connected,
          disconnected: socket.disconnected,
          auth: socket.auth,
          io: {
            uri: socket.io?.uri,
            nsp: socket.io?.nsp,
            ids: socket.io?.ids,
            reconnection: socket.io?.reconnection,
            reconnectionAttempts: socket.io?.reconnectionAttempts,
            reconnectionDelay: socket.io?.reconnectionDelay,
            timeout: socket.io?.timeout
          }
        });
        
        setSocket(socket);
        setIsConnected(true);
        setConnectionStatus('Connected to WebSocket server');
        
        // Join admin room if user is available
        socket.emit('join_admin_room', { 
          userId: 'admin',
          userType: 'admin',
          timestamp: new Date().toISOString()
        });
          
        // Request initial data
        socket.emit('get_initial_data', { 
          type: 'admin_dashboard',
          timestamp: new Date().toISOString()
        });
      };
      
      // Handle connection errors
      const onConnectError = (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionStatus('Connection error - ' + (error.message || 'Unknown error'));
      };
      
      // Handle disconnection
      const onDisconnect = (reason) => {
        console.log('WebSocket disconnected:', reason);
        setConnectionStatus('Disconnected - ' + reason);
        setIsConnected(false);
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Only attempt to reconnect if not explicitly disconnected by user
        if (reason !== 'io client disconnect') {
          const attemptCount = socket.reconnectionAttempts || 0;
          const delay = Math.min(1000 * Math.pow(2, attemptCount), 30000); // Cap at 30s
          
          console.log(`Scheduling reconnection attempt ${attemptCount + 1} in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting reconnection ${attemptCount + 1}...`);
            initializeWebSocket();
          }, delay);
        } else {
          console.log('Not reconnecting as the disconnection was initiated by the user');
        }
      };

      // Set up event listeners
      socket.on('connect', onConnect);
      socket.on('connect_error', onConnectError);
      socket.on('disconnect', onDisconnect);
      
      // Handle successful admin authentication
      socket.on('admin_authenticated', () => {
        console.log('Admin authentication successful');
        setConnectionStatus('Connected & Authenticated');
      });
      
      // Handle admin authentication errors
      socket.on('admin_auth_error', (error) => {
        const errorMsg = error?.message || 'Authentication failed';
        console.error('Admin authentication failed:', errorMsg);
        setConnectionStatus(`Auth error: ${errorMsg}`);
      });
      
      // Handle reconnection events
      socket.on('reconnect_attempt', (attempt) => {
        console.log(`WebSocket reconnection attempt ${attempt}`);
        setConnectionStatus(`Reconnecting (attempt ${attempt})...`);
      });
      
      socket.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed after all attempts');
        setConnectionStatus('Connection failed - Please refresh the page');
      });

      // Handle new order notifications
      const handleNewOrder = (order) => {
        console.log('New order received:', order);
        setNewOrder(order);
        setShowNotification(true);
        
        // Update pending orders list
        setPendingOrders(prev => [order, ...prev]);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          pendingOrders: prev.pendingOrders + 1,
          totalOrders: prev.totalOrders + 1
        }));
      };

      socket.on('new_order', (order) => {
        console.log('New order received:', order);
        handleNewOrder(order);
      });
      
      // Handle view order details
      socket.on('view_order_details', (orderId) => {
        handleViewOrderDetails(orderId);
      });
      
      // Handle order status updates
      socket.on('order_status_updated', (data) => {
        console.log('Order status updated:', data);
        if (data.status === 'ACCEPTED' || data.status === 'REJECTED') {
          setPendingOrders(prev => prev.filter(order => order.id !== data.orderId));
          setStats(prev => ({
            ...prev,
            pendingOrders: Math.max(0, prev.pendingOrders - 1)
          }));
        }
      });

      // Cleanup function
      return () => {
        console.log('Cleaning up WebSocket connection...');
        
        // Remove all event listeners
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        socket.off('disconnect', onDisconnect);
        socket.off('admin_authenticated');
        socket.off('admin_auth_error');
        socket.off('reconnect_attempt');
        socket.off('reconnect_failed');
        socket.off('new_order');
        socket.off('order_status_updated');
        
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Disconnect if still connected
        if (socket.connected) {
          console.log('Disconnecting WebSocket...');
          socket.disconnect();
        }
      };
    } catch (error) {
      console.error('Error in WebSocket initialization:', error);
      setConnectionStatus('Connection error - ' + (error.message || 'Unknown error'));
      
      // Schedule a retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, (socket?.reconnectionAttempts || 0)), 30000);
      console.log(`Scheduling reconnection in ${delay}ms...`);
      setTimeout(initializeWebSocket, delay);
      
      return () => {}; // Return empty cleanup function
    }
  }, []);

  // Initialize the WebSocket connection
  useEffect(() => {
    initializeWebSocket();
  }, [initializeWebSocket]);

  // Initialize data on component mount
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchPendingOrders(),
          fetchDashboardStats()
        ]);
      } catch (error) {
        console.error('Initialization error:', error);
        if (isMounted) {
          Alert.alert('Error', 'Failed to load dashboard data. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>
          {connectionStatus || 'Loading admin panel...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, responsiveStyles.container]}>
      <StatusBar barStyle="dark-content" />
      <ConnectionStatus isConnected={isConnected} status={connectionStatus} />
      {/* Sidebar */}
      <View style={[styles.sidebar, responsiveStyles.sidebar]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Admin Panel</Text>
          {width < 768 && (
            <TouchableOpacity 
              style={styles.menuToggle}
              onPress={() => setMenuOpen(!isMenuOpen)}
            >
              <Icons.Ionicons 
                name={isMenuOpen ? 'close' : 'menu'} 
                size={24} 
                color="#2c3e50" 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {(width >= 768 || isMenuOpen) && (
          <ScrollView 
            style={[styles.menuContainer, responsiveStyles.menuContainer]}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  responsiveStyles.menuItem,
                  activeItem === item.title && styles.activeMenuItem
                ]}
                onPress={() => {
                  setActiveItem(item.title);
                  if (item.screen) {
                    navigation.navigate(item.screen);
                  }
                  if (width < 768) setMenuOpen(false);
                }}
              >
                <View style={[styles.iconContainer, responsiveStyles.iconContainer]}>
                  {item.iconSet === 'Ionicons' ? (
                    <Icons.Ionicons 
                      name={item.icon} 
                      size={20} 
                      color={activeItem === item.title ? '#3498db' : '#7f8c8d'} 
                    />
                  ) : (
                    <Icons.MaterialIcons 
                      name={item.icon} 
                      size={20} 
                      color={activeItem === item.title ? '#3498db' : '#7f8c8d'} 
                    />
                  )}
                </View>
                <Text 
                  style={[
                    styles.menuText, 
                    responsiveStyles.menuText,
                    { color: activeItem === item.title ? '#3498db' : '#2c3e50' }
                  ]}
                >
                  {item.title}
                </Text>
                {item.count !== undefined && (
                  <View style={[
                    styles.badge,
                    item.title === 'Orders' && stats.pendingOrders > 0 && styles.badgeHighlight
                  ]}>
                    <Text style={styles.badgeText}>
                      {item.title === 'Orders' ? stats.pendingOrders : item.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {width >= 768 && (
          <View style={styles.sidebarFooter}>
            <View style={styles.connectionStatus}>
              <View 
                style={[
                  styles.connectionDot, 
                  { backgroundColor: isConnected ? '#2ecc71' : '#e74c3c' }
                ]} 
              />
              <Text style={styles.connectionText}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      <ScrollView 
        style={[styles.mainContent, responsiveStyles.mainContent]}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.contentHeader}>
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>Dashboard</Text>
          </View>
          
          <View style={styles.userInfo}>
            <TouchableOpacity 
              style={styles.notificationIcon}
              onPress={() => navigation.navigate('AdminNotifications')}
            >
              <Icons.Ionicons name="notifications-outline" size={24} color="#2c3e50" />
              {stats.pendingOrders > 0 && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.userAvatar}
              onPress={() => navigation.navigate('AdminProfile')}
            >
              <Text style={styles.avatarText}>A</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={[styles.statsContainer, responsiveStyles.statsContainer]}>
          <StatCard 
            title="Total Orders" 
            value={String(stats.totalOrders)} 
            icon="receipt-outline" 
            color="#3498db" 
          />
          <StatCard 
            title="Pending Orders" 
            value={String(stats.pendingOrders)} 
            icon="time-outline" 
            color="#f39c12" 
          />
          <StatCard 
            title="Completed Orders" 
            value={String(stats.completedOrders)} 
            icon="checkmark-done-circle-outline" 
            color="#2ecc71" 
          />
          <StatCard 
            title="Total Revenue" 
            value={`₹${stats.totalRevenue.toLocaleString()}`} 
            icon="cash-outline" 
            color="#9b59b6" 
          />
        </View>

        {/* Recent Orders */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminOrders')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {pendingOrders.length > 0 ? (
            <ScrollView 
              style={styles.activityList}
              showsVerticalScrollIndicator={false}
            >
              {pendingOrders.map((order, index) => (
                <TouchableOpacity 
                  key={order.id || index}
                  style={styles.activityItem}
                  onPress={() => {
                    navigation.navigate('AdminOrders', { 
                      screen: 'OrderDetails', 
                      params: { orderId: order.id } 
                    });
                  }}
                >
                  <View style={[styles.activityIcon, { backgroundColor: '#e3f2fd' }]}>
                    <Icons.Ionicons name="receipt-outline" size={20} color="#3498db" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      New order #{order.orderNumber} received
                    </Text>
                    <Text style={styles.activityTime}>
                      {new Date(order.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={[styles.orderStatus, { color: '#f39c12' }]}>
                    Pending
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Icons.Ionicons name="receipt-outline" size={48} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No pending orders</Text>
              <Text style={styles.emptyStateSubtext}>New orders will appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Order Notification Modal */}
      <OrderNotificationModal
        visible={showNotification && !!newOrder}
        order={newOrder}
        onClose={() => setShowNotification(false)}
        onViewDetails={handleViewOrderDetails}
        onAcceptOrder={handleAcceptOrder}
      />
    </SafeAreaView>
  );
};

// Responsive styles based on screen width
const getResponsiveStyles = (width) => ({
  container: {
    flex: 1,
    flexDirection: width >= 768 ? 'row' : 'column',
    backgroundColor: '#f5f7fa',
  },
  sidebar: {
    width: width >= 768 ? 260 : '100%',
    backgroundColor: '#fff',
    borderRightWidth: width >= 768 ? 1 : 0,
    borderRightColor: '#e0e0e0',
    height: width >= 768 ? '100vh' : 'auto',
    maxHeight: width < 768 ? 300 : '100%',
  },
  menuContainer: {
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
  },
  iconContainer: {
    width: 36,
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: width >= 768 ? 24 : 16,
  },
  statsContainer: {
    flexDirection: width >= 768 ? 'row' : 'column',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 24,
  },
});

const styles = StyleSheet.create({
  connectionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    minHeight: 48,
  },
  connectionStatusContent: {
    flex: 1,
  },
  connectionStatus: {
    backgroundColor: '#f8f9fa',
    borderBottomColor: '#e9ecef',
  },
  connectionStatusConnected: {
    backgroundColor: '#e8f5e9',
    borderBottomColor: '#c8e6c9',
  },
  connectionStatusDisconnected: {
    backgroundColor: '#ffebee',
    borderBottomColor: '#ffcdd2',
  },
  connectionStatusText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2c3e50',
  },
  connectionStatusDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  reconnectButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 12,
  },
  reconnectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  badgeHighlight: {
    backgroundColor: '#e74c3c',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100vh',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Sidebar Styles
  sidebar: {
    width: 280,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#eaeff2',
    transition: 'all 0.3s ease',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  sidebarHeader: {
    height: 70,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeff2',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  menuToggle: {
    padding: 5,
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 4,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  activeMenuItem: {
    backgroundColor: '#f0f7ff',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
  },
  badge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eaeff2',
  },
  versionText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
  },
  // Main Content Styles
  mainContent: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 24,
    overflow: 'auto',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
  },
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Card Styles
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeff2',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#7f8c8d',
  }
});