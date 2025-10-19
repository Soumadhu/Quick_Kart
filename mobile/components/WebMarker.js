import React, { useEffect, useRef } from 'react';

const WebMarker = ({ position, map, label, color = '#4285F4', icon }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!window.google || !map || !position) return;

    // Create marker
    const marker = new window.google.maps.Marker({
      position: position,
      map: map,
      label: label ? {
        text: label,
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '12px',
      } : null,
      icon: icon || {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#fff',
        scale: 10,
        labelOrigin: new window.google.maps.Point(0, 0)
      },
      optimized: true
    });

    markerRef.current = marker;

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, position, label, color, icon]);

  return null;
};

export default WebMarker;
