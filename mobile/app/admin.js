import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function AdminPanel() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <View style={styles.menu}>
        <Link href="/admin/users" style={styles.menuItem}>
          <Text>Manage Users</Text>
        </Link>
        <Link href="/admin/products" style={styles.menuItem}>
          <Text>Manage Products</Text>
        </Link>
        <Link href="/admin/orders" style={styles.menuItem}>
          <Text>View Orders</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menu: {
    gap: 15,
  },
  menuItem: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});
