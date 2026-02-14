import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { useMapContext } from '../context/MapContext';
import { CONFIG } from '../constants/config';
import { Navigation, Search, MapPin, Info } from 'lucide-react';

const MapPicker = ({ onLocationSelect, initialLocation, readOnly = false }) => {
    const { isLoaded } = useMapContext();
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(initialLocation?.lat ? initialLocation : null);
    const [autocomplete, setAutocomplete] = useState(null);
    const [searchInputValue, setSearchInputValue] = useState('');

    // Update marker if initialLocation changes
    useEffect(() => {
        if (initialLocation?.lat) {
            setMarker(initialLocation);
            if (map) {
                map.panTo(initialLocation);
            }
        }
    }, [initialLocation, map]);

    const onLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const onAutocompleteLoad = (autocompleteInstance) => {
        setAutocomplete(autocompleteInstance);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const newLocation = { lat, lng };

                setMarker(newLocation);
                onLocationSelect(newLocation);
                setSearchInputValue(place.formatted_address || place.name);

                if (map) {
                    map.panTo(newLocation);
                    map.setZoom(16);
                }
            } else {
                console.log("Autocomplete: Returned place contains no geometry");
            }
        }
    };

    const handleMapClick = (e) => {
        if (!readOnly && e.latLng) {
            const newLocation = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            };
            setMarker(newLocation);
            onLocationSelect(newLocation);
        }
    };

    const handleUseMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLocation = { lat: latitude, lng: longitude };
                    setMarker(newLocation);
                    onLocationSelect(newLocation);
                    if (map) {
                        map.panTo(newLocation);
                        map.setZoom(16);
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Could not get your location. Please check browser permissions.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    if (!isLoaded) {
        return (
            <div className="h-[400px] w-full rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <p className="text-gray-400 font-medium">Loading Google Maps...</p>
            </div>
        );
    }

    const mapOptions = {
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
    };

    return (
        <div className="space-y-4">
            {!readOnly && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-3 relative">
                        <Autocomplete
                            onLoad={onAutocompleteLoad}
                            onPlaceChanged={onPlaceChanged}
                        >
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search location in Google Maps..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    value={searchInputValue}
                                    onChange={(e) => setSearchInputValue(e.target.value)}
                                />
                            </div>
                        </Autocomplete>
                    </div>
                    <button
                        onClick={() => { /* Search is handled by Autocomplete, but button can trigger focus or something */ }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border-b-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        title="Search provided by Google Maps"
                    >
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                    </button>
                </div>
            )}

            <div className="relative rounded-2xl overflow-hidden shadow-inner border border-gray-100">
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: readOnly ? '250px' : '400px' }}
                    center={marker || CONFIG.DEFAULT_CENTER}
                    zoom={CONFIG.DEFAULT_ZOOM || 14}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={handleMapClick}
                    options={mapOptions}
                >
                    {marker && (
                        <Marker position={marker} />
                    )}
                </GoogleMap>

                {/* Legend Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/50 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                            <span className="text-[10px] font-bold text-gray-700 uppercase">Selected Location</span>
                        </div>
                    </div>
                </div>

                {/* Geolocation Button */}
                {!readOnly && (
                    <button
                        onClick={handleUseMyLocation}
                        className="absolute bottom-4 right-4 bg-white p-2.5 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                        title="Use my location"
                    >
                        <Navigation className="w-5 h-5 text-blue-600" />
                    </button>
                )}
            </div>

            {!readOnly && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100/50">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                        Click on the map to set location, or use the Google search bar.
                    </p>
                </div>
            )}
        </div>
    );
};

export default React.memo(MapPicker);
