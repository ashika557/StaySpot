import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, StandaloneSearchBox, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { useMapContext } from '../context/MapContext';
import { CONFIG } from '../constants/config';
import { School, MapPin, Coffee, ShoppingCart, Hospital, Building, Landmark, Navigation2, Info, Search, Timer, Route } from 'lucide-react';

const mapContainerStyle = {
    width: '100%',
    height: '650px',
    borderRadius: '20px'
};

const defaultCenter = CONFIG.DEFAULT_CENTER || {
    lat: 26.8124,
    lng: 87.2831
};

const categories = [
    { id: 'atm', label: 'ATM', icon: <Landmark className="w-4 h-4" />, color: 'bg-emerald-500' },
    { id: 'school', label: 'School', icon: <School className="w-4 h-4" />, color: 'bg-blue-500' },
    { id: 'pharmacy', label: 'Pharmacy', icon: <Hospital className="w-4 h-4" />, color: 'bg-red-500' },
    { id: 'cafe', label: 'Cafe/Food', icon: <Coffee className="w-4 h-4" />, color: 'bg-orange-500' },
    { id: 'store', label: 'Stores', icon: <ShoppingCart className="w-4 h-4" />, color: 'bg-amber-500' }
];

const RoomMap = ({ rooms, externalSelectedRoom = null, onRoomClick = null, searchCoords = null }) => {
    const { isLoaded } = useMapContext();
    const navigate = useNavigate();
    const [internalSelectedRoom, setInternalSelectedRoom] = useState(null);
    const [workplace, setWorkplace] = useState(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [map, setMap] = useState(null);
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '' });
    const searchBoxRef = useRef(null);

    // Sync selected room from props
    const selectedRoom = externalSelectedRoom || internalSelectedRoom;

    // Reset nearby places and directions when selected room changes
    useEffect(() => {
        if (selectedRoom) {
            setNearbyPlaces([]);
            setActiveCategory(null);
            setDirectionsResponse(null);
            setRouteInfo({ distance: '', duration: '' });

            if (map && selectedRoom.latitude) {
                map.panTo({ lat: parseFloat(selectedRoom.latitude), lng: parseFloat(selectedRoom.longitude) });
                map.setZoom(17);
            }
        }
    }, [selectedRoom, map]);

    // Handle Directions
    useEffect(() => {
        if (selectedRoom && workplace && window.google) {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: { lat: workplace.lat, lng: workplace.lng },
                    destination: { lat: parseFloat(selectedRoom.latitude), lng: parseFloat(selectedRoom.longitude) },
                    travelMode: window.google.maps.TravelMode.DRIVING
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        setDirectionsResponse(result);
                        setRouteInfo({
                            distance: result.routes[0].legs[0].distance.text,
                            duration: result.routes[0].legs[0].duration.text
                        });
                    } else {
                        console.error(`error fetching directions ${result}`);
                    }
                }
            );
        } else {
            setDirectionsResponse(null);
            setRouteInfo({ distance: '', duration: '' });
        }
    }, [selectedRoom, workplace]);

    // Get current location on mount if possible
    useEffect(() => {
        if (navigator.geolocation && !workplace) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setWorkplace({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        name: 'Your Current Location'
                    });
                },
                (err) => console.log('Geolocation skipped:', err.message)
            );
        }
    }, []);

    const onMapLoad = (mapInstance) => setMap(mapInstance);
    const onSearchLoad = (ref) => searchBoxRef.current = ref;

    // React to searchCoords from parent Filter Box
    useEffect(() => {
        if (map && searchCoords) {
            map.panTo(searchCoords);
            map.setZoom(14);
        }
    }, [map, searchCoords]);

    // Auto-fit bounds when room list shrinks/grows from filters
    useEffect(() => {
        if (map && rooms && rooms.length > 0 && !selectedRoom && !workplace) {
            const bounds = new window.google.maps.LatLngBounds();
            let validRooms = [];
            
            rooms.forEach(room => {
                if (room.latitude && room.longitude) {
                    bounds.extend({ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) });
                    validRooms.push(room);
                }
            });

            if (validRooms.length === 1) {
                map.panTo({ lat: parseFloat(validRooms[0].latitude), lng: parseFloat(validRooms[0].longitude) });
                map.setZoom(16);
            } else if (validRooms.length > 1) {
                map.fitBounds(bounds);
            }
        }
    }, [map, rooms, selectedRoom, workplace]);

    const onPlacesChanged = () => {
        const places = searchBoxRef.current.getPlaces();
        if (places && places.length > 0) {
            const place = places[0];
            const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                name: place.formatted_address || place.name
            };
            setWorkplace(location);
            if (map) {
                map.panTo(location);
                map.setZoom(16);
            }
        }
    };

    const searchNearby = (room, categoryOrKeyword, isKeyword = false) => {
        if (!map || !window.google || !room || !categoryOrKeyword) return;

        setActiveCategory(categoryOrKeyword);
        const roomLocation = new window.google.maps.LatLng(parseFloat(room.latitude), parseFloat(room.longitude));

        const service = new window.google.maps.places.PlacesService(map);
        const request = {
            location: roomLocation,
            radius: isKeyword ? '2000' : '1000'
        };
        
        if (isKeyword) {
            request.keyword = categoryOrKeyword;
        } else {
            request.type = [categoryOrKeyword];
        }

        service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                const formattedPlaces = results.slice(0, 8).map(place => {
                    const placeLoc = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    };
                    const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                        roomLocation,
                        place.geometry.location
                    );
                    return {
                        id: place.place_id,
                        name: place.name,
                        location: placeLoc,
                        distance: (distance / 1000).toFixed(2),
                        rating: place.rating,
                        address: place.vicinity
                    };
                });
                setNearbyPlaces(formattedPlaces);
            } else {
                setNearbyPlaces([]);
            }
        });
    };

    const handleRoomClick = (room) => {
        if (onRoomClick) {
            onRoomClick(room);
        } else {
            setInternalSelectedRoom(room);
        }
    };

    if (!isLoaded) return (
        <div className="h-[600px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-400">Loading Map Engine...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-3 text-blue-600 font-extrabold whitespace-nowrap bg-blue-50 px-5 py-3 rounded-2xl">
                    <Navigation2 className="w-5 h-5 text-blue-600 animate-pulse" />
                    <span className="text-sm">Route Analyzer</span>
                </div>
                <div className="relative flex-1 w-full">
                    <StandaloneSearchBox onLoad={onSearchLoad} onPlacesChanged={onPlacesChanged}>
                        <input
                            type="text"
                            placeholder="Type your Office, College or Destination..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold text-gray-700 placeholder:text-gray-400"
                        />
                    </StandaloneSearchBox>
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                </div>
                {workplace && (
                    <button
                        onClick={() => { setWorkplace(null); setNearbyPlaces([]); setDirectionsResponse(null); }}
                        className="text-red-500 font-bold text-xs bg-red-50 px-4 py-3 rounded-2xl hover:bg-red-100 transition whitespace-nowrap"
                    >
                        Clear Location
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Map Area */}
                <div className="lg:col-span-3 relative rounded-[32px] overflow-hidden shadow-2xl shadow-blue-900/10 border border-gray-100 group">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        zoom={15}
                        center={defaultCenter}
                        onLoad={onMapLoad}
                        options={{
                            mapTypeControl: false,
                            streetViewControl: true,
                            fullscreenControl: false,
                            styles: [
                                {
                                    "featureType": "poi",
                                    "elementType": "labels",
                                    "stylers": [{ "visibility": "off" }]
                                }
                            ]
                        }}
                    >
                        {rooms?.map((room) => (
                            room.latitude && room.longitude && (
                                <Marker
                                    key={room.id}
                                    position={{ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) }}
                                    onClick={() => handleRoomClick(room)}
                                    icon={{
                                        url: selectedRoom?.id === room.id
                                            ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                                            : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                                    }}
                                />
                            )
                        ))}

                        {searchCoords && (
                            <Marker
                                position={searchCoords}
                                icon={{
                                    url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                                }}
                            />
                        )}

                        {nearbyPlaces?.map((place) => (
                            <Marker
                                key={place.id}
                                position={place.location}
                                icon={{
                                    url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                    scaledSize: new window.google.maps.Size(30, 30)
                                }}
                            />
                        ))}

                        {workplace && (
                            <Marker
                                position={{ lat: workplace.lat, lng: workplace.lng }}
                                icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-pushpin.png' }}
                            />
                        )}

                        {directionsResponse && (
                            <DirectionsRenderer
                                directions={directionsResponse}
                                options={{
                                    polylineOptions: {
                                        strokeColor: '#2563eb',
                                        strokeOpacity: 0.8,
                                        strokeWeight: 6,
                                    },
                                    markerOptions: { visible: false } // We use our own markers
                                }}
                            />
                        )}

                        {selectedRoom && (
                            <InfoWindow
                                position={{ lat: parseFloat(selectedRoom.latitude), lng: parseFloat(selectedRoom.longitude) }}
                                onCloseClick={() => {
                                    if (onRoomClick) onRoomClick(null);
                                    else setInternalSelectedRoom(null);
                                }}
                            >
                                <div className="p-3 w-64 overflow-hidden rounded-xl">
                                    {selectedRoom.images?.[0] && (
                                        <img
                                            src={selectedRoom.images[0].image}
                                            className="w-full h-32 object-cover rounded-xl mb-3"
                                            alt={selectedRoom.title}
                                        />
                                    )}
                                    <h4 className="font-extrabold text-gray-900 text-sm leading-tight">{selectedRoom.title}</h4>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-blue-600 font-extrabold text-sm">NPR {selectedRoom.price}</p>
                                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                            <MapPin size={10} /> {selectedRoom.location?.split(',')[0]}
                                        </span>
                                    </div>

                                    {routeInfo.distance && (
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                                <Navigation2 className="w-3 h-3 text-blue-600" />
                                                <span className="text-[10px] font-bold text-blue-800">
                                                    {routeInfo.distance} via Road
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                                <Timer className="w-3 h-3 text-emerald-600" />
                                                <span className="text-[10px] font-bold text-emerald-800">
                                                    approx. {routeInfo.duration} travel
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => navigate(`/room/${selectedRoom.id}`)}
                                        className="w-full mt-3 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
                                    >
                                        Detailed View
                                    </button>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>

                    {/* Route Summary Overlay */}
                    {routeInfo.distance && selectedRoom && (
                        <div className="absolute bottom-28 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom duration-500 z-[1000]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <Route className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Road Connection</p>
                                    <h4 className="font-extrabold text-gray-900 text-sm">From {workplace.name?.split(',')[0]} to Room</h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 pr-4">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Distance</p>
                                    <p className="text-lg font-black text-blue-600 leading-none">{routeInfo.distance}</p>
                                </div>
                                <div className="w-px h-8 bg-gray-100" />
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Est. Time</p>
                                    <p className="text-lg font-black text-emerald-600 leading-none">{routeInfo.duration}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Nearby Category Picker Overlay */}
                    {selectedRoom && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/50 gap-2 z-[1000] animate-in slide-in-from-top duration-500 max-w-[90%] overflow-x-auto no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => searchNearby(selectedRoom, cat.id, false)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap ${activeCategory === cat.id
                                        ? `${cat.color} text-white shadow-lg`
                                        : 'bg-white text-gray-600 hover:bg-gray-100 font-extrabold'
                                        }`}
                                >
                                    {cat.icon}
                                    <span className="text-xs">{cat.label}</span>
                                </button>
                            ))}
                            <div className="flex items-center bg-white/80 rounded-xl border border-gray-200 overflow-hidden ml-2 h-10 min-w-40">
                                <input 
                                    type="text"
                                    placeholder="Type (e.g. Gym)"
                                    className="w-full px-3 py-2 text-xs font-bold text-gray-700 bg-transparent focus:outline-none placeholder-gray-400"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            searchNearby(selectedRoom, e.target.value.trim(), true);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <div className="px-3 text-gray-400 bg-gray-50 h-full flex items-center border-l border-gray-200">
                                    <Search className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Legend Overlay */}
                    <div className="absolute bottom-6 left-6 bg-gray-900/90 backdrop-blur-sm p-4 rounded-2xl shadow-2xl space-y-3 z-[1000] border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full ring-4 ring-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                            <span className="text-[10px] font-extrabold text-white tracking-widest uppercase">Listed Rooms</span>
                        </div>
                        {workplace && (
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                <span className="text-[10px] font-extrabold text-white tracking-widest uppercase">Target Location</span>
                            </div>
                        )}
                        {routeInfo.distance && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-1 bg-blue-600 rounded-full shadow-[0_0_5px_rgba(37,99,235,0.8)]"></div>
                                <span className="text-[10px] font-extrabold text-white tracking-widest uppercase">Road Route</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nearby Places Cards */}
                <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100 overflow-y-auto max-h-[650px] space-y-4">
                    <h3 className="font-extrabold text-gray-900 flex items-center gap-2 mb-2">
                        <Building className="w-5 h-5 text-blue-600" />
                        Surrounding Hubs
                    </h3>

                    {!selectedRoom ? (
                        <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center mt-4">
                            <Info className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-400 leading-relaxed italic">
                                Select a room to view road distance and available routes.
                            </p>
                        </div>
                    ) : nearbyPlaces.length > 0 ? (
                        <div className="space-y-3">
                            {nearbyPlaces.map((place) => (
                                <div
                                    key={place.id}
                                    onClick={() => map.panTo(place.location)}
                                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
                                >
                                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">{place.name}</h4>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-1 text-blue-600 font-extrabold">
                                            <Navigation2 className="w-3 h-3" />
                                            <span className="text-xs">{place.distance} km</span>
                                        </div>
                                        {place.rating && (
                                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">
                                                ★ {place.rating}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 line-clamp-1 italic font-medium">{place.address}</p>
                                </div>
                            ))}
                        </div>
                    ) : activeCategory ? (
                        <div className="text-center py-10">
                            <p className="text-sm font-bold text-gray-400">No {activeCategory}s found nearby.</p>
                        </div>
                    ) : (
                        <div className="bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-3xl p-8 text-center">
                            <Landmark className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-blue-600 leading-relaxed">
                                Pick a category above the map to scan the local area!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(RoomMap);
