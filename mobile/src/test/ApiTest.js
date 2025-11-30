import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import api from '../services/apiConfig';

const ApiTest = () => {
  const [status, setStatus] = useState('Testing connection...');
  const [serverInfo, setServerInfo] = useState(null);

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');
      
      // Test direct API call
      const response = await api.get('/health');
      
      if (response.data) {
        setStatus('✅ Connection successful!');
        setServerInfo(response.data);
      } else {
        setStatus('❌ Unexpected response format');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setStatus(`❌ Connection failed: ${error.message}`);
      
      // Log detailed error information
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      <Text style={styles.status}>{status}</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Current Configuration:</Text>
        <Text>Base URL: {api.defaults.baseURL || 'Not set'}</Text>
        <Text>Timeout: {api.defaults.timeout}ms</Text>
      </View>

      {serverInfo && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Server Info:</Text>
          <Text>{JSON.stringify(serverInfo, null, 2)}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Test Again" onPress={testConnection} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 10,
  },
});

export default ApiTest;
