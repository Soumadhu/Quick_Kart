import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import riderService from '../../src/services/riderService';

const RiderLoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      // Authenticate using rider service
      const riderData = await riderService.loginRider({ email, password });
      
      if (riderData && riderData.token) {
        // Store rider token and user data
        await AsyncStorage.setItem('riderToken', riderData.token);
        await AsyncStorage.setItem('riderData', JSON.stringify({
          id: riderData.id,
          email: riderData.email,
          name: riderData.name,
          phone: riderData.phone
        }));
        
        // Navigate to rider dashboard
        navigation.replace('RiderTabs');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'An error occurred during login. Please try again.';
      
      if (error.response) {
        // Server responded with an error status code
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      'Invalid email or password';
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message) {
        // Error message from the service
        errorMessage = error.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Rider Login</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Icon 
              name={showPassword ? 'visibility-off' : 'visibility'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, (!email || !password || isLoading) && styles.disabledButton]}
          onPress={handleLogin}
          disabled={!email || !password || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signUpButton}
          onPress={() => navigation.navigate('RiderRegistration')}
        >
          <Text style={styles.signUpButtonText}>Create New Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Not a rider? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
          <Text style={styles.footerLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#0066cc',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#45a049',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#666',
  },
  footerLink: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
});

export default RiderLoginScreen;
