require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  env,
  port: process.env.PORT || 5000,
  // Add other common configurations here
};

const envConfig = {
  development: {
    // Development-specific configurations
  },
  production: {
    // Production-specific configurations
  },
  test: {
    // Test-specific configurations
    port: 5001
  }
};

// Merge base config with environment-specific config
const config = {
  ...baseConfig,
  ...(envConfig[env] || {})
};

// Export specific values for easier access
module.exports = {
  ...config,
  port: config.port
};
