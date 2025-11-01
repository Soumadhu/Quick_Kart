import { Alert, Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export const initiateRazorpayPayment = async (amount, orderId, name, email, phone) => {
  // Replace with your Razorpay key ID from the Razorpay dashboard
  const RAZORPAY_KEY_ID = 'YOUR_RAZORPAY_KEY_ID';
  
  try {
    // In a real app, you would make an API call to your backend to create an order
    // For now, we'll use a mock order ID
    const order = { id: `order_${Date.now()}` };
    
    // Payment options
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: (amount * 100).toString(), // Razorpay expects amount in paise
      currency: 'INR',
      name: 'QuickKart',
      description: 'Order Payment',
      order_id: order.id,
      prefill: {
        name: name || 'Customer',
        email: email || 'customer@example.com',
        contact: phone || '9999999999',
      },
      theme: {
        color: '#F8C400' // Match your app's theme
      }
    };

    // Create a URL with the payment options
    const razorpayUrl = `https://checkout.razorpay.com/v1/checkout.html?${Object.entries(options)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(
        typeof value === 'object' ? JSON.stringify(value) : value
      )}`)
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
