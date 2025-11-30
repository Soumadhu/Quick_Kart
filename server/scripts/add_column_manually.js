const knex = require('../src/config/db');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../knexfile').development;

async function addColumnManually() {
  // Get the database file path from knexfile
  const dbPath = path.resolve(process.cwd(), config.connection.filename);
  console.log('Database path:', dbPath);

  // Create a direct SQLite3 connection
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Connected to SQLite database');
  });

  try {
    // Check if column exists
    const columnExists = await new Promise((resolve) => {
      db.get(
        "PRAGMA table_info(riders)",
        [],
        (err, rows) => {
          if (err) {
            console.error('Error checking columns:', err);
            resolve(false);
            return;
          }
          const hasColumn = rows.some(col => col.name === 'profile_picture');
          resolve(hasColumn);
        }
      );
    });

    if (columnExists) {
      console.log('profile_picture column already exists');
      return;
    }

    console.log('Adding profile_picture column...');
    
    // Add the column
    await new Promise((resolve, reject) => {
      db.run(
        'ALTER TABLE riders ADD COLUMN profile_picture TEXT',
        (err) => {
          if (err) {
            console.error('Error adding column:', err);
            reject(err);
            return;
          }
          console.log('Successfully added profile_picture column');
          resolve();
        }
      );
    });

    // Verify the column was added
    const verify = await new Promise((resolve) => {
      db.get("PRAGMA table_info(riders)", [], (err, rows) => {
        if (err) {
          console.error('Error verifying columns:', err);
          resolve(false);
          return;
        }
        const hasColumn = rows.some(col => col.name === 'profile_picture');
        resolve(hasColumn);
      });
    });

    if (verify) {
      console.log('Successfully verified profile_picture column exists');
    } else {
      console.error('Failed to verify column was added');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  }
}

addColumnManually();
