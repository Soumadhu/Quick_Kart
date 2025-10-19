import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Linking,
  Platform,
  PermissionsAndroid,
  ActivityIndicator
} from 'react-native';

// Web-compatible map component
const WebMap = ({ children, style, ...props }) => (
  <View style={[styles.map, style]} {...props}>
    <View style={styles.webMapPlaceholder}>
      <Text>Map not available on web</Text>
      <Text style={{ fontSize: 12, marginTop: 5 }}>Please use the mobile app for full map functionality</Text>
    </View>
    {children}
  </View>
);

// Mock components for web
const MockMarker = ({ children, coordinate, ...props }) => (
  <View {...props}>{children}</View>
);

const MockPolyline = () => null;

// Set up the components based on platform
const MapView = Platform.OS === 'web' ? WebMap : require('react-native-maps').default;
const Marker = Platform.OS === 'web' ? MockMarker : require('react-native-maps').Marker;
const Polyline = Platform.OS === 'web' ? MockPolyline : require('react-native-maps').Polyline;
const PROVIDER_GOOGLE = Platform.OS === 'web' ? null : require('react-native-maps').PROVIDER_GOOGLE;

import Icon from 'react-native-vector-icons/MaterialIcons';

// Mock location for web
const useMockLocation = () => {
  const [location, setLocation] = useState({
    coords: {
      latitude: 20.5937,
      longitude: 78.9629,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  });
  return [location, () => {}];
};

// Use expo-location on native, mock on web
const useLocation = Platform.OS === 'web' 
  ? useMockLocation 
  : () => {
      const [location, setLocation] = useState(null);
      const [errorMsg, setErrorMsg] = useState(null);

      useEffect(() => {
        (async () => {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              setErrorMsg('Permission to access location was denied');
              return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setLocation(location);
          } catch (error) {
            setErrorMsg('Error getting location');
            console.error(error);
          }
        })();
      }, []);

      return [location, errorMsg];
    };

const RiderMapViewScreen = () => {
  const [location, errorMsg] = useLocation();
  const [order, setOrder] = useState({
    id: '1',
    pickup: {
      name: 'Restaurant Name',
      address: '123 Food Street, City',
      latitude: 20.5945,
      longitude: 78.9629,
    },
    delivery: {
      name: 'Customer Name',
      address: '456 Customer Ave, City',
      latitude: 20.5950,
      longitude: 78.9729,
    },
    status: 'picking_up',
  });

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{
            latitude: order.pickup.latitude,
            longitude: order.pickup.longitude,
          }}
          title="Pickup Location"
          description={order.pickup.address}
        >
          <View style={styles.markerContainer}>
            <View style={styles.pickupMarker}>
              <Icon name="restaurant" size={20} color="#fff" />
            </View>
          </View>
        </Marker>

        <Marker
          coordinate={{
            latitude: order.delivery.latitude,
            longitude: order.delivery.longitude,
          }}
          title="Delivery Location"
          description={order.delivery.address}
        >
          <View style={styles.markerContainer}>
            <View style={styles.deliveryMarker}>
              <Icon name="delivery-dining" size={20} color="#fff" />
            </View>
          </View>
        </Marker>
      </MapView>

      <View style={styles.orderCard}>
        <Text style={styles.orderId}>Order #{order.id}</Text>
        <Text style={styles.statusText}>
          Status: {order.status.replace('_', ' ')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  orderCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  markerContainer: {
    alignItems: 'center',
  },
  pickupMarker: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
  },
  deliveryMarker: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default RiderMapViewScreen;
