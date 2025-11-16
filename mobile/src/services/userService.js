import { getDatabase, initDatabase } from './database';

// Initialize users table
const initUsersTable = async () => {
  const db = await getDatabase();
  
  if (db.isWeb) {
    console.log('Users table will be handled by server API');
    return;
  }

  // For native, create users table
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          avatar TEXT,
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now'))
        )`,
        [],
        () => {
          console.log('Users table created successfully');
          resolve();
        },
        (_, error) => {
          console.error('Error creating users table:', error);
          reject(error);
          return true;
        }
      );
    });
  });
};

// Save or update user in database
export const saveUser = async (user) => {
  console.log('Saving user to database:', user);
  await initUsersTable();
  
  if (typeof window !== 'undefined' && window.location) {
    // Web environment
    try {
      const response = await fetch(`${window.location.origin}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  // For native
  const db = await getDatabase();
  
  try {
    const result = await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO users (
            id, name, phone, email, avatar
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            user.id || '1', // Default user ID for demo
            user.name,
            user.phone,
            user.email,
            user.avatar || null
          ],
          (_, result) => {
            console.log('User inserted successfully:', result);
            resolve(result);
          },
          (_, error) => {
            console.error('SQL Error:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    
    console.log('User saved successfully:', user);
    return user;
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id = '1') => {
  console.log('Getting user from database with ID:', id);
  await initUsersTable();
  
  if (typeof window !== 'undefined' && window.location) {
    // Web environment
    try {
      const response = await fetch(`${window.location.origin}/api/users/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  // Native environment
  const db = await getDatabase();
  
  try {
    const result = await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE id = ?',
          [id],
          (_, result) => {
            console.log('User query result:', result);
            resolve(result);
          },
          (_, error) => {
            console.error('SQL Error:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    
    if (result.rows.length > 0) {
      console.log('User found:', result.rows.item(0));
      return result.rows.item(0);
    } else {
      console.log('User not found, returning null');
      return null; // User not found
    }
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
};

// Update user information
export const updateUser = async (user) => {
  console.log('Updating user in database:', user);
  await initUsersTable();
  
  if (typeof window !== 'undefined' && window.location) {
    // Web environment
    try {
      const response = await fetch(`${window.location.origin}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Native environment
  const db = await getDatabase();
  
  try {
    const result = await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE users SET 
            name = ?, 
            phone = ?, 
            email = ?, 
            avatar = ?,
            updatedAt = datetime('now')
          WHERE id = ?`,
          [
            user.name,
            user.phone,
            user.email,
            user.avatar || null,
            user.id || '1'
          ],
          (_, result) => {
            console.log('User update result:', result);
            resolve(result);
          },
          (_, error) => {
            console.error('SQL Error:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    
    if (result.rowsAffected > 0) {
      console.log('User updated successfully:', user);
      return user;
    } else {
      console.log('User not found or no changes made, inserting new user');
      // If no rows were affected, try to insert the user
      return await saveUser(user);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Get all users (for admin purposes)
export const getAllUsers = async () => {
  await initUsersTable();
  
  if (typeof window !== 'undefined' && window.location) {
    // Web environment
    try {
      const response = await fetch(`${window.location.origin}/api/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Native environment
  const db = await getDatabase();
  
  try {
    const result = await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users',
          [],
          (_, result) => resolve(result),
          (_, error) => {
            console.error('SQL Error:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    
    const users = [];
    for (let i = 0; i < result.rows.length; i++) {
      users.push(result.rows.item(i));
    }
    console.log('All users:', users);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export default {
  initUsersTable,
  saveUser,
  getUserById,
  updateUser,
  getAllUsers
};
