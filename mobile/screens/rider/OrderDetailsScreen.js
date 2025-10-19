import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  Platform,
  Linking,
  Clipboard
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Sample data - replace with actual API call
const sampleOrder = {
  id: '#ORD-12345',
  customerName: 'John Doe',
  phone: '+91 9876543210',
  deliveryAddress: '123, Main Street, City, State - 560001',
  orderDate: '19 Oct 2023, 10:30 AM',
  deliveryStatus: 'out_for_delivery', // 'pending', 'picked_up', 'out_for_delivery', 'delivered'
  items: [
    {
      id: '1',
      name: 'Fresh Apples',
      quantity: 2,
      price: 120,
      image: 'https://via.placeholder.com/80',
      delivered: true
    },
    {
      id: '2',
      name: 'Banana Bunch',
      quantity: 1,
      price: 45,
      image: 'https://via.placeholder.com/80',
      delivered: true
    },
    {
      id: '3',
      name: 'Orange Juice',
      quantity: 3,
      price: 180,
      image: 'https://via.placeholder.com/80',
      delivered: false
    },
  ],
  total: 525,
  deliveryFee: 40,
  discount: 25,
  grandTotal: 540
};

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params || {};
  
  const [order, setOrder] = useState(sampleOrder);
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, you would fetch order details here
  useEffect(() => {
    // fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      // const response = await api.get(`/rider/orders/${orderId}`);
      // setOrder(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setIsLoading(false);
    }
  };

  const handleItemDelivered = (itemId) => {
    // Update the delivered status of the item
    const updatedItems = order.items.map(item => 
      item.id === itemId ? { ...item, delivered: !item.delivered } : item
    );
    
    // Check if all items are delivered
    const allDelivered = updatedItems.every(item => item.delivered);
    
    setOrder({
      ...order,
      items: updatedItems,
      deliveryStatus: allDelivered ? 'delivered' : order.deliveryStatus
    });
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', color: '#FFA000', icon: 'schedule' };
      case 'picked_up':
        return { text: 'Picked Up', color: '#2196F3', icon: 'inventory' };
      case 'out_for_delivery':
        return { text: 'Out for Delivery', color: '#3F51B5', icon: 'delivery-dining' };
      case 'delivered':
        return { text: 'Delivered', color: '#4CAF50', icon: 'check-circle' };
      default:
        return { text: 'Unknown', color: '#9E9E9E', icon: 'help' };
    }
  };

  const status = getStatusDetails(order.deliveryStatus);

  const handleNavigate = () => {
    // In a real app, you would open the map with the delivery address
    // For now, we'll just show an alert with the address
    Alert.alert(
      'Navigate to Delivery Location',
      `Opening navigation to: ${order.deliveryAddress}`,
      [
        {
          text: 'Open in Maps',
          onPress: () => {
            // This would open the default maps app with the address
            const address = encodeURIComponent(order.deliveryAddress);
            const url = Platform.select({
              ios: `maps:?q=${address}`,
              android: `geo:0,0?q=${address}`
            });
            Linking.openURL(url).catch(err => 
              console.error('Error opening maps:', err)
            );
          }
        },
        {
          text: 'Copy Address',
          onPress: () => {
            Clipboard.setString(order.deliveryAddress);
            Alert.alert('Address Copied', 'The delivery address has been copied to your clipboard.');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleCompleteDelivery = () => {
    if (order.items.every(item => item.delivered)) {
      Alert.alert(
        'Delivery Complete',
        'All items have been delivered successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert(
        'Incomplete Delivery',
        'Please mark all items as delivered before completing the delivery.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
              <Icon name={status.icon} size={20} color={status.color} />
            </View>
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID:</Text>
              <Text style={styles.infoValue}>{order.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Date:</Text>
              <Text style={styles.infoValue}>{order.orderDate}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="location-on" size={20} color="#F8C400" />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText}>{order.deliveryAddress}</Text>
          <TouchableOpacity 
            style={styles.navigateButton}
            onPress={handleNavigate}
          >
            <Icon name="directions" size={20} color="#fff" />
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Icon name="person" size={16} color="666" />
              <Text style={styles.contactText}>{order.customerName}</Text>
            </View>
            <View style={styles.contactItem}>
              <Icon name="phone" size={16} color="#666" />
              <Text style={styles.contactText}>{order.phone}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="shopping-bag" size={20} color="#F8C400" />
            <Text style={styles.cardTitle}>Order Items</Text>
          </View>
          
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemContainer}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.itemImage} 
                resizeMode="cover"
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>₹{item.price.toFixed(2)} × {item.quantity}</Text>
                <Text style={styles.itemTotal}>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.deliveredButton,
                  item.delivered && styles.deliveredButtonActive
                ]}
                onPress={() => handleItemDelivered(item.id)}
              >
                <Icon 
                  name={item.delivered ? 'check-circle' : 'radio-button-unchecked'} 
                  size={24} 
                  color={item.delivered ? '#4CAF50' : '#ccc'} 
                />
                <Text 
                  style={[
                    styles.deliveredText,
                    item.delivered && { color: '#4CAF50' }
                  ]}
                >
                  {item.delivered ? 'Delivered' : 'Mark as Delivered'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{order.total.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₹{order.deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>-₹{order.discount.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotal]}>  
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>₹{order.grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Complete Delivery Button */}
      {order.deliveryStatus !== 'delivered' && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.completeButton,
              !order.items.every(item => item.delivered) && styles.completeButtonDisabled
            ]}
            onPress={handleCompleteDelivery}
            disabled={!order.items.every(item => item.delivered)}
          >
            <Text style={styles.completeButtonText}>
              {order.items.every(item => item.delivered) 
                ? 'Complete Delivery' 
                : 'Mark All Items as Delivered'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderInfo: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    maxWidth: '90%',
  },
  itemPrice: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deliveredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    height: 40,
    alignSelf: 'center',
  },
  deliveredButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  deliveredText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8C400',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  completeButton: {
    backgroundColor: '#F8C400',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderDetailsScreen;
