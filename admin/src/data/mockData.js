export const categories = [
  { id: '1', name: 'Vegetables & Fruits', icon: '🥬', color: '#22C55E' },
  { id: '2', name: 'Dairy & Breakfast', icon: '🥛', color: '#3B82F6' },
  { id: '3', name: 'Snacks & Munchies', icon: '🍿', color: '#F59E0B' },
  { id: '4', name: 'Beverages', icon: '🥤', color: '#EF4444' },
  { id: '5', name: 'Instant & Frozen', icon: '❄️', color: '#8B5CF6' },
  { id: '6', name: 'Bakery & Biscuits', icon: '🍞', color: '#EC4899' },
  { id: '7', name: 'Cleaning & Household', icon: '🧹', color: '#06B6D4' },
  { id: '8', name: 'Personal Care', icon: '🧴', color: '#10B981' },
];

export let products = [
  {
    id: '1',
    name: 'Fresh Tomatoes',
    category: '1',
    price: 35,
    originalPrice: 50,
    unit: '500g',
    image: '🍅',
    stock: 50,
    rating: 4.5,
    deliveryTime: '8 mins',
  },
  {
    id: '2',
    name: 'Organic Bananas',
    category: '1',
    price: 40,
    originalPrice: null,
    unit: '6 pcs',
    image: '🍌',
    stock: 30,
    rating: 4.7,
    deliveryTime: '8 mins',
  },
  {
    id: '3',
    name: 'Fresh Milk',
    category: '2',
    price: 28,
    originalPrice: null,
    unit: '500ml',
    image: '🥛',
    stock: 40,
    rating: 4.6,
    deliveryTime: '8 mins',
  },
  {
    id: '4',
    name: 'Bread Slices',
    category: '6',
    price: 35,
    originalPrice: 42,
    unit: '400g',
    image: '🍞',
    stock: 25,
    rating: 4.3,
    deliveryTime: '10 mins',
  },
  {
    id: '5',
    name: 'Potato Chips',
    category: '3',
    price: 20,
    originalPrice: null,
    unit: '100g',
    image: '🥔',
    stock: 60,
    rating: 4.4,
    deliveryTime: '8 mins',
  },
  {
    id: '6',
    name: 'Cold Coffee',
    category: '4',
    price: 60,
    originalPrice: 80,
    unit: '200ml',
    image: '☕',
    stock: 35,
    rating: 4.8,
    deliveryTime: '8 mins',
  },
  {
    id: '7',
    name: 'Frozen Peas',
    category: '5',
    price: 45,
    originalPrice: null,
    unit: '500g',
    image: '🫛',
    stock: 20,
    rating: 4.2,
    deliveryTime: '12 mins',
  },
  {
    id: '8',
    name: 'Hand Wash',
    category: '8',
    price: 85,
    originalPrice: 100,
    unit: '250ml',
    image: '🧴',
    stock: 15,
    rating: 4.5,
    deliveryTime: '10 mins',
  },
];

export const users = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+91 9876543210',
    email: 'john@example.com',
    addresses: [
      {
        id: 'a1',
        type: 'Home',
        address: '123 Main Street, Apartment 4B',
        city: 'Mumbai',
        pincode: '400001',
        isDefault: true,
      },
      {
        id: 'a2',
        type: 'Work',
        address: '456 Business Park, Tower A',
        city: 'Mumbai',
        pincode: '400051',
        isDefault: false,
      },
    ],
  },
];

export let orders = [
  {
    id: 'ORD001',
    userId: '1',
    items: [
      { productId: '1', quantity: 2, price: 35 },
      { productId: '3', quantity: 1, price: 28 },
    ],
    total: 98,
    status: 'Delivered',
    deliveryAddress: users[0].addresses[0],
    orderDate: '2025-10-14T10:30:00',
    deliveryDate: '2025-10-14T10:45:00',
  },
  {
    id: 'ORD002',
    userId: '1',
    items: [
      { productId: '6', quantity: 2, price: 60 },
      { productId: '5', quantity: 3, price: 20 },
    ],
    total: 180,
    status: 'Out for Delivery',
    deliveryAddress: users[0].addresses[0],
    orderDate: '2025-10-16T09:15:00',
    deliveryDate: null,
  },
  {
    id: 'ORD003',
    userId: '1',
    items: [
      { productId: '2', quantity: 1, price: 40 },
      { productId: '4', quantity: 2, price: 35 },
    ],
    total: 110,
    status: 'Pending',
    deliveryAddress: users[0].addresses[1],
    orderDate: '2025-10-16T14:20:00',
    deliveryDate: null,
  },
];

export const addProduct = (product) => {
  products.push({ ...product, id: String(products.length + 1) });
};

export const updateProduct = (id, updatedProduct) => {
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...updatedProduct };
  }
};

export const deleteProduct = (id) => {
  products = products.filter(p => p.id !== id);
};

export const updateOrderStatus = (orderId, status) => {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    if (status === 'Delivered') {
      order.deliveryDate = new Date().toISOString();
    }
  }
};
