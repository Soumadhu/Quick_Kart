import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { products, orders } from '../../../shared/mockData';

export default function Dashboard() {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 20).length;

  const ordersByStatus = {
    Pending: orders.filter(o => o.status === 'Pending').length,
    'Out for Delivery': orders.filter(o => o.status === 'Out for Delivery').length,
    Delivered: orders.filter(o => o.status === 'Delivered').length,
  };

  const salesData = [
    { day: 'Mon', sales: 4500 },
    { day: 'Tue', sales: 5200 },
    { day: 'Wed', sales: 4800 },
    { day: 'Thu', sales: 6100 },
    { day: 'Fri', sales: 5900 },
    { day: 'Sat', sales: 7200 },
    { day: 'Sun', sales: 6800 },
  ];

  const categoryData = [
    { name: 'Veg & Fruits', value: 2800 },
    { name: 'Dairy', value: 1900 },
    { name: 'Snacks', value: 2400 },
    { name: 'Beverages', value: 2200 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-4xl mb-2">💰</div>
          <div className="text-sm opacity-90">Total Revenue</div>
          <div className="text-2xl font-bold">₹{totalRevenue}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-4xl mb-2">📦</div>
          <div className="text-sm opacity-90">Total Orders</div>
          <div className="text-2xl font-bold">{totalOrders}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-4xl mb-2">🛍️</div>
          <div className="text-sm opacity-90">Total Products</div>
          <div className="text-2xl font-bold">{totalProducts}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-sm opacity-90">Low Stock Items</div>
          <div className="text-2xl font-bold">{lowStockProducts}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Weekly Sales</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#F8C400" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#F8C400" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Order Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                {ordersByStatus.Pending}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Out for Delivery</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                {ordersByStatus['Out for Delivery']}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delivered</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                {ordersByStatus.Delivered}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow col-span-2">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <div className="font-semibold">{order.id}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{order.total}</div>
                  <div className="text-xs text-gray-600">{order.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
