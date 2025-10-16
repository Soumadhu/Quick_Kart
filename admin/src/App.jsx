import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <aside className="w-64 bg-white shadow-lg">
          <div className="p-6 bg-yellow-400">
            <h1 className="text-2xl font-bold">Blinkit Admin</h1>
            <p className="text-sm">Quick Commerce</p>
          </div>
          <nav className="mt-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-gray-700 hover:bg-yellow-50 ${
                  isActive ? 'bg-yellow-50 border-r-4 border-yellow-400' : ''
                }`
              }
            >
              <span className="mr-3">📊</span>
              Dashboard
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-gray-700 hover:bg-yellow-50 ${
                  isActive ? 'bg-yellow-50 border-r-4 border-yellow-400' : ''
                }`
              }
            >
              <span className="mr-3">🛍️</span>
              Products
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-gray-700 hover:bg-yellow-50 ${
                  isActive ? 'bg-yellow-50 border-r-4 border-yellow-400' : ''
                }`
              }
            >
              <span className="mr-3">📦</span>
              Orders
            </NavLink>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
