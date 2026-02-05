import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../constants/config';

const MapContext = createContext({ isLoaded: false });

// Stable libraries array to prevent reloads
const LIBRARIES = ['places'];

export const MapProvider = ({ children }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    return (
        <MapContext.Provider value={{ isLoaded }}>
            {children}
        </MapContext.Provider>
    );
};

export const useMapContext = () => useContext(MapContext);
