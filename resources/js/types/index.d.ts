export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role?: string;
    avatar?: string;
}

export interface LatLng {
    lat: number;
    lng: number;
    [key: string]: any;
}

export interface FoRoute {
    id: number;
    name: string;
    area: string;
    status: 'active' | 'inactive' | 'maintenance';
    color: string;
    description?: string;
    path_coordinates: LatLng[];
    total_distance?: number;
    total_points?: number;
}

export interface FoRouteFormData {
    name: string;
    area: string;
    status: string;
    color: string;
    description: string;
    path_coordinates: LatLng[];
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface FoRoutesPageProps {
    routes: PaginatedData<FoRoute>;
    area: string;
    [key: string]: any;
}

export interface FoRouteEditPageProps {
    mode: 'create' | 'edit';
    route?: FoRoute;
    areas: string[];
    [key: string]: any;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    csrfToken: string;
};

/**
 * Tower interface - used across the application for tower data
 * Note: latitude and longitude can be string or number because backend may return either
 */
export interface Tower {
    id: number;
    site_name: string;
    alamat_menara?: string;
    latitude?: number | string;
    longitude?: number | string;
    [key: string]: any;
}

/**
 * Coordinates interface - used for location-based operations
 */
export interface Coordinates {
    latitude: number;
    longitude: number;
}
