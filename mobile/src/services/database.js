import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { openDatabase } from 'expo-sqlite';

// API configuration
// Use 10.0.2.2 for Android emulator to connect to localhost on development machine
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/api' 
  : 'http://localhost:5000/api';
const isWeb = Platform.OS === 'web';

// Initialize the database
let db = null;

// Debug logging
const log = (message, data = '') => {
  if (__DEV__) {
    console.log(`[Database] ${message}`, data);
  }
};

// Initialize the database
export const initDatabase = async () => {
  try {
    log('Initializing database...');
    
    if (isWeb) {
      // For web, we don't need to initialize SQLite
      log('Using server API for database operations');
      return Promise.resolve({ isWeb: true });
    }
    
    // For native, initialize SQLite with proper error handling
    try {
      db = openDatabase('quickkart.db');
      log('SQLite database opened successfully');
    } catch (error) {
      console.error('Error opening SQLite database:', error);
      throw new Error(`Failed to open database: ${error.message}`);
    }
    
    // Initialize tables for native
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            originalPrice REAL,
            unit TEXT,
            image TEXT,
            stock INTEGER DEFAULT 0,
            rating REAL,
            deliveryTime TEXT,
            category TEXT,
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT DEFAULT (datetime('now'))
          )`,
          [],
          () => {
            log('Products table created successfully');
            resolve();
          },
          (_, error) => {
            log('Error creating products table:', error);
            reject(error);
            return true;
          }
        );
      });
    });
    
    log('SQLite database initialized successfully');
    return db;
  } catch (error) {
    log('Error initializing SQLite database:', error);
    throw error;
  }
};

// Get database instance
export const getDatabase = () => {
  if (isWeb) {
    return { isWeb: true };
  }
  
  if (!db) {
    // Try to initialize the database if it's not already initialized
    console.warn('Database not initialized. Attempting to initialize...');
    return initDatabase().then(() => db);
  }
  
  return db;
};

// Helper function to execute SQL queries with proper error handling
const executeSql = (query, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      return reject(new Error('Database not initialized'));
    }
    
    db.transaction(
      tx => {
        tx.executeSql(
          query,
          params,
          (_, result) => resolve(result),
          (_, error) => {
            console.error('SQL Error:', error);
            reject(error);
            return false;
          }
        );
      },
      error => {
        console.error('Transaction Error:', error);
        reject(error);
      }
    );
  });
};

// Save a product to the database
export const saveProduct = async (product) => {
  if (isWeb) {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save product');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  }

  // For native, ensure database is initialized
  if (!db) {
    await initDatabase();
  }

  try {
    await executeSql(
      `INSERT OR REPLACE INTO products (
        id, name, description, price, originalPrice, unit, 
        image, stock, rating, deliveryTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.description || '',
        product.price,
        product.originalPrice || null,
        product.unit || 'pcs',
        product.image || null,
        product.stock || 0,
        product.rating || 0,
        product.deliveryTime || '30-45 min'
      ]
    );
    
    // Return the saved product
    return getProductById(product.id);
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
};

// Get all products from the database
export const getAllProducts = async () => {
  if (isWeb) {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // For native, ensure database is initialized
  if (!db) {
    await initDatabase();
  }

  try {
    const result = await executeSql('SELECT * FROM products');
    const products = [];
    for (let i = 0; i < result.rows.length; i++) {
      products.push(result.rows.item(i));
    }
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get a single product by ID
export const getProductById = async (id) => {
  if (isWeb) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  // For native, ensure database is initialized
  if (!db) {
    await initDatabase();
  }

  try {
    const result = await executeSql('SELECT * FROM products WHERE id = ?', [id]);
    if (result.rows.length > 0) {
      return result.rows.item(0);
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

// Delete a product by ID
export const deleteProduct = async (id) => {
  if (isWeb) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }

  // For native, ensure database is initialized
  if (!db) {
    await initDatabase();
  }

  try {
    const result = await executeSql('DELETE FROM products WHERE id = ?', [id]);
    
    if (result.rowsAffected > 0) {
      return true;
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};

export default {
  initDatabase,
  saveProduct,
  getAllProducts,
  getProductById,
  deleteProduct
};
