import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, StandaloneSearchBox, InfoWindow } from '@react-google-maps/api';
import { useMapContext } from '../context/MapContext';
import { Search, GraduationCap, MapPin, Navigation, Info } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY, CONFIG } from '../constants/config';

const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '16px'
};

const MapPicker = ({ onLocationSelect, initialLocation, readOnly = false }) => {
    const { isLoaded } = useMapContext();

    const defaultCenter = CONFIG.DEFAULT_CENTER;

    const [marker, setMarker] = React.useState(initialLocation?.lat ? initialLocation : null);
    const [nearbyPlaces, setNearbyPlaces] = React.useState([]);
    const [distances, setDistances] = React.useState({});
    const [selectedNearby, setSelectedNearby] = React.useState(null);
    const [map, setMap] = React.useState(null);
    const [isSearching, setIsSearching] = React.useState(false);
    const searchBoxRef = React.useRef(null);

    // Sync marker when initialLocation changes
    React.useEffect(() => {
        if (initialLocation?.lat) {
            setMarker(initialLocation);
        }
    }, [initialLocation]);

    const onMapLoad = React.useCallback((mapInstance) => {
        setMap(mapInstance);
    }, []);

    const findNearbyColleges = React.useCallback(async () => {
        if (!window.google || !map || !marker) return;

        try {
            setIsSearching(true);
            const service = new window.google.maps.places.PlacesService(map);

            const request = {
                location: marker,
                radius: 5000, // 5km radius
                type: ['university']
            };

            service.nearbySearch(request, (results, status) => {
                try {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                        setNearbyPlaces(results);
                        calculateDistances(marker, results);
                    } else if (status === 'ZERO_RESULTS') {
                        setNearbyPlaces([]);
                        alert('No colleges found nearby.');
                    } else {
                        throw new Error(`Places Search failed with status: ${status}`);
                    }
                } catch (innerErr) {
                    console.error("Error processing nearby results:", innerErr);
                } finally {
                    setIsSearching(false);
                }
            });
        } catch (err) {
            console.error("Nearby Search initiation failed:", err);
            setIsSearching(false);
            alert("Could not start nearby search. Please try again.");
        }
    }, [map, marker]);

    const calculateDistances = (origin, destinations) => {
        if (!window.google || !destinations.length) return;

        try {
            const service = new window.google.maps.DistanceMatrixService();
            const destCoords = destinations
                .filter(p => p.geometry && p.geometry.location)
                .map(p => ({
                    lat: p.geometry.location.lat(),
                    lng: p.geometry.location.lng()
                }));

            if (destCoords.length === 0) return;

            service.getDistanceMatrix(
                {
                    origins: [origin],
                    destinations: destCoords,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (response, status) => {
                    if (status === 'OK' && response) {
                        const results = {};
                        response.rows[0].elements.forEach((element, index) => {
                            if (element && element.status === 'OK') {
                                results[destinations[index].place_id] = {
                                    distance: element.distance.text,
                                    duration: element.duration.text
                                };
                            }
                        });
                        setDistances(results);
                    } else {
                        console.warn("Distance Matrix failed:", status);
                    }
                }
            );
        } catch (err) {
            console.error("Distance calculation failed:", err);
        }
    };

    const onMapClick = React.useCallback((e) => {
        if (readOnly) return;
        const newLocation = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        };
        setMarker(newLocation);
        setNearbyPlaces([]); // Reset nearby when location changes
        onLocationSelect(newLocation);
    }, [onLocationSelect, readOnly]);

    const onSearchLoad = (ref) => {
        searchBoxRef.current = ref;
    };

    const onPlacesChanged = () => {
        const places = searchBoxRef.current.getPlaces();
        if (places && places.length > 0) {
            const place = places[0];
            if (place.geometry && place.geometry.location) {
                const newLocation = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
                setMarker(newLocation);
                setNearbyPlaces([]);
                onLocationSelect(newLocation);

                if (map) {
                    map.panTo(newLocation);
                    map.setZoom(15);
                }
            }
        }
    };

    if (!isLoaded) return (
        <div className="h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Initializing Google Maps...</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {!readOnly && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-3 relative">
                        <StandaloneSearchBox
                            onLoad={onSearchLoad}
                            onPlacesChanged={onPlacesChanged}
                            options={CONFIG.MAP_BOUNDS ? {
                                bounds: CONFIG.MAP_BOUNDS,
                                componentRestrictions: { country: 'np' }
                            } : { componentRestrictions: { country: 'np' } }}
                        >
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search in Dharan, Itahari..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                        </StandaloneSearchBox>
                    </div>
                    <button
                        onClick={findNearbyColleges}
                        disabled={!marker || isSearching}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border-b-2 ${marker
                            ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                            : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                            }`}
                    >
                        {isSearching ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
                        ) : (
                            <GraduationCap className="w-4 h-4" />
                        )}
                        <span>Nearby</span>
                    </button>
                </div>
            )}

            <div className="relative rounded-2xl overflow-hidden shadow-inner border border-gray-100">
                <GoogleMap
                    mapContainerStyle={{
                        ...mapContainerStyle,
                        height: readOnly ? '250px' : '400px'
                    }}
                    zoom={13}
                    center={marker || defaultCenter}
                    onClick={onMapClick}
                    onLoad={onMapLoad}
                    options={{
                        restriction: CONFIG.MAP_BOUNDS ? {
                            latLngBounds: CONFIG.MAP_BOUNDS,
                            strictBounds: false,
                        } : undefined,
                        styles: [
                            { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
                            { "featureType": "poi.park", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] }
                        ],
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        zoomControlOptions: { position: 3 } // TOP_RIGHT
                    }}
                >
                    {/* Main Room Marker */}
                    {marker && (
                        <Marker
                            position={marker}
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                            }}
                            zIndex={100}
                        />
                    )}

                    {/* Nearby College Markers */}
                    {nearbyPlaces.map((place) => (
                        <Marker
                            key={place.place_id}
                            position={{
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            }}
                            onClick={() => setSelectedNearby(place)}
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                            }}
                        />
                    ))}

                    {/* InfoWindow for Nearby Places */}
                    {selectedNearby && (
                        <InfoWindow
                            position={{
                                lat: selectedNearby.geometry.location.lat(),
                                lng: selectedNearby.geometry.location.lng()
                            }}
                            onCloseClick={() => setSelectedNearby(null)}
                        >
                            <div className="p-3 min-w-[200px] bg-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <GraduationCap className="w-4 h-4 text-blue-600" />
                                    <h4 className="font-bold text-gray-900 text-sm">{selectedNearby.name}</h4>
                                </div>
                                {distances[selectedNearby.place_id] && (
                                    <div className="space-y-1.5 border-t pt-2">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-gray-500 uppercase tracking-wider">Distance:</span>
                                            <span className="text-blue-600">{distances[selectedNearby.place_id].distance}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-gray-500 uppercase tracking-wider">Travel Time:</span>
                                            <span className="text-blue-600">{distances[selectedNearby.place_id].duration}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400 bg-gray-50 p-1.5 rounded">
                                    <Info className="w-3 h-3" />
                                    <span>From picked room location</span>
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>

                {/* Legend Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/50 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                            <span className="text-[10px] font-bold text-gray-700 uppercase">Room Location</span>
                        </div>
                        {nearbyPlaces.length > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                                <span className="text-[10px] font-bold text-gray-700 uppercase">Nearby Colleges</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!readOnly && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-xl border border-yellow-100/50">
                    <Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 font-medium leading-relaxed">
                        Search or Click on the map to set your house location. Use the <b>"Nearby"</b> button to automatically find and calculate distances to local colleges.
                    </p>
                </div>
            )}
        </div>
    );
};

export default React.memo(MapPicker);
