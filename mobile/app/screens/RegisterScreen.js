import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const { register, isLoading } = useAuth();

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    const { firstName, lastName, email, phone, password, confirmPassword } = formData;
    
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const result = await register({
      firstName,
      lastName,
      email,
      phone,
      password
    });

    if (result.success) {
      // Navigation handled by AuthProvider
    } else {
      Alert.alert('Registration Failed', result.error || 'An error occurred');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          
          <View style={styles.nameContainer}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="Last Name"
              value={formData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              autoCapitalize="words"
            />
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phone}
            onChangeText={(text) => handleChange('phone', text)}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Login here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    width: '48%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#F8C400',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  link: {
    color: '#F8C400',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
