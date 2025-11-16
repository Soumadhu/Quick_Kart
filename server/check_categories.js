const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Check both database files
const dbPaths = [
  path.join(__dirname, 'data', 'quickkart.db'),
  path.join(__dirname, 'data', 'quickkart.sqlite3')
];

dbPaths.forEach(dbPath => {
  console.log('\n' + '='.repeat(50));
  console.log('Checking database:', dbPath);
  console.log('='.repeat(50));
  
  const db = new sqlite3.Database(dbPath);
  
  // Check what tables exist
  db.serialize(() => {
    console.log('\n=== All Tables ===');
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) {
        console.error('Error getting tables:', err);
      } else {
        console.log('Tables found:');
        rows.forEach(row => {
          console.log(`- ${row.name}`);
        });
        
        // Check categories table if it exists
        if (rows.some(row => row.name === 'categories')) {
          console.log('\n=== Categories Schema ===');
          db.all("PRAGMA table_info(categories)", (err, schemaRows) => {
            if (err) {
              console.error('Error getting schema:', err);
            } else {
              schemaRows.forEach(row => {
                console.log(`${row.name}: ${row.type} (nullable: ${!row.notnull})`);
              });
              
              // Check categories data
              console.log('\n=== Categories Data ===');
              db.all("SELECT * FROM categories", (err, dataRows) => {
                if (err) {
                  console.error('Error querying data:', err);
                } else {
                  console.log(`Found ${dataRows.length} categories:`);
                  dataRows.forEach(row => {
                    console.log(`ID: ${row.id}, Name: ${row.name}, Image: ${row.image || row.image_url || 'NULL'}`);
                  });
                }
                
                db.close();
              });
            }
          });
        } else {
          console.log('Categories table not found');
          db.close();
        }
      }
    });
  });
});
