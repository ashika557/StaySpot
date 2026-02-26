/**
 * Global Configuration Constants
 */

// Google Maps API Configuration
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
export const GOOGLE_MAPS_LIBRARIES = ['places'];

export const CONFIG = {
    GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY,
    LIBRARIES: GOOGLE_MAPS_LIBRARIES,
    DEFAULT_CENTER: {
        lat: 26.7400, // Roughly between Dharan and Itahari
        lng: 87.2800,
    },
    LOCATIONS: {
        DHARAN: { lat: 26.8125, lng: 87.2834 },
        ITAHARI: { lat: 26.6647, lng: 87.2718 }
    },
    MAP_BOUNDS: {
        north: 26.9500,
        south: 26.6000,
        east: 87.4000,
        west: 87.1500,
    }
};
