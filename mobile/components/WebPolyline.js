import React, { useEffect, useRef } from 'react';

const WebPolyline = ({ path, map, color = '#4285F4', strokeWeight = 3, strokeOpacity = 0.8 }) => {
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!window.google || !map || !path || path.length < 2) return;

    // Create polyline
    const polyline = new window.google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: strokeOpacity,
      strokeWeight: strokeWeight,
      map: map
    });

    polylineRef.current = polyline;

    // Cleanup
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, path, color, strokeWeight, strokeOpacity]);

  return null;
};

export default WebPolyline;
