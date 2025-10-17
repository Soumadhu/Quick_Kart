import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: '💳',
    description: 'Pay using your credit or debit card',
  },
  {
    id: 'upi',
    name: 'UPI',
    icon: '📱',
    description: 'Pay using any UPI app',
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    icon: '🏦',
    description: 'Pay using your bank account',
  },
  {
    id: 'wallet',
    name: 'Wallets',
    icon: '💰',
    description: 'Pay using Paytm, PhonePe, etc.',
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    icon: '💵',
    description: 'Pay when you receive your order',
  },
];

export default function PaymentGatewayScreen({ navigation, route }) {
  const { totalAmount = 0 } = route.params || {};
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [saveCard, setSaveCard] = useState(false);

  const handlePayment = () => {
    // Handle payment processing here
    navigation.navigate('PaymentSuccess', { amount: totalAmount });
  };

  const formatAmount = (amount) => {
    return `₹${amount?.toFixed(2) || '0.00'}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amount}>{formatAmount(totalAmount)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedMethod === method.id && styles.selectedMethod,
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDesc}>{method.description}</Text>
              </View>
              <View style={[
                styles.radioOuter,
                selectedMethod === method.id && styles.radioOuterSelected
              ]}>
                {selectedMethod === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedMethod === 'card' && (
          <View style={styles.cardForm}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.input}>
                <Text style={styles.cardNumber}>•••• •••• •••• 4242</Text>
                <Text style={styles.cardLogo}>💳</Text>
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <View style={styles.input}>
                  <Text style={styles.inputText}>MM/YY</Text>
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <View style={styles.input}>
                  <Text style={styles.inputText}>•••</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <View style={styles.input}>
                <Text style={styles.inputText}>John Doe</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.saveCardOption}
              onPress={() => setSaveCard(!saveCard)}
            >
              <View style={styles.checkbox}>
                {saveCard && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.saveCardText}>Save card for future payments</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedMethod === 'upi' && (
          <View style={styles.upiContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID</Text>
              <View style={styles.input}>
                <Text style={styles.inputText}>name@upi</Text>
              </View>
            </View>
            <Text style={styles.noteText}>You'll be redirected to your UPI app to complete the payment</Text>
          </View>
        )}

        {selectedMethod === 'cod' && (
          <View style={styles.codContainer}>
            <Text style={styles.noteText}>
              Pay with cash when your order is delivered. An additional ₹20 cash handling fee will be applied.
            </Text>
          </View>
        )}

        <View style={styles.securityInfo}>
          <Text style={styles.securityText}>🔒 Secure Payment</Text>
          <Text style={styles.securitySubtext}>Your payment information is encrypted and secure</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.amountSummary}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>{formatAmount(totalAmount)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.payButton}
          onPress={handlePayment}
        >
          <Text style={styles.payButtonText}>
            Pay {formatAmount(totalAmount)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  amountSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  selectedMethod: {
    borderColor: '#F8C400',
    backgroundColor: '#FFF9E5',
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  methodDesc: {
    fontSize: 12,
    color: '#666',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#F8C400',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F8C400',
  },
  cardForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  cardNumber: {
    fontSize: 16,
    color: '#000',
    letterSpacing: 1,
  },
  cardLogo: {
    fontSize: 20,
  },
  row: {
    flexDirection: 'row',
  },
  saveCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#666',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#F8C400',
  },
  saveCardText: {
    fontSize: 14,
    color: '#333',
  },
  upiContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  securityInfo: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  securityText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 4,
  },
  securitySubtext: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  amountSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  payButton: {
    backgroundColor: '#F8C400',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
