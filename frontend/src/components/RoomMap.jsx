import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, StandaloneSearchBox } from '@react-google-maps/api';
import { useMapContext } from '../context/MapContext';
import { CONFIG } from '../constants/config';
import { School, MapPin, Coffee, ShoppingCart, Hospital, Building, Landmark, Navigation2, Info } from 'lucide-react';

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

const RoomMap = ({ rooms, externalSelectedRoom = null, onRoomClick = null }) => {
    const { isLoaded } = useMapContext();
    const [internalSelectedRoom, setInternalSelectedRoom] = useState(null);
    const [workplace, setWorkplace] = useState(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [map, setMap] = useState(null);
    const searchBoxRef = useRef(null);

    // Sync selected room from props
    const selectedRoom = externalSelectedRoom || internalSelectedRoom;

    // Reset nearby places when selected room changes
    useEffect(() => {
        if (selectedRoom) {
            setNearbyPlaces([]);
            setActiveCategory(null);
            if (map && selectedRoom.latitude) {
                map.panTo({ lat: parseFloat(selectedRoom.latitude), lng: parseFloat(selectedRoom.longitude) });
                map.setZoom(17);
            }
        }
    }, [selectedRoom, map]);

    const onMapLoad = (mapInstance) => setMap(mapInstance);
    const onSearchLoad = (ref) => searchBoxRef.current = ref;

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
            if (map) {
                map.panTo(location);
                map.setZoom(16);
            }
        }
    };

    const searchNearby = (room, category) => {
        if (!map || !window.google || !room) return;

        setActiveCategory(category);
        const roomLocation = new window.google.maps.LatLng(parseFloat(room.latitude), parseFloat(room.longitude));

        const service = new window.google.maps.places.PlacesService(map);
        const request = {
            location: roomLocation,
            radius: '1000',
            type: [category]
        };

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

    // Calculate distance from workplace to selected room
    const getWorkplaceDistance = (room) => {
        if (!workplace || !room || !window.google) return null;
        const roomLoc = new window.google.maps.LatLng(parseFloat(room.latitude), parseFloat(room.longitude));
        const workLoc = new window.google.maps.LatLng(workplace.lat, workplace.lng);
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(roomLoc, workLoc);
        return (distance / 1000).toFixed(2);
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
                    <Navigation2 className="w-5 h-5" />
                    <span className="text-sm">Distance Finder</span>
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
                        onClick={() => { setWorkplace(null); setNearbyPlaces([]); }}
                        className="text-red-500 font-bold text-xs bg-red-50 px-4 py-3 rounded-2xl hover:bg-red-100 transition"
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
                                    <p className="text-blue-600 font-extrabold text-sm mt-1">NPR {selectedRoom.price}</p>

                                    {workplace && (
                                        <div className="mt-3 flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                            <Navigation2 className="w-3 h-3 text-blue-600" />
                                            <span className="text-[10px] font-bold text-blue-800">
                                                {getWorkplaceDistance(selectedRoom)} km to {workplace.name.split(',')[0]}
                                            </span>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => (window.location.href = `/room/${selectedRoom.id}`)}
                                        className="w-full mt-3 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
                                    >
                                        Detailed View
                                    </button>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>

                    {/* Nearby Category Picker Overlay */}
                    {selectedRoom && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/50 gap-2 z-[1000] animate-in slide-in-from-top duration-500">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => searchNearby(selectedRoom, cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${activeCategory === cat.id
                                        ? `${cat.color} text-white shadow-lg`
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {cat.icon}
                                    <span className="text-xs font-extrabold">{cat.label}</span>
                                </button>
                            ))}
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
                                <span className="text-[10px] font-extrabold text-white tracking-widest uppercase">Your Target</span>
                            </div>
                        )}
                        {nearbyPlaces.length > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[10px] font-extrabold text-white tracking-widest uppercase">Nearby {activeCategory}s</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nearby Places Cards */}
                <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100 overflow-y-auto max-h-[650px] space-y-4">
                    <h3 className="font-extrabold text-gray-900 flex items-center gap-2 mb-2">
                        <Building className="w-5 h-5 text-blue-600" />
                        Explore Nearby
                    </h3>

                    {!selectedRoom ? (
                        <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center">
                            <Info className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-400 leading-relaxed italic">
                                Select a room to explore distances to schools, ATMs, and more.
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
                        <div className="bg-blue-50 border-2 border-dashed border-blue-100 rounded-3xl p-8 text-center">
                            <Landmark className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-blue-500 leading-relaxed">
                                Pick a category above the map to see how far they are!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(RoomMap);
