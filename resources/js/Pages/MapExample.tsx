import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import LeafletMap from '@/Components/LeafletMap';

interface MapExampleProps {
    auth: {
        user: any;
    };
}

const MapExample: React.FC<MapExampleProps> = ({ auth }) => {
    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Map Example</h2>}
        >
            <Head title="Map Example" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-semibold mb-4">Leaflet Map Example</h3>
                            <p className="mb-4">Ini adalah contoh penggunaan Leaflet.js dalam aplikasi Laravel + Inertia + React.</p>
                            
                            <LeafletMap 
                                center={[-6.2088, 106.8456]} // Jakarta coordinates
                                zoom={10}
                                style={{ height: '500px' }}
                            />
                            
                            <div className="mt-4 text-sm text-gray-600">
                                <p>Koordinat: Jakarta, Indonesia (-6.2088, 106.8456)</p>
                                <p>Zoom level: 10</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default MapExample; 