import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Icons from '@expo/vector-icons';
import { DataTable } from 'react-native-paper';
import apiClient from '../../src/services/apiConfig';

const AdminRiders = () => {
  const navigation = useNavigation();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('riders');
      
      // Transform the data to match the expected format
      const ridersData = response.data.map(rider => ({
        id: rider.id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        status: rider.status || (rider.is_active ? 'active' : 'inactive'),
        vehicle_number: rider.vehicle_number || 'N/A',
        created_at: rider.created_at,
        orders: 0 // Initialize orders count, can be updated later if needed
      }));
      
      setRiders(ridersData);
    } catch (error) {
      console.error('Error fetching riders:', error);
      Alert.alert('Error', 'Failed to load riders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRiders();
  };

  const filteredRiders = riders.filter(rider =>
    rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rider.phone.includes(searchQuery)
  );

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredRiders.length);
  const paginatedRiders = filteredRiders.slice(from, to);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#e3f9e5', color: '#1b5e20' };
      case 'inactive':
        return { backgroundColor: '#ffebee', color: '#c62828' };
      case 'on-delivery':
        return { backgroundColor: '#fff3e0', color: '#e65100' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#424242' };
    }
  };

  const handleRiderPress = (rider) => {
    // Navigate to rider details screen
    // navigation.navigate('RiderDetails', { riderId: rider.id });
    Alert.alert('Rider Selected', `You selected ${rider.name}`);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading riders...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Riders Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Add Rider', 'Add new rider functionality will be implemented here')}
        >
          <Icons.Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Rider</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icons.Ionicons name="search" size={20} color="#95a5a6" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search riders by name or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#95a5a6"
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{riders.length}</Text>
          <Text style={styles.statLabel}>Total Riders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {riders.filter(rider => rider.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {riders.reduce((sum, rider) => sum + (rider.orders || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Deliveries</Text>
        </View>
      </View>

      <View style={styles.tableContainer}>
        <DataTable>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title style={styles.columnHeader}>
              <Text style={styles.columnHeaderText}>Rider</Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.columnHeader, { flex: 2 }]}>
              <Text style={styles.columnHeaderText}>Contact</Text>
            </DataTable.Title>
            <DataTable.Title numeric style={styles.columnHeader}>
              <Text style={styles.columnHeaderText}>Status</Text>
            </DataTable.Title>
            <DataTable.Title numeric style={styles.columnHeader}>
              <Text style={styles.columnHeaderText}>Actions</Text>
            </DataTable.Title>
          </DataTable.Header>

          {paginatedRiders.length > 0 ? (
            paginatedRiders.map((rider) => (
              <DataTable.Row 
                key={rider.id} 
                style={styles.tableRow}
                onPress={() => handleRiderPress(rider)}
              >
                <DataTable.Cell style={{ flex: 2 }}>
                  <Text style={styles.cellText} numberOfLines={1}>
                    {rider.name}
                  </Text>
                  <Text style={[styles.cellText, { fontSize: 12, color: '#7f8c8d' }]} numberOfLines={1}>
                    {rider.email}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 2 }}>
                  <Text style={styles.cellText} numberOfLines={1}>
                    {rider.phone}
                  </Text>
                  <Text style={[styles.cellText, { fontSize: 12, color: '#7f8c8d' }]} numberOfLines={1}>
                    {rider.vehicle_number}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <View 
                    style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColor(rider.status).backgroundColor }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.statusText, 
                        { color: getStatusColor(rider.status).color }
                      ]}
                    >
                      {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
                    </Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => Alert.alert('Edit', `Edit ${rider.name}`)}
                    >
                      <Icons.Ionicons name="create-outline" size={18} color="#3498db" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { marginLeft: 10 }]}
                      onPress={() => Alert.alert('Delete', `Delete ${rider.name}?`)}
                    >
                      <Icons.Ionicons name="trash-outline" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Icons.Ionicons name="bicycle" size={50} color="#bdc3c7" />
              <Text style={styles.noDataText}>No riders found</Text>
              <Text style={styles.noDataSubText}>
                {searchQuery ? 'Try a different search term' : 'Add a new rider to get started'}
              </Text>
            </View>
          )}

          {filteredRiders.length > itemsPerPage && (
            <DataTable.Pagination
              page={page}
              numberOfPages={Math.ceil(filteredRiders.length / itemsPerPage)}
              onPageChange={(page) => setPage(page)}
              label={`${from + 1}-${to} of ${filteredRiders.length}`}
              showFastPaginationControls
              numberOfItemsPerPage={itemsPerPage}
              selectPageDropdownLabel={'Rows per page'}
              style={styles.pagination}
            />
          )}
        </DataTable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#2c3e50',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tableHeader: {
    backgroundColor: '#f5f6fa',
    height: 56,
  },
  columnHeader: {
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
  columnHeaderText: {
    color: '#7f8c8d',
    fontWeight: '600',
    fontSize: 14,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    minHeight: 64,
  },
  cellText: {
    color: '#2c3e50',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  noDataContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  pagination: {
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
});

export default AdminRiders;
