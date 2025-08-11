import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
// Fix marker icon paths under Vite
// @ts-ignore
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface MapMarker {
    position: [number, number];
    title?: string;
    description?: string;
    radiusMeters?: number;
}

interface LeafletMapProps {
    center?: [number, number];
    zoom?: number;
    className?: string;
    style?: React.CSSProperties;
    markers?: MapMarker[];
    showLines?: boolean;
    showCoverage?: boolean;
    defaultRadiusMeters?: number;
    onDistanceChange?: (distance: number) => void;
    resetLinesTrigger?: number;
    featureType?: 'polyline' | 'polygon';
}

const LeafletMap = forwardRef<any, LeafletMapProps>(({
    center = [0, 0],
    zoom = 13,
    className = '',
    style = {},
    markers = [],
    showLines = false,
    showCoverage = false,
    defaultRadiusMeters = 500,
    onDistanceChange,
    resetLinesTrigger,
    featureType = 'polyline',
}, ref) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const coverageLayerRef = useRef<L.LayerGroup | null>(null);
    const measureLayerRef = useRef<L.LayerGroup | null>(null);
    const markerInstancesRef = useRef<L.Marker[]>([]);
    const selectedPointsRef = useRef<L.LatLng[]>([]);
    const measurePolylineRef = useRef<L.Polyline | null>(null);
    const measurePolygonRef = useRef<L.Polygon | null>(null);
    const distanceLabelRef = useRef<L.Marker | null>(null);
    const isInitializedRef = useRef<boolean>(false);

    // Initialize map only once on mount
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Ensure default icon URLs work when bundling
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: markerIcon2xUrl,
            iconUrl: markerIconUrl,
            shadowUrl: markerShadowUrl,
        });

        const map = L.map(mapRef.current);
        map.setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // Create layers in correct order so measurement sits above tiles but below markers
        coverageLayerRef.current = L.layerGroup().addTo(map);
        measureLayerRef.current = L.layerGroup().addTo(map);
        markersLayerRef.current = L.layerGroup().addTo(map);

        isInitializedRef.current = true;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            if (markersLayerRef.current) {
                markersLayerRef.current.clearLayers();
                markersLayerRef.current = null;
            }
            if (coverageLayerRef.current) {
                coverageLayerRef.current.clearLayers();
                coverageLayerRef.current = null;
            }
            if (measureLayerRef.current) {
                measureLayerRef.current.clearLayers();
                measureLayerRef.current = null;
            }
            isInitializedRef.current = false;
        };
    }, []);

    // Update view if center/zoom props change meaningfully
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const current = map.getCenter();
        const [lat, lng] = center;
        const zoomChanged = map.getZoom() !== zoom;
        const centerChanged = Math.abs(current.lat - lat) > 1e-9 || Math.abs(current.lng - lng) > 1e-9;
        if (centerChanged || zoomChanged) {
            map.setView([lat, lng], zoom);
        }
    }, [center, zoom]);

    // Expose map methods via ref
    useImperativeHandle(ref, () => ({
      flyTo: (center: [number, number], zoom: number = 15) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(center, zoom);
        }
      },
      getMap: () => mapInstanceRef.current
    }));
    
    // Create markers only once when component mounts or markers change significantly
    useEffect(() => {
        const map = mapInstanceRef.current;
        const layer = markersLayerRef.current;
        if (!map || !layer || !isInitializedRef.current) {
            console.log('Cannot create markers - missing dependencies:');
            console.log('- Map exists:', !!map);
            console.log('- Layer exists:', !!layer);
            console.log('- Is initialized:', isInitializedRef.current);
            return;
        }

        console.log('=== MARKER CREATION START ===');
        console.log('Current marker instances:', markerInstancesRef.current.length);
        console.log('New markers to create:', markers.length);

        // Clear existing markers and recreate
        layer.clearLayers();
        markerInstancesRef.current = [];

        const bounds = L.latLngBounds([]);
        
        markers.forEach((m, index) => {
            console.log(`Creating marker ${index + 1} at position:`, m.position);
            const marker = L.marker(m.position, { title: m.title });
            
            if (m.title || m.description) {
                // Bind popup but configure to open on hover, not click
                const popup = L.popup({
                    closeButton: false,
                    autoClose: false,
                    closeOnEscapeKey: false,
                    closeOnClick: false
                }).setContent(`<strong>${m.title ?? ''}</strong><br/>${m.description ?? ''}`);
                
                marker.bindPopup(popup);
                
                // Open popup on mouseover
                marker.on('mouseover', () => {
                    marker.openPopup();
                });
                
                // Close popup on mouseout
                marker.on('mouseout', () => {
                    marker.closePopup();
                });
            }
            
            marker.addTo(layer);
            markerInstancesRef.current.push(marker);
            bounds.extend(m.position);
            console.log(`Marker ${index + 1} added to layer, total markers:`, markerInstancesRef.current.length);
        });

        if (markers.length > 0) {
            map.fitBounds(bounds.pad(0.1));
        }
        
        console.log('=== MARKER CREATION COMPLETED ===');
        console.log('Total markers created:', markerInstancesRef.current.length);
    }, [markers]);

    // Clear measurement function
    const clearMeasurement = () => {
        console.log('=== CLEARING MEASUREMENT ===');
        selectedPointsRef.current = [];
        
        // Remove polyline if exists
        if (measurePolylineRef.current) {
            console.log('Removing polyline');
            measurePolylineRef.current.remove();
            measurePolylineRef.current = null;
        }
        
        // Remove polygon if exists
        if (measurePolygonRef.current) {
            console.log('Removing polygon');
            measurePolygonRef.current.remove();
            measurePolygonRef.current = null;
        }
        
        if (distanceLabelRef.current) {
            console.log('Removing distance label');
            distanceLabelRef.current.remove();
            distanceLabelRef.current = null;
        }
        
        if (onDistanceChange) onDistanceChange(0);
        console.log('=== MEASUREMENT CLEARED ===');
    };

    // Handle click handlers for measurement (separate from marker creation)
    useEffect(() => {
        const markerInstances = markerInstancesRef.current;
        const measureLayer = measureLayerRef.current;
        
        if (!markerInstances.length) {
            console.log('No marker instances available for click handlers');
            return;
        }

        if (!measureLayer) {
            console.log('No measure layer available for click handlers');
            return;
        }

        console.log('=== SETTING UP CLICK HANDLERS ===');
        console.log('Markers available for click handlers:', markerInstances.length);
        console.log('Show lines enabled:', showLines);

        // Clear previous click handlers
        markerInstances.forEach((marker) => {
            marker.off('click');
        });

        // Always attach click handlers when showLines is true
        if (showLines) {
            console.log('Attaching click handlers for measurement');
            markerInstances.forEach((marker, index) => {
                marker.on('click', (e: L.LeafletMouseEvent) => {
                    console.log(`=== MARKER ${index + 1} CLICKED ===`);
                    const latlng = marker.getLatLng();
                    console.log('Clicked position:', latlng);

                    const pts = selectedPointsRef.current;
                    console.log('Current points length:', pts.length);

                    if (pts.length === 0) {
                        console.log('First point selected');
                        // Clear any existing measurement before starting new one
                        clearMeasurement();
                        selectedPointsRef.current.push(latlng);
                        console.log('First point added, array length now:', selectedPointsRef.current.length);
                        return;
                    }

                    if (pts.length === 1) {
                        console.log('Second point selected');
                        
                        // Check if clicking the same marker
                        const firstPoint = selectedPointsRef.current[0];
                        const isSamePoint = firstPoint.lat === latlng.lat && firstPoint.lng === latlng.lng;
                        
                        if (isSamePoint) {
                            console.log('Clicked same marker, showing 0m distance');
                            // Create a small circle or point to show 0m measurement
                            const distanceMeters = 0;
                            
                            // Create a small circle at the point to indicate measurement
                            const circle = L.circle(latlng, {
                                radius: 10,
                                color: '#dc2626',
                                weight: 3,
                                fillColor: '#dc2626',
                                fillOpacity: 0.7,
                            });
                            
                            circle.addTo(measureLayer);
                            console.log('Zero distance circle added to measure layer');

                            if (onDistanceChange) onDistanceChange(distanceMeters);

                            // Add distance label
                            const labelText = '0 m';
                            distanceLabelRef.current = L.marker(latlng, {
                                icon: L.divIcon({
                                    className: 'distance-label',
                                    html: `<div style="background:#dc2626;color:#fff;padding:6px 10px;border-radius:6px;font-size:14px;font-weight:600;box-shadow:0 4px 8px rgba(0,0,0,0.4);border:2px solid #fff;">${labelText}</div>`,
                                    iconSize: [0, 0],
                                    iconAnchor: [0, 0],
                                }),
                                interactive: false,
                            });
                            
                            distanceLabelRef.current.addTo(measureLayer);
                            console.log('Zero distance label added to measure layer');
                            
                            return;
                        }
                        
                        selectedPointsRef.current.push(latlng);
                        console.log('Second point added, array length now:', selectedPointsRef.current.length);
                        
                        const points = selectedPointsRef.current;
                        console.log('Creating polyline between points:', points[0], 'and', points[1]);
                        
                        // Calculate distance
                        const distanceMeters = points[0].distanceTo(points[1]);
                        console.log('Distance calculated:', distanceMeters, 'meters');
                        
                        // Create feature based on featureType
                        if (featureType === 'polyline') {
                            // Create polyline
                            console.log('About to create polyline with points:', [points[0], points[1]]);
                            measurePolylineRef.current = L.polyline([points[0], points[1]], {
                                color: '#dc2626',
                                weight: 8,
                                opacity: 1.0,
                                dashArray: '10, 5'
                            });
                            
                            console.log('Polyline created:', !!measurePolylineRef.current);
                            
                            // Add polyline directly to map first to test
                            if (mapInstanceRef.current) {
                                measurePolylineRef.current.addTo(mapInstanceRef.current);
                                console.log('Polyline added directly to map');
                            }
                            
                            // Also add to measure layer
                            measurePolylineRef.current.addTo(measureLayer);
                            console.log('Polyline added to measure layer successfully');
                        } else {
                            // Create polygon
                            console.log('About to create polygon with points:', [points[0], points[1]]);
                            
                            // For polygon, we need at least 3 points, so create a triangle
                            // We'll create a triangle using the two points and a third point that forms a right angle
                            const dx = points[1].lng - points[0].lng;
                            const dy = points[1].lat - points[0].lat;
                            
                            // Create a point perpendicular to the line between points[0] and points[1]
                            const thirdPoint = L.latLng(
                                points[0].lat + dy * 0.3, 
                                points[0].lng - dx * 0.3
                            );
                            
                            measurePolygonRef.current = L.polygon([
                                points[0],
                                points[1],
                                thirdPoint
                            ], {
                                color: '#dc2626',
                                weight: 3,
                                opacity: 1.0,
                                fillColor: '#dc2626',
                                fillOpacity: 0.2
                            });
                            
                            console.log('Polygon created:', !!measurePolygonRef.current);
                            
                            // Add polygon to map
                            if (mapInstanceRef.current) {
                                measurePolygonRef.current.addTo(mapInstanceRef.current);
                                console.log('Polygon added directly to map');
                            }
                            
                            // Also add to measure layer
                            measurePolygonRef.current.addTo(measureLayer);
                            console.log('Polygon added to measure layer successfully');
                        }
                        
                        // Force a redraw
                        if (mapInstanceRef.current) {
                            mapInstanceRef.current.invalidateSize();
                        }

                        if (onDistanceChange) onDistanceChange(distanceMeters);

                        // Add distance label
                        const midLat = (points[0].lat + points[1].lat) / 2;
                        const midLng = (points[0].lng + points[1].lng) / 2;
                        const labelText = distanceMeters > 1000
                            ? `${(distanceMeters / 1000).toFixed(2)} km`
                            : `${distanceMeters.toFixed(0)} m`;

                        distanceLabelRef.current = L.marker([midLat, midLng], {
                            icon: L.divIcon({
                                className: 'distance-label',
                                html: `<div style="background:#dc2626;color:#fff;padding:6px 10px;border-radius:6px;font-size:14px;font-weight:600;box-shadow:0 4px 8px rgba(0,0,0,0.4);border:2px solid #fff;">${labelText}</div>`,
                                iconSize: [0, 0],
                                iconAnchor: [0, 0],
                            }),
                            interactive: false,
                        });
                        
                        distanceLabelRef.current.addTo(measureLayer);
                        console.log('Distance label added to measure layer successfully');
                        
                        console.log('=== MEASUREMENT COMPLETED ===');
                        return;
                    }

                    if (pts.length >= 2) {
                        console.log('Third point - starting new measurement');
                        clearMeasurement();
                        selectedPointsRef.current.push(latlng);
                        console.log('New measurement started with first point, array length:', selectedPointsRef.current.length);
                    }
                });
            });
        } else {
            console.log('showLines is false, not attaching click handlers');
        }
    }, [showLines, onDistanceChange]);

    // Coverage circles toggle
    useEffect(() => {
        const coverageLayer = coverageLayerRef.current;
        if (!coverageLayer) return;
        coverageLayer.clearLayers();
        if (showCoverage) {
            markers.forEach((m) => {
                const circle = L.circle(m.position, {
                    radius: m.radiusMeters ?? defaultRadiusMeters,
                    color: '#2563eb',
                    weight: 1,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.15,
                });
                circle.addTo(coverageLayer);
            });
        }
    }, [showCoverage, defaultRadiusMeters, markers]);

    // External reset trigger (e.g., button click in parent)
    useEffect(() => {
        const measureLayer = measureLayerRef.current;
        if (!measureLayer) return;
        if (resetLinesTrigger === undefined) return;

        console.log('=== EXTERNAL RESET TRIGGERED ===');
        clearMeasurement();
        console.log('=== EXTERNAL RESET COMPLETED ===');
    }, [resetLinesTrigger, onDistanceChange]);

    // Clear measurement when showLines is disabled (coverage mode)
    useEffect(() => {
        if (showLines) return;
        const measureLayer = measureLayerRef.current;
        if (!measureLayer) return;
        
        console.log('=== CLEARING MEASUREMENT (showLines disabled) ===');
        clearMeasurement();
    }, [showLines, onDistanceChange]);

    return (
        <div 
            ref={mapRef} 
            className={`leaflet-map ${className}`}
            style={{ height: '400px', width: '100%', ...style }}
        />
    );
});

export default LeafletMap;