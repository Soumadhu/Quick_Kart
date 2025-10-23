const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
  try {
    // Test registration
    console.log('Testing registration...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '1234567890'
    });
    console.log('Registration successful:', registerResponse.data);

    // Test login
    console.log('\nTesting login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Login successful:', {
      user: loginResponse.data.email,
      token: loginResponse.data.token ? 'Token received' : 'No token'
    });

    // Test protected route
    console.log('\nTesting protected route...');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        'x-auth-token': loginResponse.data.token
      }
    });
    console.log('Profile data:', profileResponse.data);

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAuth();
