const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/quickkart.sqlite3');
const db = new sqlite3.Database(dbPath);

console.log('Checking riders table schema...');

db.all("PRAGMA table_info(riders)", [], (err, columns) => {
  if (err) {
    console.error('Error accessing riders table:', err.message);
    db.close();
    return;
  }
  
  console.log('Riders table columns:');
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  db.close();
});
