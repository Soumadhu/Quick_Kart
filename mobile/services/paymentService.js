import { Alert, Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export const initiateRazorpayPayment = async (amount, orderId, name, email, mobile) => {
  // Replace with your Razorpay key ID from the Razorpay dashboard
  const RAZORPAY_KEY_ID = 'YOUR_RAZORPAY_KEY_ID';
  
  // Generate a random receipt ID for the order
  const receipt = `order_${Math.floor(Math.random() * 1000000)}`;
  
  // Create order data
  const orderData = {
    amount: amount * 100, // Razorpay expects amount in paise (multiply by 100)
    currency: 'INR',
    receipt: receipt,
    payment_capture: 1
  };

  try {
    // In a real app, you would make an API call to your backend to create an order
    // For now, we'll use a mock order ID
    const order = { id: `order_${Date.now()}` };
    
    // Payment options
    const options = {
      description: 'Payment for your order',
      image: 'https://your-logo-url.com/logo.png',
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: orderData.amount.toString(),
      name: 'QuickKart',
      order_id: order.id,
      prefill: {
        email: email || 'customer@example.com',
        contact: mobile || '9999999999',
        name: name || 'Customer'
      },
      theme: { color: '#F8C400' }
    };

    // Open Razorpay Checkout in a web browser
    const razorpayUrl = `https://checkout.razorpay.com/v1/checkout.html?${Object.entries(options)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')}`;

    // Open in device browser (better compatibility with Razorpay)
    const supported = await Linking.canOpenURL(razorpayUrl);
    if (supported) {
      await Linking.openURL(razorpayUrl);
    } else {
      // Fallback to WebBrowser if Linking doesn't work
      await WebBrowser.openBrowserAsync(razorpayUrl);
    }

    // Note: In a real app, you would verify the payment on your backend
    // and update the order status accordingly
    
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('Payment error:', error);
    Alert.alert('Payment Error', 'There was an error processing your payment. Please try again.');
    return { success: false, error: error.message };
  }
};
