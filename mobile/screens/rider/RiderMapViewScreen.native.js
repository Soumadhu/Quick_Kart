import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking,
  Platform,
  PermissionsAndroid,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Location from 'expo-location';

const DEFAULT_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MOCK_ORDER = {
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
};

const RiderMapViewScreen = () => {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [order] = useState(MOCK_ORDER);
  const [region, setRegion] = useState(DEFAULT_REGION);

  // Request location permission and get current location
  useEffect(() => {
    let isMounted = true;
    let locationSubscription;

    const getLocation = async () => {
      try {
        setIsLoading(true);
        
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            if (isMounted) setErrorMsg('Location permission denied');
            return;
          }
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setErrorMsg('Permission to access location was denied');
          return;
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (isMounted) {
          setLocation(location.coords);
          setRegion({
            ...region,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setErrorMsg(null);
        }

        // Watch for location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
          },
          (newLocation) => {
            if (isMounted) {
              setLocation(newLocation.coords);
            }
          }
        );
      } catch (error) {
        console.error('Error getting location:', error);
        if (isMounted) {
          setErrorMsg('Error getting location: ' + error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getLocation();

    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const fitToCoordinates = () => {
    try {
      if (!mapRef.current || !order?.pickup || !order?.delivery) return;

      const locations = [
        {
          latitude: order.pickup.latitude,
          longitude: order.pickup.longitude,
        },
        {
          latitude: order.delivery.latitude,
          longitude: order.delivery.longitude,
        },
      ];

      if (location) {
        locations.push({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }

      mapRef.current.fitToCoordinates(locations, {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    } catch (error) {
      console.error('Error fitting coordinates:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => getLocation()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onMapReady={fitToCoordinates}
        onLayout={fitToCoordinates}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
        showsCompass={true}
        rotateEnabled={true}
        zoomEnabled={true}
        scrollEnabled={true}
        loadingEnabled={true}
        loadingIndicatorColor="#3b82f6"
        loadingBackgroundColor="#ffffff"
      >
        {order?.pickup && (
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
        )}

        {order?.delivery && (
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
        )}
      </MapView>

      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <View style={[
            styles.statusBadge,
            order.status === 'completed' ? styles.completedBadge : 
            order.status === 'delivering' ? styles.deliveringBadge : styles.pickingUpBadge
          ]}>
            <Text style={styles.statusText}>
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={[styles.locationDot, styles.pickupDot]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Pickup</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {order.pickup?.address || 'Loading...'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.locationContainer}>
          <View style={[styles.locationDot, styles.deliveryDot]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Delivery</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {order.delivery?.address || 'Loading...'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => {
            const target = order.status === 'delivering' ? order.delivery : order.pickup;
            if (target?.latitude && target?.longitude) {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}&travelmode=driving`;
              Linking.openURL(url);
            }
          }}
        >
          <Icon name="directions" size={20} color="#fff" />
          <Text style={styles.navigateButtonText}>
            {order.status === 'delivering' ? 'Navigate to Delivery' : 'Navigate to Pickup'}
          </Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  orderCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pickingUpBadge: {
    backgroundColor: '#f59e0b',
  },
  deliveringBadge: {
    backgroundColor: '#3b82f6',
  },
  completedBadge: {
    backgroundColor: '#10b981',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  pickupDot: {
    backgroundColor: '#4CAF50',
  },
  deliveryDot: {
    backgroundColor: '#2196F3',
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  navigateButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  navigateButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupMarker: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryMarker: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RiderMapViewScreen;
