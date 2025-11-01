require('dotenv').config();

module.exports = {
  development: {
    client: 'sqlite3', 
    connection: {
      filename: './data/quickkart.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  }
};
