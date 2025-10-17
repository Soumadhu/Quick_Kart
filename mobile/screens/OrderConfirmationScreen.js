import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const OrderConfirmationScreen = ({ navigation, route }) => {
  const { amount, method, orderNumber = `BLK${Math.floor(100000 + Math.random() * 900000)}` } = route.params || {};
  const estimatedDelivery = new Date();
  estimatedDelivery.setHours(estimatedDelivery.getHours() + 1); // 1 hour from now

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <MaterialIcons name="check-circle" size={80} color="#4caf50" />
        </View>
        
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.subtitle}>Your order has been placed successfully</Text>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order Number</Text>
            <Text style={styles.summaryValue}>#{orderNumber}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Method</Text>
            <Text style={styles.summaryValue}>{method}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount Paid</Text>
            <Text style={[styles.summaryValue, styles.amount]}>₹{amount?.toFixed(2) || '0.00'}</Text>
          </View>
          
          <View style={[styles.summaryRow, { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' }]}>
            <View>
              <Text style={styles.summaryLabel}>Estimated Delivery</Text>
              <Text style={[styles.summaryValue, { fontSize: 16, marginTop: 4 }]}>
                {estimatedDelivery.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.deliveryIcon}>
              <MaterialIcons name="delivery-dining" size={24} color="#4caf50" />
            </View>
          </View>
        </View>
        
        <View style={styles.trackingCard}>
          <View style={styles.timeline}>
            <View style={[styles.timelineDot, styles.activeDot]} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, styles.inactiveDot]} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, styles.inactiveDot]} />
          </View>
          
          <View style={styles.trackingSteps}>
            <View style={styles.trackingStep}>
              <Text style={styles.stepTitle}>Order Confirmed</Text>
              <Text style={styles.stepTime}>Just now</Text>
            </View>
            <View style={styles.trackingStep}>
              <Text style={[styles.stepTitle, styles.inactiveStep]}>Preparing your order</Text>
              <Text style={[styles.stepTime, styles.inactiveStep]}>Estimated: 15 min</Text>
            </View>
            <View style={styles.trackingStep}>
              <Text style={[styles.stepTitle, styles.inactiveStep]}>On the way</Text>
              <Text style={[styles.stepTime, styles.inactiveStep]}>Estimated: 30 min</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.trackButton}
          onPress={() => navigation.navigate('OrderTracking', { orderNumber })}
        >
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => navigation.navigate('HomeTabs')}
        >
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
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