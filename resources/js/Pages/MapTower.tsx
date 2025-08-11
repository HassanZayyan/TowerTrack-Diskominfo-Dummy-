import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import LeafletMap from '@/Components/LeafletMap';

interface MapTowerProps {
    auth: {
        user: any;
    };
    towers?: Array<{
        id: number;
        site_name: string;
        latitude: number | string;
        longitude: number | string;
        alamat_menara?: string;
        tinggi_menara?: number;
        site_type?: string | null;
    }>;
}

const MapTower: React.FC<MapTowerProps> = ({ auth, towers = [] }) => {
    type Mode = 'none' | 'coverage';
    const [mode, setMode] = useState<Mode>('none');
    const [radius, setRadius] = useState<number>(500);
    const [distance, setDistance] = useState<number>(0);
    const [resetLinesCounter, setResetLinesCounter] = useState<number>(0);

    const markers = useMemo(() => towers
        .map(t => {
            const lat = Number(t.latitude);
            const lon = Number(t.longitude);
            return { t, lat, lon };
        })
        .filter(({ lat, lon }) => Number.isFinite(lat) && Number.isFinite(lon))
        .map(({ t, lat, lon }) => {
            // Derive per-tower radius: prefer tinggi_menara if available, fallback by site type, else default
            let radiusMeters: number | undefined = undefined;
            if (typeof t.tinggi_menara === 'number' && t.tinggi_menara > 0) {
                // Simple heuristic: 8x tower height in meters (tweakable)
                radiusMeters = Math.min(Math.max(t.tinggi_menara * 8, 100), 3000);
            }

            // Fallback by site type if height missing
            if ((radiusMeters === undefined || !Number.isFinite(radiusMeters)) && t.site_type) {
                const st = t.site_type.toLowerCase();
                if (st.includes('rooftop')) radiusMeters = 250;
                else if (st.includes('sst') || st.includes('monopole')) radiusMeters = 400;
                else if (st.includes('guyed') || st.includes('lattice') || st.includes('sstl')) radiusMeters = 600;
                else radiusMeters = 500; // generic default
            }

            if (radiusMeters === undefined) {
                radiusMeters = 500;
            }

            return ({
                position: [lat, lon] as [number, number],
                title: t.site_name,
                description: `${t.alamat_menara ?? ''}${t.tinggi_menara ? `<br/>Tinggi: ${t.tinggi_menara} m` : ''}`,
                radiusMeters,
            });
        }), [towers]);

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Map Tower</h2>}
        >
            <Head title="Map Tower" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-semibold mb-4">Peta Menara</h3>
                            <p className="mb-4">Menampilkan menara yang memiliki koordinat.</p>
                            
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="md:w-64 w-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                                    <select
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value as Mode)}
                                        className="w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                    >
                                        <option value="none">Default (dengan ukur jarak)</option>
                                        <option value="coverage">Radius (coverage)</option>
                                    </select>

                                    {mode === 'coverage' && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Radius (meter)</label>
                                            <input
                                                type="number"
                                                min={10}
                                                step={10}
                                                value={radius}
                                                onChange={(e) => setRadius(Number(e.target.value) || 0)}
                                                className="w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                            />
                                        </div>
                                    )}

                                    {mode === 'none' && (
                                        <div className="mt-4 text-sm">
                                            <div className="font-medium text-gray-700">Ukur Jarak</div>
                                            <div className="text-gray-600 text-xs mb-2">Klik 2 tower untuk mengukur jarak</div>
                                            <div className="text-gray-900">{distance.toFixed(1)} m{distance > 1000 ? ` (${(distance/1000).toFixed(2)} km)` : ''}</div>
                                            <button
                                                type="button"
                                                onClick={() => setResetLinesCounter(c => c + 1)}
                                                className="mt-2 inline-flex items-center px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium"
                                            >
                                                Reset garis
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <LeafletMap
                                        center={[-7.197, 110.426]}
                                        zoom={10}
                                        style={{ height: '500px' }}
                                        markers={markers}
                                        showLines={mode === 'none'}
                                        showCoverage={mode === 'coverage'}
                                        defaultRadiusMeters={radius}
                                        onDistanceChange={setDistance}
                                        resetLinesTrigger={resetLinesCounter}
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-4 text-sm text-gray-600">
                                <p>Total menara ditampilkan: {markers.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default MapTower;
