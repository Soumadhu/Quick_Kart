import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RoleSelectionScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to Quick Kart</Text>
        <Text style={styles.subtitle}>Please select your role to continue</Text>
      </View>

      <View style={styles.roleContainer}>
        {/* Customer Card */}
        <TouchableOpacity 
          style={[styles.roleCard, styles.customerCard]}
          onPress={() => {
            // Navigate to HomeTabs which contains BlinkitHomeScreen as the home tab
            navigation.navigate('HomeTabs');
          }}
        >
          <View style={styles.roleIconContainer}>
            <Icon name="person" size={40} color="#1976D2" />
          </View>
          <Text style={styles.roleTitle}>I'm a Customer</Text>
          <Text style={styles.roleDescription}>
            Shop for groceries, electronics, fashion, and more
          </Text>
          <View style={styles.arrowContainer}>
            <Icon name="arrow-forward" size={24} color="#1976D2" />
          </View>
        </TouchableOpacity>

        {/* Rider Card */}
        <TouchableOpacity 
          style={[styles.roleCard, styles.riderCard]}
          onPress={() => navigation.navigate('RiderLogin')}
        >
          <View style={[styles.roleIconContainer, { backgroundColor: '#FFF3E0' }]}>
            <Icon name="delivery-dining" size={40} color="#F57C00" />
          </View>
          <Text style={styles.roleTitle}>I'm a Delivery Rider</Text>
          <Text style={styles.roleDescription}>
            Deliver orders and earn money on your schedule
          </Text>
          <View style={styles.arrowContainer}>
            <Icon name="arrow-forward" size={24} color="#F57C00" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Quick Kart - Making Shopping and Delivery Simple</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  roleContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  customerCard: {
    borderTopWidth: 4,
    borderTopColor: '#1976D2',
  },
  riderCard: {
    borderTopWidth: 4,
    borderTopColor: '#F57C00',
  },
  roleIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default RoleSelectionScreen;
