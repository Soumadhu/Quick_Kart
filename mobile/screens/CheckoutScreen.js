import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { users } from '../shared/mockData';

export default function CheckoutScreen({ navigation }) {
  const user = users[0];
  const [selectedAddress, setSelectedAddress] = useState(user.addresses[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoError, setPromoError] = useState('');

  const subtotal = 98;
  const deliveryFee = 10;
  const discount = appliedPromo ? Math.floor(subtotal * 0.1) : 0;
  const total = subtotal + deliveryFee - discount;

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    
    if (promoCode.toUpperCase() === 'WELCOME10') {
      setAppliedPromo({
        code: promoCode.toUpperCase(),
        discount: Math.floor(subtotal * 0.1),
      });
      setPromoError('');
      setShowPromoInput(false);
    } else {
      setPromoError('Invalid promo code');
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const handlePlaceOrder = () => {
    Alert.alert(
      'Order Placed!',
      'Your order has been placed successfully. It will be delivered in 8 minutes.',
      [
        {
          text: 'View Order',
          onPress: () => navigation.navigate('Orders'),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        {user.addresses.map((address) => (
          <TouchableOpacity
            key={address.id}
            style={[
              styles.addressCard,
              selectedAddress.id === address.id && styles.selectedAddress,
            ]}
            onPress={() => setSelectedAddress(address)}
          >
            <View style={styles.radioButton}>
              {selectedAddress.id === address.id && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressType}>{address.type}</Text>
              <Text style={styles.addressText}>{address.address}</Text>
              <Text style={styles.addressText}>
                {address.city} - {address.pincode}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Promo Code Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Promo Code</Text>
        {appliedPromo ? (
          <View style={styles.appliedPromoContainer}>
            <Text style={styles.appliedPromoText}>
              Promo {appliedPromo.code} applied (-₹{appliedPromo.discount})
            </Text>
            <TouchableOpacity onPress={removePromoCode}>
              <Text style={styles.removePromoText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : showPromoInput ? (
          <View>
            <View style={styles.promoInputContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={handleApplyPromo}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
            {promoError ? <Text style={styles.errorText}>{promoError}</Text> : null}
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addPromoButton}
            onPress={() => setShowPromoInput(true)}
          >
            <Text style={styles.addPromoText}>+ Add Promo Code</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {['Cash on Delivery', 'UPI', 'Card', 'Wallet'].map((method) => (
          <TouchableOpacity
            key={method}
            style={[
              styles.paymentCard,
              paymentMethod === method && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod(method)}
          >
            <View style={styles.radioButton}>
              {paymentMethod === method && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.paymentText}>{method}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill Summary</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Subtotal</Text>
          <Text style={styles.billValue}>₹{subtotal}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery Fee</Text>
          <Text style={styles.billValue}>₹{deliveryFee}</Text>
        </View>
        {appliedPromo && (
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Promo Discount</Text>
            <Text style={[styles.billValue, {color: '#4CAF50'}]}>-₹{discount}</Text>
          </View>
        )}
        <View style={[styles.billRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{total}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
        <Text style={styles.placeOrderText}>Place Order</Text>
        <Text style={styles.placeOrderPrice}>₹{total}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  // Address Card Styles
  addressCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  selectedAddress: {
    borderColor: '#F8C400',
    backgroundColor: '#FFF9E5',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F8C400',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F8C400',
  },
  addressInfo: {
    flex: 1,
  },
  addressType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  // Payment Method Styles
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  selectedPayment: {
    borderColor: '#F8C400',
    backgroundColor: '#FFF9E5',
  },
  paymentText: {
    fontSize: 16,
  },
  // Promo Code Styles
  addPromoButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#F8C400',
    borderRadius: 8,
    alignItems: 'center',
  },
  addPromoText: {
    color: '#F8C400',
    fontWeight: '600',
  },
  promoInputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 14,
  },
  applyButton: {
    backgroundColor: '#F8C400',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  appliedPromoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  appliedPromoText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  removePromoText: {
    color: '#D32F2F',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
  },
  // Bill Summary Styles
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
    color: '#666',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeOrderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8C400',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeOrderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});