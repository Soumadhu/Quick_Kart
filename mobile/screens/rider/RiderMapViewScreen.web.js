import * as React from 'react';
const { useState, useEffect, useRef } = React;
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const MapIframe = ({ center, pickup, delivery, currentLocation }) => {
  // Use current location if available, otherwise use pickup location
  const currentPos = currentLocation || { 
    latitude: pickup.latitude, 
    longitude: pickup.longitude 
  };

  // Create bounds that include all points (current location, pickup, and delivery)
  const allPoints = [
    [pickup.latitude, pickup.longitude],
    [delivery.latitude, delivery.longitude]
  ];

  // Add current location to bounds if available
  if (currentLocation) {
    allPoints.push([currentLocation.lat, currentLocation.lng]);
  }

  // Calculate bounds
  const lats = allPoints.map(p => p[0]);
  const lngs = allPoints.map(p => p[1]);
  
  const bounds = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ];

  // Calculate center
  const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
  const centerLng = (bounds[0][1] + bounds[1][1]) / 2;

  // Add some padding to the bounds
  const padding = 0.01;
  const paddedBounds = [
    [bounds[0][0] - padding, bounds[0][1] - padding],
    [bounds[1][0] + padding, bounds[1][1] + padding]
  ];

  // Build the map URL with all markers
  const markers = [
    `marker=${pickup.latitude},${pickup.longitude}`,
    `marker=${delivery.latitude},${delivery.longitude}`
  ];

  // Add current location marker if available
  if (currentLocation) {
    markers.push(`marker=${currentLocation.lat},${currentLocation.lng}`);
  }
  
  const bboxStr = `${paddedBounds[0][1]},${paddedBounds[0][0]},${paddedBounds[1][1]},${paddedBounds[1][0]}`;
  const markersStr = markers.join('&');
  
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bboxStr}&layer=mapnik&${markersStr}`;
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      transformOrigin: 'center center',
      overflow: 'hidden'
    }}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        title="Delivery Route"
        style={{
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

const RiderMapViewScreen = () => {
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const webViewRef = useRef(null);
  
  // Use Kolkata coordinates as default pickup location
  const [order] = useState({
    id: '1',
    status: 'picking_up',
    pickup: {
      name: 'Restaurant Name',
      address: '123 Food Street, Kolkata',
      latitude: 22.5726,  // Kolkata coordinates
      longitude: 88.3639,
    },
    delivery: {
      name: 'Customer Name',
      address: '456 Customer Ave, Kolkata',
      latitude: 22.5826,  // Nearby Kolkata coordinates
      longitude: 88.3739,
    },
    customerPhone: '+919876543210' // Added customer phone
  });

  // Function to get current position
  const getCurrentPosition = () => {
    setLoading(true);
    setLocationError(null);
    
    const options = {
      enableHighAccuracy: true,  // Request high accuracy
      timeout: 10000,           // 10 seconds timeout
      maximumAge: 0             // Force fresh location
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Got position:', position.coords);
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to retrieve your location. Please ensure location services are enabled.');
          setLoading(false);
        },
        options
      );

      // Setup location watcher for continuous updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          console.log('Position updated:', position.coords);
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Error watching position:', error);
          setLocationError('Error updating location. ' + error.message);
        },
        options
      );

      // Cleanup watcher on unmount
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  };

  // Initial location fetch
  useEffect(() => {
    getCurrentPosition();
  }, []);

  // Request location permission and update
  const handleRefreshLocation = () => {
    getCurrentPosition();
  };

  const handleNavigate = (destination) => {
    const { latitude, longitude } = destination;
    const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${location.lat}%2C${location.lng}%3B${latitude}%2C${longitude}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  // Web-compatible container
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      position: 'relative',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Map Container */}
      <div style={{
        flex: 1,
        position: 'relative',
        width: '100%',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            backgroundColor: '#f5f5f5'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '10px'
            }} />
            <p style={{ color: '#666', margin: 0 }}>Loading map...</p>
          </div>
        ) : (
          <MapIframe 
            center={location || { 
              lat: order.pickup.latitude, 
              lng: order.pickup.longitude 
            }}
            pickup={order.pickup}
            delivery={order.delivery}
            currentLocation={location}
          />
        )}
      </div>

      {/* Order Card */}
      <div style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        padding: '20px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Order Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0 }}>Order #{order.id}</h3>
          <div style={{
            padding: '5px 10px',
            borderRadius: '15px',
            backgroundColor: order.status === 'completed' ? '#4CAF50' :
                           order.status === 'delivering' ? '#2196F3' : '#FFC107',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'capitalize'
          }}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
          </div>
        </div>

        {/* Location Info */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '10px',
              flexShrink: 0
            }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>P</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                margin: 0, 
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {order.pickup.name || 'Pickup Location'}
              </p>
              <p style={{ 
                margin: '2px 0 0 0', 
                color: '#666', 
                fontSize: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {order.pickup.address}
              </p>
            </div>
            <button 
              onClick={() => {
                // Handle navigation to pickup location
                const url = `https://www.google.com/maps/dir/?api=1&destination=${order.pickup.latitude},${order.pickup.longitude}`;
                window.open(url, '_blank');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#2196F3',
                cursor: 'pointer',
                padding: '5px',
                marginLeft: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#2196F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '10px',
              flexShrink: 0
            }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>D</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                margin: 0, 
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {order.delivery.name || 'Delivery Location'}
              </p>
              <p style={{ 
                margin: '2px 0 0 0', 
                color: '#666', 
                fontSize: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {order.delivery.address}
              </p>
            </div>
            <button 
              onClick={() => {
                // Handle navigation to delivery location
                const url = `https://www.google.com/maps/dir/?api=1&destination=${order.delivery.latitude},${order.delivery.longitude}`;
                window.open(url, '_blank');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#2196F3',
                cursor: 'pointer',
                padding: '5px',
                marginLeft: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '20px',
          gap: '10px'
        }}>
          <button 
            onClick={() => {
              // Handle call customer
              window.location.href = `tel:${order.customerPhone || '+1234567890'}`;
            }}
            style={{
              flex: 1,
              backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eaeaea'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Call Customer
          </button>
          <button 
            onClick={() => {
              // Handle action based on status
              if (order.status === 'picking_up') {
                // Update status to delivering
                alert('Starting delivery...');
              } else if (order.status === 'delivering') {
                // Complete delivery
                alert('Completing delivery...');
              } else {
                // View details
                alert('Showing order details...');
              }
            }}
            style={{
              flex: 1,
              backgroundColor: order.status === 'delivering' ? '#2196F3' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            {order.status === 'picking_up' ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Start Delivery
              </>
            ) : order.status === 'delivering' ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Complete Delivery
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                View Details
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
    marginBottom: 200, // Space for the order card
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  orderCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    height: 200,
    justifyContent: 'space-between',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  pickingUpBadge: {
    backgroundColor: '#FFE0B2',
  },
  deliveringBadge: {
    backgroundColor: '#BBDEFB',
  },
  completedBadge: {
    backgroundColor: '#C8E6C9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 10,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickupDot: {
    backgroundColor: '#4CAF50',
  },
  deliveryDot: {
    backgroundColor: '#2196F3',
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  navButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  navButtonActiveText: {
    color: '#fff',
  },
});

export default RiderMapViewScreen;