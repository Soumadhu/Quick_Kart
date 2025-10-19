import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const OpenStreetMap = ({ 
  center = { lat: 20.5937, lng: 78.9629 }, // Default to India center
  zoom = 14,
  markers = [],
  style,
  onLoad
}) => {
  const webViewRef = useRef(null);

  // Generate the HTML content for the map
  const generateMapHTML = () => {
    const markerScripts = markers.map((marker, index) => {
      const icon = marker.type === 'pickup' ? 
        `L.divIcon({html: '<div style="background: #4CAF50; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);">P</div>', className: ''})` :
        `L.divIcon({html: '<div style="background: #2196F3; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);">D</div>', className: ''})`;

      return `
        var marker${index} = L.marker([${marker.position.lat}, ${marker.position.lng}], {
          icon: ${icon}
        }).addTo(map);
        
        ${marker.popup ? `marker${index}.bindPopup(\`${marker.popup}\`);` : ''}
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OpenStreetMap</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          #map {
            width: 100%;
            height: 100%;
          }
          .leaflet-tile-pane {
            filter: grayscale(100%) !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // Initialize the map
            var map = L.map('map', {
              zoomControl: false,
              tap: false
            }).setView([${center.lat}, ${center.lng}], ${zoom});

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              tap: false
            }).addTo(map);

            // Add markers
            ${markerScripts}

            // Notify parent that map is loaded
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_loaded' }));
            }

            // Fit bounds if there are multiple markers
            if (${markers.length} > 1) {
              var bounds = L.latLngBounds(
                ${JSON.stringify(markers.map(m => [m.position.lat, m.position.lng]))}
              );
              map.fitBounds(bounds.pad(0.2));
            }
          });
        </script>
      </body>
      </html>
    `;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'map_loaded' && onLoad) {
        onLoad();
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onMessage={handleMessage}
        originWhitelist={['*']}
        mixedContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default OpenStreetMap;
