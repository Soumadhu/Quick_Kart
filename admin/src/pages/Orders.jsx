import React, { useState } from 'react';
import { orders as initialOrders, products, updateOrderStatus } from '../../../shared/mockData';

export default function Orders() {
  const [orders, setOrders] = useState(initialOrders);

  const getProductById = (id) => products.find(p => p.id === id);

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
    setOrders(orders.map(o => 
      o.id === orderId 
        ? { ...o, status: newStatus, deliveryDate: newStatus === 'Delivered' ? new Date().toISOString() : o.deliveryDate }
        : o
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Out for Delivery':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Orders Management</h1>

      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{order.id}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.orderDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <h4 className="font-semibold mb-2">Order Items:</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => {
                  const product = getProductById(item.productId);
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{product?.image}</span>
                        <span>{product?.name} x {item.quantity}</span>
                      </div>
                      <span className="font-semibold">₹{item.price * item.quantity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Delivery Address:</span>
              </div>
              <p className="text-sm text-gray-600">
                {order.deliveryAddress.address}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
              </p>
            </div>

            <div className="border-t pt-4 mt-4 flex justify-between items-center">
              <span className="text-lg font-bold">Total Amount:</span>
              <span className="text-2xl font-bold text-yellow-600">₹{order.total}</span>
            </div>

            {order.deliveryDate && (
              <div className="text-sm text-gray-600 mt-2">
                Delivered on: {new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
