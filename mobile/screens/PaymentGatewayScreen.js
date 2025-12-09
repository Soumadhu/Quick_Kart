import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Image,
  Dimensions,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: 'credit-card',
    description: 'Pay using your credit or debit card',
    color: '#6200ee',
  },
  {
    id: 'upi',
    name: 'UPI',
    icon: 'smartphone',
    description: 'Pay using any UPI app',
    color: '#03dac6',
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    icon: 'bank',
    description: 'Pay using your bank account',
    color: '#3700b3',
  },
  {
    id: 'wallet',
    name: 'Wallets',
    icon: 'wallet',
    description: 'Pay using Paytm, PhonePe, etc.',
    color: '#ff6d00',
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    icon: 'truck-delivery',
    description: 'Pay when you receive your order',
    color: '#00c853',
  },
];

const banks = [
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'axis', name: 'Axis Bank' },
];

const wallets = [
  { id: 'paytm', name: 'Paytm' },
  { id: 'phonepe', name: 'PhonePe' },
  { id: 'amazonpay', name: 'Amazon Pay' },
  { id: 'mobikwik', name: 'MobiKwik' },
];

const PaymentGatewayScreen = ({ navigation, route }) => {
  const { totalAmount = 0, cartItems = [] } = route.params || {};
  const [selectedMethod, setSelectedMethod] = useState('cod'); // Default to Cash on Delivery
  const [loading, setLoading] = useState(true);
  const [saveCard, setSaveCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Processing your order...</Text>
      </View>
    );
  }

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Get the latest cart data
      const currentCart = route.params?.cartItems || [];
      
      if (currentCart.length === 0) {
        Alert.alert('Error', 'Your cart is empty');
        return;
      }

      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const paymentMethod = paymentMethods.find(m => m.id === selectedMethod)?.name || 'Online Payment';
      
      // Calculate total amount including tax
      const subtotal = currentCart.reduce((sum, item) => {
        const price = item.product?.price || item.price || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
      }, 0);
      
      const tax = subtotal * 0.18; // 18% tax
      const total = subtotal + tax;
      
      // Prepare order items in the required format
      const orderItems = currentCart.map(item => ({
        id: item.id || item.product?.id,
        product: {
          id: item.id || item.product?.id,
          name: item.name || item.product?.name || 'Unknown Product',
          price: item.price || item.product?.price || 0,
          image: item.image || item.product?.image
        },
        quantity: item.quantity || 1,
        price: item.price || item.product?.price || 0
      }));
      
      // Navigate to order confirmation with all necessary data
      navigation.navigate('OrderConfirmation', { 
        amount: total,
        method: paymentMethod,
        orderNumber,
        items: orderItems,
        deliveryAddress: {
          // Add delivery address details here or get from user input
          name: 'Your Name',
          street: '123 Main St',
          city: 'Your City',
          state: 'Your State',
          pincode: '123456',
          phone: '+1234567890'
        },
        paymentDetails: {
          method: paymentMethod,
          transactionId: `TXN${Date.now()}`,
          status: 'completed'
        }
      });
      
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return `₹${amount?.toFixed(2) || '0.00'}`;
  };

  const renderPaymentMethodIcon = (method) => {
    const iconProps = {
      size: 24,
      color: paymentMethods.find(m => m.id === method)?.color || '#6200ee',
    };

    switch(method) {
      case 'card':
        return <MaterialIcons name="credit-card" {...iconProps} />;
      case 'upi':
        return <MaterialIcons name="smartphone" {...iconProps} />;
      case 'netbanking':
        return <MaterialIcons name="account-balance" {...iconProps} />;
      case 'wallet':
        return <MaterialIcons name="account-balance-wallet" {...iconProps} />;
      case 'cod':
        return <MaterialIcons name="local-shipping" {...iconProps} />;
      default:
        return null;
    }
  };

  const renderCardTypeIcon = (number) => {
    if (/^4/.test(number)) {
      return <FontAwesome5 name="cc-visa" size={32} color="#1A1F71" />;
    } else if (/^5[1-5]/.test(number)) {
      return <FontAwesome5 name="cc-mastercard" size={32} color="#EB001B" />;
    } else if (/^3[47]/.test(number)) {
      return <FontAwesome5 name="cc-amex" size={32} color="#006FCF" />;
    }
    return <MaterialIcons name="credit-card" size={32} color="#6200ee" />;
  };

  const formatCardNumber = (input) => {
    const v = input.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    }
    return input;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Amount */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amount}>{formatAmount(totalAmount)}</Text>
            <Text style={styles.orderInfo}>Order #BLK{Math.floor(100000 + Math.random() * 900000)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.paymentMethodsContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  selectedMethod === method.id && styles.paymentMethodCardSelected,
                  { borderLeftColor: method.color }
                ]}
                onPress={() => setSelectedMethod(method.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.paymentMethodIconContainer, { backgroundColor: `${method.color}20` }]}>
                  {renderPaymentMethodIcon(method.id)}
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                  <Text style={styles.paymentMethodDescription}>{method.description}</Text>
                </View>
                <View style={[
                  styles.paymentMethodRadio,
                  selectedMethod === method.id && styles.paymentMethodRadioSelected
                ]}>
                  {selectedMethod === method.id && (
                    <View style={styles.paymentMethodRadioInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card Payment Form */}
        {selectedMethod === 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            <View style={styles.cardPreview}>
              <View style={styles.cardLogoContainer}>
                {renderCardTypeIcon(cardNumber)}
              </View>
              <TextInput
                style={[styles.input, styles.cardNumberInput]}
                placeholder="Card Number"
                placeholderTextColor="#95a5a6"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="number-pad"
                maxLength={19}
              />
              <View style={styles.inputRow}>
                <View style={[styles.inputField, { marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#95a5a6"
                    value={expiry}
                    onChangeText={setExpiry}
                    maxLength={5}
                  />
                </View>
                <View style={[styles.inputField, { marginLeft: 10 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="CVV"
                    placeholderTextColor="#95a5a6"
                    value={cvv}
                    onChangeText={setCvv}
                    secureTextEntry
                    maxLength={3}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name on card"
                  placeholderTextColor="#95a5a6"
                  value={cardName}
                  onChangeText={setCardName}
                />
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

        {/* UPI Payment Form */}
        {selectedMethod === 'upi' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UPI Payment</Text>
            <View style={styles.upiContainer}>
              <View style={styles.upiIdContainer}>
                <TextInput
                  style={styles.upiInput}
                  placeholder="Enter UPI ID (e.g., name@upi)"
                  placeholderTextColor="#95a5a6"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.verifyButton}>
                  <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <TouchableOpacity style={styles.upiAppButton}>
                <MaterialIcons name="apps" size={24} color="#6200ee" />
                <Text style={styles.upiAppButtonText}>Choose UPI App</Text>
              </TouchableOpacity>
              
              <View style={styles.upiAppsGrid}>
                {['PhonePe', 'Google Pay', 'Paytm', 'BHIM'].map((app) => (
                  <TouchableOpacity key={app} style={styles.upiAppItem}>
                    <View style={styles.upiAppIcon}>
                      <Text style={styles.upiAppText}>{app[0]}</Text>
                    </View>
                    <Text style={styles.upiAppName}>{app}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Net Banking Form */}
        {selectedMethod === 'netbanking' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Bank</Text>
            <View style={styles.bankList}>
              {banks.map((bank) => (
                <TouchableOpacity 
                  key={bank.id}
                  style={[
                    styles.bankItem,
                    selectedBank === bank.id && styles.bankItemSelected
                  ]}
                  onPress={() => setSelectedBank(bank.id)}
                >
                  <View style={styles.bankIcon}>
                    <Text style={styles.bankIconText}>{bank.name[0]}</Text>
                  </View>
                  <Text style={styles.bankName}>{bank.name}</Text>
                  {selectedBank === bank.id && (
                    <MaterialIcons name="check-circle" size={24} color="#6200ee" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Wallets Form */}
        {selectedMethod === 'wallet' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Wallet</Text>
            <View style={styles.walletGrid}>
              {wallets.map((wallet) => (
                <TouchableOpacity 
                  key={wallet.id}
                  style={[
                    styles.walletItem,
                    selectedWallet === wallet.id && styles.walletItemSelected
                  ]}
                  onPress={() => setSelectedWallet(wallet.id)}
                >
                  <View style={styles.walletIcon}>
                    <Text style={styles.walletIconText}>{wallet.name[0]}</Text>
                  </View>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Cash on Delivery */}
        {selectedMethod === 'cod' && (
          <View style={styles.section}>
            <View style={styles.codContainer}>
              <View style={styles.codIcon}>
                <MaterialIcons name="delivery-dining" size={40} color="#4caf50" />
              </View>
              <Text style={styles.codTitle}>Cash on Delivery</Text>
              <Text style={styles.codDescription}>
                Pay with cash when your order is delivered. An additional ₹20 cash handling fee will be applied.
              </Text>
              <View style={styles.noteBox}>
                <MaterialIcons name="info" size={16} color="#ff9800" />
                <Text style={styles.noteText}>Please keep exact change ready for payment</Text>
              </View>
            </View>
          </View>
        )}

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <View style={styles.securityBadge}>
            <MaterialIcons name="security" size={18} color="#4caf50" />
            <Text style={styles.securityText}>Secure Payment</Text>
          </View>
          <View style={styles.paymentIcons}>
            {['visa', 'mastercard', 'lock', 'ssl'].map((icon, index) => (
              <View key={index} style={styles.paymentIcon}>
                <Text style={styles.paymentIconText}>
                  {icon === 'visa' ? 'VISA' : icon === 'mastercard' ? 'MC' : icon === 'lock' ? '🔒' : '🔐'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer with Pay Button */}
      <View style={styles.footer}>
        <View style={styles.amountSummary}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>{formatAmount(totalAmount)}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.payButton,
            !selectedMethod && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!selectedMethod}
        >
          <Text style={styles.payButtonText}>
            {selectedMethod === 'cod' ? 'Place Order' : `Pay ${formatAmount(totalAmount)}`}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 1,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  amountLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  orderInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  paymentMethodsContainer: {
    marginTop: 8,
  },
  paymentMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e0e6ed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentMethodCardSelected: {
    borderColor: '#6200ee',
    backgroundColor: '#f8f5ff',
  },
  paymentMethodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  paymentMethodDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  paymentMethodRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#dfe4ea',
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodRadioSelected: {
    borderColor: '#6200ee',
  },
  paymentMethodRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6200ee',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#e0e6ed',
    color: '#2c3e50',
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: '#6200ee',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardLogoContainer: {
    marginBottom: 20,
  },
  cardNumberInput: {
    fontSize: 18,
    letterSpacing: 1,
    height: 50,
    marginBottom: 15,
  },
  saveCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#6200ee',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#6200ee',
  },
  saveCardText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  upiContainer: {
    marginTop: 8,
  },
  upiIdContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  upiInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e0e6ed',
    fontSize: 16,
    marginRight: 10,
    color: '#2c3e50',
  },
  verifyButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#6200ee',
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#e0e6ed',
  },
  orText: {
    marginHorizontal: 15,
    color: '#95a5a6',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  upiAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f5ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#e0d6ff',
  },
  upiAppButtonText: {
    color: '#6200ee',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  upiAppsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  upiAppItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e0e6ed',
  },
  upiAppIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upiAppText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  upiAppName: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  bankList: {
    marginTop: 8,
  },
  bankItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e6ed',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankItemSelected: {
    borderColor: '#6200ee',
    backgroundColor: '#f8f5ff',
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bankIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  bankName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
  },
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  walletItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e6ed',
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletItemSelected: {
    borderColor: '#6200ee',
    backgroundColor: '#f8f5ff',
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  walletIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  walletName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  codContainer: {
    alignItems: 'center',
    padding: 30,
  },
  codIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  codTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  codDescription: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  noteText: {
    fontSize: 13,
    color: '#ff8f00',
    marginLeft: 8,
  },
  securityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  paymentIcons: {
    flexDirection: 'row',
  },
  paymentIcon: {
    marginLeft: 10,
  },
  paymentIconText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e6ed',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  amountSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  payButton: {
    backgroundColor: '#6200ee',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  payButtonDisabled: {
    backgroundColor: '#b39ddb',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default PaymentGatewayScreen;