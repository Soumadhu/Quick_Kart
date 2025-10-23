import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AdminPanel() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>1,234</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>567</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>89%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <View style={styles.actionButton}>
              <Text>Manage Users</Text>
            </View>
            <View style={styles.actionButton}>
              <Text>View Orders</Text>
            </View>
            <View style={styles.actionButton}>
              <Text>Analytics</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2c3e50',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '30%',
    backgroundColor: '#f1f3f6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
});
