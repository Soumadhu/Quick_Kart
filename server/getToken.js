const axios = require('axios');
const readline = require('readline');
const https = require('https');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get server URL from environment or use default
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Create axios instance that doesn't reject on HTTP error status codes
const api = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false // Only for development!
  })
});

async function getToken() {
  try {
    // Get credentials from user
    const email = await askQuestion('Enter your email: ');
    const password = await askQuestion('Enter your password: ', true);
    
    console.log('\nAttempting to log in...');
    
    console.log(`\nSending request to: ${API_BASE_URL}/api/auth/login`);
    
    // Make login request
    const response = await api.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.token) {
      console.log('\n✅ Login successful!');
      console.log('\nYour authentication token:');
      console.log('------------------------');
      console.log(response.data.token);
      console.log('------------------------');
      
      // Also show how to use it in a request
      console.log('\nExample usage with curl:');
      console.log(`curl -H "Authorization: Bearer ${response.data.token}" ${API_BASE_URL}/users/me`);
    } else {
      console.error('\n❌ No token received in response');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.error('\n❌ Error getting token:');
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Error:', error.message);
    }
  } finally {
    rl.close();
  }
}

function askQuestion(question, isPassword = false) {
  return new Promise((resolve) => {
    if (isPassword) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const { stdin } = process;
      const handler = (char) => {
        char = char + '';
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            stdin.removeListener('data', handler);
            break;
          default:
            process.stdout.clearLine();
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(question + Array(rl.line.length + 1).join('*'));
            break;
        }
      };
      
      process.stdin.on('data', handler);
      rl.question(question, (value) => {
        rl.history = rl.history.slice(1);
        resolve(value);
      });
    } else {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    }
  });
}

// Run the function
getToken().catch(console.error);
