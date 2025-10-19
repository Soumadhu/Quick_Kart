import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Switch, 
  Alert, 
  Linking 
} from 'react-native';
import { users } from '../shared/mockData';

const UserProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState({
    ...users[0],
    notifications: true,
    darkMode: false,
  });
  const [editing, setEditing] = useState(false);
  const [tempUser, setTempUser] = useState({ ...user });

  // Mock payment methods
  const [paymentMethods] = useState([
    { id: '1', type: 'card', last4: '4242', brand: 'Visa' },
    { id: '2', type: 'upi', upiId: 'user@upi' },
  ]);

  // Mock transactions
  const [transactions] = useState([
    { id: '1', amount: 450, date: '2023-10-15', status: 'completed', orderId: 'ORD12345' },
    { id: '2', amount: 320, date: '2023-10-10', status: 'completed', orderId: 'ORD12344' },
  ]);

  const handleEditProfile = () => {
    setTempUser({ ...user });
    setEditing(true);
  };

  const handleSaveProfile = () => {
    setUser({ ...tempUser });
    setEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleInputChange = (field, value) => {
    setTempUser(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    // Clear token from storage
    // AsyncStorage.removeItem('userToken');
    Alert.alert('Logged Out', 'You have been successfully logged out.');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleAddPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'This would open payment method addition screen');
  };

  const openLink = async (url) => {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  };

  const renderProfileSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Profile</Text>
        {!editing ? (
          <TouchableOpacity onPress={handleEditProfile}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSaveProfile}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: user.photo || 'https://via.placeholder.com/100' }} 
          style={styles.avatar} 
        />
        {editing && (
          <TouchableOpacity style={styles.cameraIcon}>
            <Text>📷</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={tempUser.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
        ) : (
          <Text style={styles.infoText}>{user.name}</Text>
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={tempUser.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
          />
        ) : (
          <Text style={styles.infoText}>{user.email}</Text>
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={tempUser.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            keyboardType="phone-pad"
          />
        ) : (
          <Text style={styles.infoText}>{user.phone}</Text>
        )}
      </View>
    </View>
  );

  const renderWalletSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Wallet & Payments</Text>
      
      <View style={styles.walletBalance}>
        <Text style={styles.walletLabel}>Wallet Balance</Text>
        <Text style={styles.walletAmount}>₹1,250.00</Text>
      </View>
      
      <View style={styles.paymentMethods}>
        <View style={styles.sectionHeader}>
          <Text style={styles.subsectionTitle}>Payment Methods</Text>
          <TouchableOpacity onPress={handleAddPaymentMethod}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        
        {paymentMethods.map(method => (
          <View key={method.id} style={styles.paymentMethod}>
            <View style={styles.paymentIcon}>
              {method.type === 'card' ? '💳' : '📱'}
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentType}>
                {method.type === 'card' ? `•••• ${method.last4} (${method.brand})` : `UPI: ${method.upiId}`}
              </Text>
              <Text style={styles.paymentAction}>Edit</Text>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.transactions}>
        <Text style={styles.subsectionTitle}>Recent Transactions</Text>
        {transactions.map(tx => (
          <View key={tx.id} style={styles.transaction}>
            <View>
              <Text style={styles.transactionAmount}>₹{tx.amount}</Text>
              <Text style={styles.transactionDate}>{tx.date}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.transactionId}>#{tx.orderId}</Text>
              <Text style={[
                styles.transactionStatus,
                tx.status === 'completed' ? styles.statusCompleted : styles.statusPending
              ]}>
                {tx.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings & Help</Text>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Notifications</Text>
        <Switch
          value={user.notifications}
          onValueChange={(value) => setUser({...user, notifications: value})}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
        />
      </View>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Dark Mode</Text>
        <Switch
          value={user.darkMode}
          onValueChange={(value) => setUser({...user, darkMode: value})}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => openLink('https://example.com/faq')}
      >
        <Text style={styles.menuIcon}>❓</Text>
        <Text style={styles.menuText}>FAQ</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => openLink('mailto:support@quickkart.com')}
      >
        <Text style={styles.menuIcon}>📧</Text>
        <Text style={styles.menuText}>Contact Support</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => openLink('https://example.com/privacy')}
      >
        <Text style={styles.menuIcon}>🔒</Text>
        <Text style={styles.menuText}>Privacy Policy</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>App Version 1.0.0</Text>
      </View>
    </View>
  );

  const renderLogoutButton = () => (
    <TouchableOpacity 
      style={styles.logoutButton}
      onPress={handleLogout}
    >
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {renderProfileSection()}
      {renderWalletSection()}
      {renderSettingsSection()}
      {renderLogoutButton()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
  },
  editButton: {
    color: '#F8C400',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  walletBalance: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentMethods: {
    marginBottom: 20,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentIcon: {
    marginRight: 12,
    fontSize: 20,
  },
  paymentDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentType: {
    fontSize: 14,
    color: '#333',
  },
  paymentAction: {
    color: '#F8C400',
    fontWeight: '500',
  },
  transactions: {
    marginTop: 16,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
  },
  transactionId: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  statusPending: {
    backgroundColor: '#FFF8E1',
    color: '#FF8F00',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#999',
  },
  versionContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  versionText: {
    color: '#999',
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoutText: {
    color: '#ff4444',
    fontWeight: '600',
    fontSize: 16,
  },
  addButtonText: {
    color: '#F8C400',
    fontWeight: '600',
  },
});

export default UserProfileScreen;
