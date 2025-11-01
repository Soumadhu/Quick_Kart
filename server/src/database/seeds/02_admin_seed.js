const bcrypt = require('bcryptjs');
const saltRounds = 10;

// Note: In a production environment, use environment variables for admin credentials
const defaultPassword = 'admin@123'; // Should be changed after first login

// Hash the password
const hashedPassword = bcrypt.hashSync(defaultPassword, saltRounds);

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('admins').del();

  // Inserts seed entries
  return knex('admins').insert([
    {
      name: 'Super Admin',
      email: 'admin@quickkart.com',
      password_hash: hashedPassword,
      role: 'super_admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Content Manager',
      email: 'content@quickkart.com',
      password_hash: hashedPassword,
      role: 'content_manager',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
