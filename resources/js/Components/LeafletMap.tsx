import React, { useEffect, useRef, forwardRef, useImperativeHandle, useMemo, useCallback, useState } from 'react';
import L from 'leaflet';
import { isTowerSelected, createTowerMarkerIcon } from '@/utils/towerIconUtils';
import { createFoMarkerIcon } from '@/utils/foIconUtils'; // Add this import

interface MapMarker {
    position: [number, number];
    title?: string;
    description?: string;
    radiusMeters?: number;
    towerData?: any; // Tower data to pass when marker is clicked
    customIcon?: L.Icon | L.DivIcon; // Custom icon (for FO points or other custom icons)
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
    onMarkerClick?: (towerData: any) => void;
    selectedTowerId?: string | number | null; // ID of currently selected tower for visual feedback
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
    onMarkerClick,
    selectedTowerId = null,
}, ref) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const coverageLayerRef = useRef<L.LayerGroup | null>(null);
    const measureLayerRef = useRef<L.LayerGroup | null>(null);
    const markerInstancesRef = useRef<L.Marker[]>([]);
    const selectedPointsRef = useRef<L.LatLng[]>([]);
    const measurePolylineRef = useRef<L.Polyline | null>(null);
    const distanceLabelRef = useRef<L.Marker | null>(null);
    const isInitializedRef = useRef<boolean>(false);
    const scaleControlRef = useRef<L.Control.Scale | null>(null);
    const previousMarkersRef = useRef<MapMarker[]>([]);
    const hasInitialFitBoundsRef = useRef<boolean>(false);
    const [measurementPointsUpdateTrigger, setMeasurementPointsUpdateTrigger] = useState<number>(0);

    // Initialize map only once on mount
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current);
        map.setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // Add and style metric scale control (bottom-left)
        const scale = L.control.scale({ metric: true, imperial: false, position: 'bottomleft', maxWidth: 150 });
        scale.addTo(map);
        scaleControlRef.current = scale;
        try {
            const container = scale.getContainer();
            if (container) {
                container.style.backgroundColor = '#FFFFFF';
                container.style.border = '1px solid #212121';
                container.style.borderRadius = '8px';
                container.style.padding = '4px 8px';
                container.style.margin = '8px';
                container.style.color = '#212121';
                container.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
                container.style.fontWeight = '600';
                container.style.fontSize = '11px';
                container.style.zIndex = '500';
                const lines = container.querySelectorAll('.leaflet-control-scale-line');
                lines.forEach((el) => {
                    const line = el as HTMLElement;
                    // Show text only: remove bar visuals
                    line.style.background = 'transparent';
                    line.style.border = '0';
                    line.style.boxShadow = 'none';
                    line.style.width = 'auto';
                    line.style.height = 'auto';
                    line.style.lineHeight = 'normal';
                    line.style.margin = '0';
                    line.style.padding = '0';
                    line.style.display = 'inline';
                    line.style.color = '#212121';
                    line.style.whiteSpace = 'nowrap';
                });
            }
        } catch {}

        // Prevent page scroll or scroll-chaining when interacting with the map
        if (mapRef.current) {
            try {
                L.DomEvent.disableScrollPropagation(mapRef.current);
                L.DomEvent.disableClickPropagation(mapRef.current);
            } catch {}
        }

        // Create layers in correct order so measurement sits above tiles but below markers
        coverageLayerRef.current = L.layerGroup().addTo(map);
        measureLayerRef.current = L.layerGroup().addTo(map);
        markersLayerRef.current = L.layerGroup().addTo(map);

        isInitializedRef.current = true;

        // Invalidate size after initial render to ensure proper sizing in responsive containers
        setTimeout(() => {
            try { map.invalidateSize(); } catch {}
        }, 0);

        // Observe container resize to keep the map responsive
        if (mapRef.current && 'ResizeObserver' in window) {
            const ro = new ResizeObserver(() => {
                try { map.invalidateSize(); } catch {}
            });
            ro.observe(mapRef.current);
            resizeObserverRef.current = ro;
        }

        // Also react to window resize/orientation changes
        const handleWindowResize = () => {
            try { map.invalidateSize(); } catch {}
        };
        window.addEventListener('resize', handleWindowResize);
        window.addEventListener('orientationchange', handleWindowResize);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            if (scaleControlRef.current && map) {
                try { map.removeControl(scaleControlRef.current); } catch {}
                scaleControlRef.current = null;
            }
            if (resizeObserverRef.current) {
                try { resizeObserverRef.current.disconnect(); } catch {}
                resizeObserverRef.current = null;
            }
            window.removeEventListener('resize', handleWindowResize);
            window.removeEventListener('orientationchange', handleWindowResize);
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

    // We intentionally do not auto-sync view to props on subsequent renders
    // to avoid overriding manual panning/zooming and programmatic flyTo calls.

    // Helper function to check if position is in selectedPointsRef
    const isPointSelected = useCallback((position: [number, number]): boolean => {
        return selectedPointsRef.current.some(point => 
            Math.abs(point.lat - position[0]) < 0.0001 && 
            Math.abs(point.lng - position[1]) < 0.0001
        );
    }, []);

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

        // Check if markers array actually changed (not just selectedTowerId)
        // Compare by creating a string key for each marker based on position and tower ID
        const createMarkerKey = (m: MapMarker) => 
            `${m.position[0]},${m.position[1]},${m.towerData?.id ?? 'no-id'}`;
        
        const currentMarkerKeys = markers.map(createMarkerKey).sort().join('|');
        const previousMarkerKeys = previousMarkersRef.current.map(createMarkerKey).sort().join('|');
        const markersChanged = currentMarkerKeys !== previousMarkerKeys;

        // Only recreate markers if markers array actually changed
        if (markersChanged) {
            // Clear existing markers and recreate
            layer.clearLayers();
            markerInstancesRef.current = [];
            hasInitialFitBoundsRef.current = false;

            const bounds = L.latLngBounds([]);
            
            markers.forEach((m, index) => {
                console.log(`Creating marker ${index + 1} at position:`, m.position);
                
                // Use custom icon if provided, otherwise create tower icon
                let iconToUse: L.Icon | L.DivIcon;
                if (m.customIcon) {
                    // Use provided custom icon (e.g., FO point icon)
                    iconToUse = m.customIcon;
                } else {
                    // Determine marker icon state for towers
                    // Priority: measurement selected > selected > default
                    let iconState: 'default' | 'selected' | 'measurement';
                    if (showLines) {
                        // Measurement mode: only selected points are red
                        const isMeasurementSelected = isPointSelected(m.position);
                        iconState = isMeasurementSelected ? 'measurement' : 'default';
                    } else {
                        // Normal mode: check if selected
                        const towerId = m.towerData?.id;
                        const isSelected = isTowerSelected(towerId, selectedTowerId);
                        iconState = isSelected ? 'selected' : 'default';
                    }
                    
                    // Create custom icon based on state
                    iconToUse = createTowerMarkerIcon(iconState);
                }
                
                const marker = L.marker(m.position, { 
                    title: m.title,
                    icon: iconToUse
                });
                
                if (m.title || m.description) {
                    // Bind popup but configure to open on hover, not click
                    const popup = L.popup({
                        closeButton: false,
                        autoClose: false,
                        closeOnEscapeKey: false,
                        closeOnClick: false,
                        // Prevent the map from panning to keep the popup in view on hover
                        autoPan: false,
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

            // Only fit bounds on initial load (first time markers are added)
            if (markers.length > 0 && !hasInitialFitBoundsRef.current) {
                map.fitBounds(bounds.pad(0.1));
                hasInitialFitBoundsRef.current = true;
                console.log('Initial fitBounds applied');
            } else if (markersChanged) {
                // If markers changed but we already did initial fitBounds, don't refit
                // This prevents zoom/pan when user clicks on markers
                console.log('Markers changed but skipping fitBounds to preserve user zoom/pan');
            }

            // Update previous markers reference
            previousMarkersRef.current = [...markers];
        }
        
        console.log('=== MARKER CREATION COMPLETED ===');
        console.log('Total markers created:', markerInstancesRef.current.length);
    }, [markers]); // Only recreate markers when markers array changes

    // Update marker icons when selectedTowerId, showLines, or selectedPointsRef changes
    useEffect(() => {
        if (!markerInstancesRef.current.length || !markers.length) return;

        console.log('=== UPDATING MARKER ICONS ===');
        console.log('Selected tower ID:', selectedTowerId);
        console.log('Show lines (measurement mode):', showLines);
        console.log('Selected measurement points:', selectedPointsRef.current.length);
        console.log('Total markers to update:', markerInstancesRef.current.length);

        markerInstancesRef.current.forEach((marker, index) => {
            const markerData = markers[index];
            if (!markerData) return;

            const towerData = markerData.towerData;
            
            // Determine if this is an FO point or tower based on data structure
            // Priority: __type > property check
            // FO points have 'name' property, towers have 'site_name' property
            const isFoPoint = towerData && (
                towerData.__type === 'fo_point' || 
                (towerData.__type !== 'tower' && towerData.name && !towerData.site_name)
            );
            const isTower = towerData && (
                towerData.__type === 'tower' || 
                (towerData.__type !== 'fo_point' && towerData.site_name)
            );
            
            if (isFoPoint) {
                // This is an FO point - update using createFoMarkerIcon
                // Determine selection state
                const isSelected = selectedTowerId && towerData.id && 
                    towerData.id.toString() === selectedTowerId.toString();
                const state = isSelected ? 'selected' : 'default';
                
                // Get FO point images and side_of_road
                const foImages = (towerData.images && typeof towerData.images === 'object') ? {
                    isp: towerData.images.isp || null,
                    pole: towerData.images.pole || null,
                    junction_box: towerData.images.junction_box || null,
                } : {
                    isp: null,
                    pole: null,
                    junction_box: null,
                };
                
                const sideOfRoad = towerData.side_of_road || null;
                
                // Create new FO icon with correct selection state
                const newIcon = createFoMarkerIcon(foImages, sideOfRoad, state);
                marker.setIcon(newIcon);
                
                console.log(`FO Point marker ${index + 1} (ID: ${towerData.id}) updated - State: ${state}`);
            } else if (isTower) {
                // This is a tower - update using createTowerMarkerIcon
                // Determine marker icon state
                // Priority: measurement selected > selected > default
                let iconState: 'default' | 'selected' | 'measurement';
                if (showLines) {
                    // Measurement mode: only selected points are red
                    const isMeasurementSelected = isPointSelected(markerData.position);
                    iconState = isMeasurementSelected ? 'measurement' : 'default';
                } else {
                    // Normal mode: check if selected
                    const towerId = towerData?.id;
                    const isSelected = isTowerSelected(towerId, selectedTowerId);
                    iconState = isSelected ? 'selected' : 'default';
                }
                
                // Update icon without recreating marker
                const newIcon = createTowerMarkerIcon(iconState);
                marker.setIcon(newIcon);
                
                console.log(`Tower marker ${index + 1} (ID: ${towerData?.id}) updated - State: ${iconState}`);
            } else {
                // Fallback: if we can't determine type, check if it has site_name (tower) or name (FO point)
                // Default to tower if unclear
                if (towerData?.site_name) {
                    // Has site_name - treat as tower
                    let iconState: 'default' | 'selected' | 'measurement';
                    if (showLines) {
                        const isMeasurementSelected = isPointSelected(markerData.position);
                        iconState = isMeasurementSelected ? 'measurement' : 'default';
                    } else {
                        const towerId = towerData?.id;
                        const isSelected = isTowerSelected(towerId, selectedTowerId);
                        iconState = isSelected ? 'selected' : 'default';
                    }
                    const newIcon = createTowerMarkerIcon(iconState);
                    marker.setIcon(newIcon);
                    console.log(`Fallback (tower): Marker ${index + 1} (ID: ${towerData?.id}) updated - State: ${iconState}`);
                } else if (towerData?.name) {
                    // Has name but no site_name - treat as FO point
                    const isSelected = selectedTowerId && towerData.id && 
                        towerData.id.toString() === selectedTowerId.toString();
                    const state = isSelected ? 'selected' : 'default';
                    
                    const foImages = (towerData.images && typeof towerData.images === 'object') ? {
                        isp: towerData.images.isp || null,
                        pole: towerData.images.pole || null,
                        junction_box: towerData.images.junction_box || null,
                    } : {
                        isp: null,
                        pole: null,
                        junction_box: null,
                    };
                    
                    const sideOfRoad = towerData.side_of_road || null;
                    const newIcon = createFoMarkerIcon(foImages, sideOfRoad, state);
                    marker.setIcon(newIcon);
                    console.log(`Fallback (FO point): Marker ${index + 1} (ID: ${towerData?.id}) updated - State: ${state}`);
                } else {
                    // Can't determine type - skip update to avoid errors
                    console.log(`Marker ${index + 1} - cannot determine type, skipping update`);
                }
            }
        });

        console.log('=== MARKER ICONS UPDATE COMPLETED ===');
    }, [selectedTowerId, markers, showLines, measurementPointsUpdateTrigger, isPointSelected]);

    // Clear measurement function
    const clearMeasurement = () => {
        console.log('=== CLEARING MEASUREMENT ===');
        selectedPointsRef.current = [];
        // Trigger icon update to reset marker colors
        setMeasurementPointsUpdateTrigger(prev => prev + 1);
        
        // Remove polyline if exists
        if (measurePolylineRef.current) {
            console.log('Removing polyline');
            measurePolylineRef.current.remove();
            measurePolylineRef.current = null;
        }
        
        // no polygon cleanup needed
        
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

        // Attach click handlers based on mode - STRICT SEPARATION between measurement and detail view
        if (showLines) {
            console.log('MEASUREMENT MODE: Attaching click handlers for distance measurement ONLY');
            console.log('Detail tower view is DISABLED in measurement mode');
            markerInstances.forEach((marker, index) => {
                marker.on('click', (e: L.LeafletMouseEvent) => {
                    console.log(`=== MARKER ${index + 1} CLICKED (MEASUREMENT MODE ONLY) ===`);
                    
                    // Prevent event propagation to avoid any other handlers
                    e.originalEvent.stopPropagation();
                    e.originalEvent.preventDefault();
                    
                    const latlng = marker.getLatLng();
                    console.log('Clicked position for measurement:', latlng);

                    const pts = selectedPointsRef.current;
                    console.log('Current measurement points length:', pts.length);

                    if (pts.length === 0) {
                        console.log('First measurement point selected');
                        // Clear any existing measurement before starting new one
                        clearMeasurement();
                        selectedPointsRef.current.push(latlng);
                        console.log('First measurement point added, array length now:', selectedPointsRef.current.length);
                        // Trigger icon update
                        setMeasurementPointsUpdateTrigger(prev => prev + 1);
                        return;
                    }

                    if (pts.length === 1) {
                        console.log('Second measurement point selected');
                        
                        // Check if clicking the same marker
                        const firstPoint = selectedPointsRef.current[0];
                        const isSamePoint = firstPoint.lat === latlng.lat && firstPoint.lng === latlng.lng;
                        
                        if (isSamePoint) {
                            console.log('Same point clicked - resetting measurement');
                            clearMeasurement();
                            if (onDistanceChange) onDistanceChange(0);
                            return;
                        }
                        
                        selectedPointsRef.current.push(latlng);
                        console.log('Second measurement point added, array length now:', selectedPointsRef.current.length);
                        // Trigger icon update
                        setMeasurementPointsUpdateTrigger(prev => prev + 1);
                        
                        const points = selectedPointsRef.current;
                        console.log('Creating measurement polyline between points:', points[0], 'and', points[1]);
                        
                        // Calculate distance
                        const distanceMeters = points[0].distanceTo(points[1]);
                        console.log('Distance measured:', distanceMeters, 'meters');
                        
                        // Create polyline measurement
                        measurePolylineRef.current = L.polyline([points[0], points[1]], {
                            color: '#dc2626',
                            weight: 8,
                            opacity: 1.0,
                            dashArray: '10, 5'
                        });
                        if (mapInstanceRef.current) {
                            measurePolylineRef.current.addTo(mapInstanceRef.current);
                        }
                        measurePolylineRef.current.addTo(measureLayer);
                        
                        // Force a redraw
                        if (mapInstanceRef.current) {
                            mapInstanceRef.current.invalidateSize();
                        }

                        if (onDistanceChange) onDistanceChange(distanceMeters);

                        // Do not add any distance label marker; display distance only in UI panel
                        
                        console.log('=== MEASUREMENT COMPLETED ===');
                        return;
                    }

                    if (pts.length >= 2) {
                        console.log('Third point - starting new measurement');
                        clearMeasurement();
                        selectedPointsRef.current.push(latlng);
                        console.log('New measurement started with first point, array length:', selectedPointsRef.current.length);
                        // Trigger icon update
                        setMeasurementPointsUpdateTrigger(prev => prev + 1);
                    }
                });
            });
        } else if (!showLines && onMarkerClick) {
            console.log('DETAIL VIEW MODE: Attaching click handlers for tower details ONLY');
            console.log('Distance measurement is DISABLED in detail view mode');
            markerInstances.forEach((marker, index) => {
                marker.on('click', (e: L.LeafletMouseEvent) => {
                    console.log(`=== MARKER ${index + 1} CLICKED (DETAIL VIEW MODE ONLY) ===`);
                    
                    // Prevent event propagation to avoid any other handlers
                    e.originalEvent.stopPropagation();
                    e.originalEvent.preventDefault();
                    
                    // Find the marker data based on the clicked marker position
                    const clickedPosition = marker.getLatLng();
                    console.log('Finding tower data for position:', clickedPosition);
                    
                    const markerData = markers.find(m => 
                        m.position[0] === clickedPosition.lat && 
                        m.position[1] === clickedPosition.lng
                    );
                    
                    if (markerData && markerData.towerData) {
                        console.log('Opening tower detail for:', markerData.towerData.site_name);
                        onMarkerClick(markerData.towerData);
                    } else {
                        console.log('No tower data found for clicked marker at position:', clickedPosition);
                    }
                });
            });
        } else {
            console.log('NO CLICK HANDLERS: Either showLines is false without onMarkerClick, or invalid configuration');
        }
    }, [showLines, markers, onDistanceChange, onMarkerClick]);

    // Coverage circles toggle
    useEffect(() => {
        const coverageLayer = coverageLayerRef.current;
        if (!coverageLayer) return;
        coverageLayer.clearLayers();
        if (showCoverage) {
            markers.forEach((m) => {
                // Skip coverage circle for markers with customIcon (FO points) or undefined radiusMeters
                if (m.customIcon || m.radiusMeters === undefined || m.radiusMeters === 0) {
                    return;
                }
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
        // Also detach any stale click handlers then reattach
        markerInstancesRef.current.forEach((m) => m.off('click'));
        // Re-attach click handlers based on mode - STRICT SEPARATION maintained after reset
        if (showLines) {
            console.log('RESET: Re-attaching MEASUREMENT MODE handlers only');
            markerInstancesRef.current.forEach((marker, index) => {
                marker.on('click', (e: L.LeafletMouseEvent) => {
                    // Prevent event propagation to avoid any other handlers
                    e.originalEvent.stopPropagation();
                    e.originalEvent.preventDefault();
                    
                    const latlng = marker.getLatLng();
                    const pts = selectedPointsRef.current;
                    if (pts.length === 0) {
                        clearMeasurement();
                        selectedPointsRef.current.push(latlng);
                        setMeasurementPointsUpdateTrigger(prev => prev + 1);
                        return;
                    }
                    if (pts.length === 1) {
                        const firstPoint = selectedPointsRef.current[0];
                        const isSamePoint = firstPoint.lat === latlng.lat && firstPoint.lng === latlng.lng;
                        if (isSamePoint) {
                            clearMeasurement();
                            if (onDistanceChange) onDistanceChange(0);
                            return;
                        }
                        selectedPointsRef.current.push(latlng);
                        setMeasurementPointsUpdateTrigger(prev => prev + 1);
                        const points = selectedPointsRef.current;
                        const distanceMeters = points[0].distanceTo(points[1]);
                        measurePolylineRef.current = L.polyline([points[0], points[1]], {
                            color: '#dc2626',
                            weight: 8,
                            opacity: 1.0,
                            dashArray: '10, 5'
                        });
                        if (mapInstanceRef.current) {
                            measurePolylineRef.current.addTo(mapInstanceRef.current);
                        }
                        measurePolylineRef.current.addTo(measureLayerRef.current as L.LayerGroup);
                        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
                        if (onDistanceChange) onDistanceChange(distanceMeters);
                        return;
                    }
                    if (pts.length >= 2) {
                        clearMeasurement();
                        selectedPointsRef.current.push(latlng);
                        setMeasurementPointsUpdateTrigger(prev => prev + 1);
                    }
                });
            });
        } else if (!showLines && onMarkerClick) {
            console.log('RESET: Re-attaching DETAIL VIEW MODE handlers only');
            markerInstancesRef.current.forEach((marker, index) => {
                marker.on('click', (e: L.LeafletMouseEvent) => {
                    // Prevent event propagation to avoid any other handlers
                    e.originalEvent.stopPropagation();
                    e.originalEvent.preventDefault();
                    
                    // Find the marker data based on the clicked marker position
                    const clickedPosition = marker.getLatLng();
                    const markerData = markers.find(m => 
                        m.position[0] === clickedPosition.lat && 
                        m.position[1] === clickedPosition.lng
                    );
                    
                    if (markerData && markerData.towerData) {
                        onMarkerClick(markerData.towerData);
                    }
                });
            });
        } else {
            console.log('RESET: No click handlers attached - invalid mode configuration');
        }
        console.log('=== EXTERNAL RESET COMPLETED ===');
    }, [resetLinesTrigger, onDistanceChange, showLines, onMarkerClick, markers]);

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
            style={{ width: '100%', ...style }}
        />
    );
});

export default LeafletMap;