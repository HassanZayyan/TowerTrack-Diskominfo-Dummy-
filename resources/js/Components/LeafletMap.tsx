import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LeafletMapProps {
    center?: [number, number];
    zoom?: number;
    className?: string;
    style?: React.CSSProperties;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
    center = [0, 0],
    zoom = 13,
    className = '',
    style = {}
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize map
        const map = L.map(mapRef.current).setView(center, zoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Store map instance
        mapInstanceRef.current = map;

        // Cleanup function
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [center, zoom]);

    return (
        <div 
            ref={mapRef} 
            className={`leaflet-map ${className}`}
            style={{ height: '400px', width: '100%', ...style }}
        />
    );
};

export default LeafletMap; 