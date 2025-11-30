import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import riderService from '../../src/services/riderService';

const RiderRegistrationScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicle_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const theme = useTheme();
  const navigation = useNavigation();

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicle_number.trim()) {
      newErrors.vehicle_number = 'Vehicle number is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10-15 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { confirmPassword, ...riderData } = formData;
      const response = await riderService.registerRider(riderData);
      
      if (response) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully. Please login to continue.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('RiderLogin')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         'Registration failed. Please try again.';
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        Rider Registration
      </Text>

      <TextInput
        label="Full Name"
        value={formData.name}
        onChangeText={(text) => handleChange('name', text)}
        mode="outlined"
        style={styles.input}
        error={!!errors.name}
        left={<TextInput.Icon icon="account" />}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <TextInput
        label="Email"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        error={!!errors.email}
        left={<TextInput.Icon icon="email" />}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <TextInput
        label="Phone Number"
        value={formData.phone}
        onChangeText={(text) => handleChange('phone', text)}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
        error={!!errors.phone}
        left={<TextInput.Icon icon="phone" />}
      />
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      <TextInput
        label="Vehicle Number"
        value={formData.vehicle_number}
        onChangeText={(text) => handleChange('vehicle_number', text)}
        mode="outlined"
        style={styles.input}
        error={!!errors.vehicle_number}
        left={<TextInput.Icon icon="car" />}
      />
      {errors.vehicle_number && <Text style={styles.errorText}>{errors.vehicle_number}</Text>}

      <TextInput
        label="Password"
        value={formData.password}
        onChangeText={(text) => handleChange('password', text)}
        mode="outlined"
        secureTextEntry
        style={styles.input}
        error={!!errors.password}
        left={<TextInput.Icon icon="lock" />}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TextInput
        label="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(text) => handleChange('confirmPassword', text)}
        mode="outlined"
        secureTextEntry
        style={styles.input}
        error={!!errors.confirmPassword}
        left={<TextInput.Icon icon="lock-check" />}
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Create Account
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('RiderLogin')}
        style={styles.loginButton}
      >
        Already have an account? Login
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    marginTop: -4,
    marginLeft: 16,
    fontSize: 12,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  buttonContent: {
    height: 48,
  },
  loginButton: {
    marginTop: 16,
  },
});

export default RiderRegistrationScreen;