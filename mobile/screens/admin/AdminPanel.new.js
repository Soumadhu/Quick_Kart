import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Platform, 
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Icons from '@expo/vector-icons';

const menuItems = [
  { 
    title: 'Dashboard', 
    screen: 'AdminDashboard',
    icon: 'speedometer',
    iconSet: 'Ionicons'
  },
  { 
    title: 'Home Content', 
    screen: 'HomeContentManager',
    icon: 'home',
    iconSet: 'Ionicons'
  },
  { 
    title: 'Products', 
    screen: 'AdminProducts',
    icon: 'shopping-bag',
    iconSet: 'Ionicons'
  },
  { 
    title: 'Categories', 
    screen: 'AdminCategories',
    icon: 'grid',
    iconSet: 'Ionicons'
  },
  { 
    title: 'Orders', 
    screen: 'AdminOrders',
    icon: 'cart',
    iconSet: 'Ionicons'
  },
  { 
    title: 'Users', 
    screen: 'AdminUsers',
    icon: 'people',
    iconSet: 'Ionicons'
  },
  { 
    title: 'Settings', 
    screen: 'AdminSettings',
    icon: 'settings',
    iconSet: 'Ionicons'
  },
];

const IconComponent = ({ iconSet, name, ...props }) => {
  const Icon = Icons[iconSet] || Icons.Ionicons;
  return <Icon name={name} {...props} />;
};

export default function AdminPanel() {
  const navigation = useNavigation();

  useEffect(() => {
    console.log('AdminPanel mounted');
    console.log('Navigation object:', navigation);
    console.log('Menu items:', menuItems);
    return () => console.log('AdminPanel unmounted');
  }, [navigation]);

  const handleMenuItemPress = (screen) => {
    console.log(`Navigating to: ${screen}`);
    if (navigation && navigation.navigate) {
      navigation.navigate(screen);
    } else {
      Alert.alert('Error', 'Navigation not available');
      console.error('Navigation not available');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        <Text style={styles.header}>Admin Panel</Text>
        <Text style={styles.subHeader}>Quick Kart Administration</Text>
        
        <ScrollView 
          style={styles.menuContainer}
          contentContainerStyle={styles.menuContentContainer}
        >
          {menuItems.map((item, index) => {
            const Icon = Icons[item.iconSet] || Icons.Ionicons;
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Icon 
                    name={item.icon}
                    size={24}
                    color="#3498db"
                  />
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
                <Icons.Ionicons 
                  name="chevron-forward"
                  size={20}
                  color="#95a5a6"
                  style={styles.arrowIcon}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'web' ? 40 : 20,
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
    color: '#2c3e50',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  menuContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  menuContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  debugInfo: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});
