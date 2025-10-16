# Blinkit-Like Quick Commerce Mobile App

## Overview
A comprehensive quick commerce mobile application similar to Blinkit, built with React Native and Expo. The app features product browsing, shopping cart, checkout, order tracking, and user profile management.

## Project Structure

```
mobile/
├── App.js                 # Main app with navigation setup
├── screens/               # All mobile app screens
│   ├── HomeScreen.js          # Product browsing & search
│   ├── CategoriesScreen.js    # Category-filtered products
│   ├── ProductDetailsScreen.js # Product details & add to cart
│   ├── CartScreen.js          # Shopping cart management
│   ├── CheckoutScreen.js      # Checkout & payment
│   ├── OrdersScreen.js        # Order history & tracking
│   └── ProfileScreen.js       # User profile & addresses
└── shared/                # Shared mock data
    └── mockData.js        # Products, categories, orders, users
```

## Features

### Mobile App (React Native + Expo)
- **Home Screen**: Product browsing with search, categories, and popular products
- **Categories**: Browse products by category (Vegetables & Fruits, Dairy, Snacks, etc.)
- **Product Details**: Detailed product view with ratings, stock info, and quantity selector
- **Shopping Cart**: Add/remove items, update quantities, view bill details
- **Checkout**: Select delivery address, payment method, place orders
- **Orders**: View order history with status tracking (Pending, Out for Delivery, Delivered)
- **Profile**: User information, saved addresses, and quick access menu

## Technology Stack

- **React Native** with Expo
- **React Navigation** (Stack & Bottom Tabs)
- **Expo Web** support for browser preview
- **Custom Blinkit-inspired UI** (Yellow branding #F8C400)

## Data Architecture

Mock data is located in `mobile/shared/mockData.js`:
- **Products**: 8 sample products across various categories
- **Categories**: 8 categories (Vegetables, Dairy, Snacks, etc.)
- **Orders**: Sample orders with different statuses
- **Users**: User profile with saved addresses
- **Helper Functions**: Cart management and CRUD operations

## Running the Project

### Web Preview (Current)
The app is running in web mode on port 5000:
```bash
cd mobile && PORT=5000 npx expo start --web --port 5000
```

### For Android Device
To run on your Android phone:
```bash
cd mobile && npx expo start
```
Then scan the QR code with the **Expo Go** app (download from Play Store).

### For Development Build
For a native Android build:
```bash
cd mobile && npx expo run:android
```

## Design Highlights
- **Blinkit Branding**: Yellow (#F8C400) primary color throughout
- **Fast Delivery Messaging**: "Delivery in 8 minutes" prominently displayed
- **Clean Product Cards**: Emoji-based product images for visual appeal
- **Responsive Mobile UI**: Optimized for touch interactions

## Recent Changes (Oct 16, 2025)
1. Set up React Native/Expo mobile app with web support
2. Created complete shopping flow with 7 screens
3. Implemented React Navigation with bottom tabs + stack navigation
4. Added mock data for products, orders, and user profiles
5. Configured web preview on port 5000 for easy testing

## Next Steps / Future Enhancements
1. **Backend Integration**: Replace mock data with REST API or GraphQL backend
2. **Authentication**: Add user login/signup with OTP verification
3. **Payment Gateway**: Integrate Stripe, Razorpay, or similar for real payments
4. **Real-time Updates**: Implement WebSocket for live order tracking
5. **Push Notifications**: Order status updates via push notifications
6. **Image Uploads**: Replace emoji icons with actual product images
7. **Search Enhancement**: Add filters, sorting, and advanced search
8. **Testing**: Add unit and integration tests
9. **Build APK**: Create production Android build for distribution

## Notes
- App currently runs in web mode for easy preview in Replit
- To test on Android, use Expo Go app on your phone
- Cart state is maintained locally for demo purposes
- For production, implement proper state management (Redux/Zustand) or API layer
