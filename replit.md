# Blinkit-Like Quick Commerce App

## Overview
A comprehensive quick commerce application similar to Blinkit, featuring both a customer-facing React Native mobile app and a web-based admin dashboard for managing products, inventory, and orders.

## Project Structure

```
├── mobile/                 # React Native (Expo) mobile app
│   ├── App.js             # Main app with navigation setup
│   └── screens/           # All mobile app screens
│       ├── HomeScreen.js          # Product browsing & search
│       ├── CategoriesScreen.js    # Category-filtered products
│       ├── ProductDetailsScreen.js # Product details & add to cart
│       ├── CartScreen.js          # Shopping cart management
│       ├── CheckoutScreen.js      # Checkout & payment
│       ├── OrdersScreen.js        # Order history & tracking
│       └── ProfileScreen.js       # User profile & addresses
│
├── admin/                  # React (Vite) admin dashboard
│   ├── src/
│   │   ├── App.jsx        # Main admin app with routing
│   │   └── pages/         # Admin pages
│   │       ├── Dashboard.jsx      # Analytics & metrics
│   │       ├── Products.jsx       # Product management (CRUD)
│   │       └── Orders.jsx         # Order management & status updates
│   └── vite.config.js     # Vite configuration with Tailwind v4
│
└── shared/                 # Shared resources
    └── mockData.js        # Unified mock data for both apps
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

### Admin Dashboard (React + Vite + Tailwind CSS v4)
- **Dashboard**: Real-time analytics with revenue, orders, and sales charts
- **Product Management**: Add, edit, delete products with inventory tracking
- **Order Management**: View and update order statuses
- **Visual Analytics**: Charts showing weekly sales and category performance

## Technology Stack

### Mobile App
- React Native with Expo
- React Navigation (Stack & Bottom Tabs)
- Custom Blinkit-inspired UI (Yellow branding #F8C400)

### Admin Dashboard
- React 18
- Vite (build tool)
- Tailwind CSS v4 with @tailwindcss/vite plugin
- React Router v6
- Recharts (analytics visualization)

## Data Architecture

### Shared Mock Data
Both apps use a unified mock data structure located in `shared/mockData.js`:
- **Products**: 8 sample products across various categories
- **Categories**: 8 categories (Vegetables, Dairy, Snacks, etc.)
- **Orders**: Sample orders with different statuses
- **Users**: User profile with saved addresses
- **Helper Functions**: CRUD operations (addProduct, updateProduct, deleteProduct, updateOrderStatus)

**Important**: Changes made in the admin dashboard (e.g., adding/updating products) are reflected in the shared data layer. In a production setup, this would be replaced with API calls to a backend service.

## Running the Project

### Admin Dashboard (Primary)
The admin dashboard is configured as the main workflow and runs on port 5000:
```bash
cd admin && npm run dev
```
Access at: http://localhost:5000

### Mobile App (Development)
To run the mobile app locally with Expo:
```bash
cd mobile && npx expo start
```
Then scan the QR code with Expo Go app on your mobile device.

## Design Highlights
- **Blinkit Branding**: Yellow (#F8C400) primary color throughout
- **Fast Delivery Messaging**: "Delivery in 8 minutes" prominently displayed
- **Clean Product Cards**: Emoji-based product images for visual appeal
- **Responsive Admin UI**: Tailwind-powered, fully responsive dashboard

## Recent Changes (Oct 16, 2025)
1. Set up project structure with Expo (mobile) and Vite (admin)
2. Created shared mock data architecture for unified state
3. Fixed Tailwind CSS v4 integration using @tailwindcss/vite plugin
4. Implemented all mobile screens with React Navigation
5. Built complete admin dashboard with analytics and CRUD operations
6. Configured workflow for admin dashboard on port 5000

## Next Steps / Future Enhancements
1. **Backend Integration**: Replace mock data with REST API or GraphQL backend
2. **Authentication**: Add user login/signup with OTP verification
3. **Payment Gateway**: Integrate Stripe, Razorpay, or similar for real payments
4. **Real-time Updates**: Implement WebSocket for live order tracking
5. **Push Notifications**: Order status updates via push notifications
6. **Image Uploads**: Replace emoji icons with actual product images
7. **Search Enhancement**: Add filters, sorting, and advanced search
8. **Admin Auth**: Role-based access control for admin users
9. **Testing**: Add unit and integration tests for shared data helpers

## Notes
- Mobile app uses local cart state for demo purposes (frontend-only)
- Product data flows from shared module to both apps
- Admin CRUD operations update the shared data layer
- For production, implement proper state management (Redux/Zustand) or API layer
