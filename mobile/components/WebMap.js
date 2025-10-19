import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WebMap = ({ center, zoom = 14, style, onLoad, children }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef([]);

  // Initialize the map when the component mounts
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    // Create a new map instance
    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstance.current = map;
    if (onLoad) onLoad(map);

    // Cleanup
    return () => {
      // Clear all markers when unmounting
      markers.current.forEach(marker => marker.setMap(null));
      markers.current = [];
    };
  }, []);

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapInstance.current && center) {
      mapInstance.current.setCenter(center);
      if (zoom) mapInstance.current.setZoom(zoom);
    }
  }, [center, zoom]);

  // Render children with map instance
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        map: mapInstance.current,
        addMarker: (marker) => {
          markers.current.push(marker);
        }
      });
    }
    return child;
  });

  return (
    <View style={[styles.container, style]}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {childrenWithProps}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default WebMap;
