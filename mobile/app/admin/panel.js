import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
  { 
    title: 'Home Content', 
    path: '/admin/HomeContentManager',
    icon: 'home'
  },
  { 
    title: 'Products', 
    path: '/admin/AdminProducts',
    icon: 'shopping-bag'
  },
  { 
    title: 'Categories', 
    path: '/admin/AdminCategories',
    icon: 'grid'
  },
  { 
    title: 'Orders', 
    path: '/admin/AdminOrders',
    icon: 'cart'
  },
  { 
    title: 'Users', 
    path: '/admin/AdminUsers',
    icon: 'people'
  },
  { 
    title: 'Settings', 
    path: '/admin/AdminSettings',
    icon: 'settings'
  },
];

export default function AdminPanel() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Panel</Text>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            href={item.path}
            style={styles.menuItem}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={item.icon} 
                size={24} 
                color="#3498db" 
              />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color="#95a5a6" 
              style={styles.arrowIcon}
            />
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2c3e50',
    textAlign: 'center',
  },
  menuContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  arrowIcon: {
    marginLeft: 10,
  },
});
