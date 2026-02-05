import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, StandaloneSearchBox } from '@react-google-maps/api';
import { MapPin, Navigation, School, Briefcase, Info } from 'lucide-react';
import { useMapContext } from '../context/MapContext';

import { GOOGLE_MAPS_API_KEY } from '../constants/config';

const mapContainerStyle = {
    width: '100%',
    height: '600px',
    borderRadius: '16px'
};

const defaultCenter = {
    lat: 26.8124,
    lng: 87.2831
};

const RoomMap = ({ rooms }) => {
    const { isLoaded } = useMapContext();

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [workplace, setWorkplace] = useState(null);
    const [distances, setDistances] = useState({});
    const [map, setMap] = useState(null);
    const searchBoxRef = useRef(null);

    const onMapLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
    }, []);

    const onSearchLoad = (ref) => {
        searchBoxRef.current = ref;
    };

    const onPlacesChanged = () => {
        const places = searchBoxRef.current.getPlaces();
        if (places && places.length > 0) {
            const place = places[0];
            const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                name: place.name
            };
            setWorkplace(location);
            calculateDistances(location);

            if (map) {
                map.panTo(location);
                map.setZoom(15);
            }
        }
    };

    const calculateDistances = (origin) => {
        if (!window.google || !rooms.length) return;

        const service = new window.google.maps.DistanceMatrixService();
        const destinations = rooms
            .filter(r => r.latitude && r.longitude)
            .map(r => ({ lat: parseFloat(r.latitude), lng: parseFloat(r.longitude) }));

        if (destinations.length === 0) return;

        service.getDistanceMatrix(
            {
                origins: [origin],
                destinations: destinations,
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
                if (status === 'OK') {
                    const results = {};
                    const roomList = rooms.filter(r => r.latitude && r.longitude);
                    response.rows[0].elements.forEach((element, index) => {
                        if (element.status === 'OK') {
                            results[roomList[index].id] = {
                                distance: element.distance.text,
                                duration: element.duration.text
                            };
                        }
                    });
                    setDistances(results);
                }
            }
        );
    };

    if (!isLoaded) return <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-2xl">Loading Map...</div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-blue-600 font-bold whitespace-nowrap">
                    <School className="w-5 h-5" />
                    <span>Distance From:</span>
                </div>
                <div className="relative flex-1 w-full">
                    <StandaloneSearchBox
                        onLoad={onSearchLoad}
                        onPlacesChanged={onPlacesChanged}
                    >
                        <input
                            type="text"
                            placeholder="Enter your College, Workplace or Location..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </StandaloneSearchBox>
                    <Navigation className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
                {workplace && (
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold animate-in fade-in zoom-in duration-300">
                        Selected: {workplace.name}
                    </div>
                )}
            </div>

            <div className="relative">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={13}
                    center={defaultCenter}
                    onLoad={onMapLoad}
                    options={{
                        styles: [
                            {
                                "featureType": "poi",
                                "elementType": "labels",
                                "stylers": [{ "visibility": "simplified" }]
                            }
                        ],
                        mapTypeControl: false,
                        streetViewControl: false
                    }}
                >
                    {rooms.map((room) => (
                        room.latitude && room.longitude && (
                            <Marker
                                key={room.id}
                                position={{ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) }}
                                onClick={() => setSelectedRoom(room)}
                                icon={{
                                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                                }}
                            />
                        )
                    ))}

                    {workplace && (
                        <Marker
                            position={{ lat: workplace.lat, lng: workplace.lng }}
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/red-pushpin.png'
                            }}
                        />
                    )}

                    {selectedRoom && (
                        <InfoWindow
                            position={{ lat: parseFloat(selectedRoom.latitude), lng: parseFloat(selectedRoom.longitude) }}
                            onCloseClick={() => setSelectedRoom(null)}
                        >
                            <div className="p-2 max-w-[200px]">
                                <img
                                    src={selectedRoom.images?.[0]?.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200'}
                                    className="w-full h-24 object-cover rounded-lg mb-2"
                                    alt=""
                                />
                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{selectedRoom.title}</h4>
                                <p className="text-blue-600 font-bold text-xs mt-1">₹{selectedRoom.price}/month</p>
                                {distances[selectedRoom.id] && (
                                    <div className="mt-2 pt-2 border-t flex flex-col gap-0.5">
                                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                            <span>DISTANCE:</span>
                                            <span className="text-blue-600">{distances[selectedRoom.id].distance}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                            <span>TIME:</span>
                                            <span className="text-blue-600">{distances[selectedRoom.id].duration}</span>
                                        </div>
                                    </div>
                                )}
                                <button className="w-full mt-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-md">
                                    View Details
                                </button>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>

                {/* Legend */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-white/50 space-y-2 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Available Rooms</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Your Location</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(RoomMap);
