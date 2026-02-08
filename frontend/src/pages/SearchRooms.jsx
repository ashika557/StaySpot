import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Wifi, Wind, Tv, Star, ChevronDown, RotateCcw, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
import TenantSidebar from '../components/TenantSidebar';
import TenantHeader from '../components/TenantHeader';
import Footer from '../components/Footer';
import { roomService } from '../services/roomService';
import { GOOGLE_MAPS_API_KEY, CONFIG } from '../constants/config';
import { getMediaUrl } from '../constants/api';
import { useMapContext } from '../context/MapContext';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '16px',
};

const SearchRooms = ({ user }) => {
    const center = CONFIG.DEFAULT_CENTER;
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter States
    const [filters, setFilters] = useState({
        location: '',
        min_price: 0,
        max_price: 100000,
        gender_preference: 'Any',
        room_type: '',
        distance: '',
        facilities: {
            wifi: false, parking: false, water_supply: false,
            kitchen_access: false, furnished: false,
        }
    });


    const mapOptions = React.useMemo(() => ({
        restriction: CONFIG.MAP_BOUNDS ? {
            latLngBounds: CONFIG.MAP_BOUNDS,
            strictBounds: false,
        } : undefined,
        styles: [
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#7c93a3" }]
            },
        ],
        streetViewControl: false,
        mapTypeControl: false,
    }), []);

    const [searchCoords, setSearchCoords] = useState(null);
    const autocompleteRef = React.useRef(null);
    const [map, setMap] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);

    const { isLoaded } = useMapContext();

    const fetchRooms = useCallback(async () => {
        try {
            setLoading(true);

            // Extract radius from distance filter (e.g. '1km' -> 1.0)
            const radius = filters.distance.includes('km')
                ? parseFloat(filters.distance)
                : parseFloat(filters.distance) / 1000;

            // Construct API filters
            const apiFilters = {
                location: filters.location,
                min_price: filters.min_price,
                max_price: filters.max_price,
                gender_preference: filters.gender_preference !== 'Any' ? filters.gender_preference : '',
                room_type: filters.room_type,
                // Add proximity filters
                lat: searchCoords?.lat || '',
                lng: searchCoords?.lng || '',
                radius: searchCoords ? radius : '',
                ...Object.fromEntries(
                    Object.entries(filters.facilities).map(([key, value]) => [key, value ? 'true' : ''])
                )
            };

            const data = await roomService.getAllRooms(apiFilters);
            setRooms(data);
            setError(null);

            // Center map on search coordinates if available
            if (searchCoords && map) {
                map.panTo(searchCoords);
                map.setZoom(14);
            }
        } catch (err) {
            setError('Failed to load rooms. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters, searchCoords, map]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleFacilityChange = (facility) => {
        setFilters(prev => ({
            ...prev,
            facilities: {
                ...prev.facilities,
                [facility]: !prev.facilities[facility]
            }
        }));
    };

    const resetFilters = () => {
        setFilters({
            location: '',
            min_price: 0,
            max_price: 100000,
            gender_preference: 'Any',
            room_type: '',
            distance: '',
            facilities: {
                wifi: false, parking: false, water_supply: false,
                kitchen_access: false, furnished: false,
            }
        });
        setSearchCoords(null);
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place && place.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setSearchCoords({ lat, lng });
                setFilters(prev => ({ ...prev, location: place.formatted_address || place.name }));
            }
        }
    };

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <TenantSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <TenantHeader
                    user={user}
                    title="Search Rooms"
                    subtitle="Find your perfect stay spot"
                    onLogout={() => {
                        localStorage.removeItem('user');
                        window.location.href = '/';
                    }}
                />
                {/* Main Content area */}
                <div className="flex-1 overflow-auto p-8">
                    {/* Filters Section */}
                    <div className="search-filters-card mb-8">
                        <div className="filters-title">Search Filters</div>

                        <div className="filters-grid">
                            {/* Location */}
                            <div className="filter-group">
                                <label>Location</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                    {isLoaded ? (
                                        <Autocomplete
                                            onLoad={ref => autocompleteRef.current = ref}
                                            onPlaceChanged={onPlaceChanged}
                                            options={CONFIG.MAP_BOUNDS ? {
                                                bounds: CONFIG.MAP_BOUNDS,
                                                componentRestrictions: { country: 'np' },
                                                fields: ['geometry', 'formatted_address', 'name']
                                            } : { componentRestrictions: { country: 'np' } }}
                                        >
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition"
                                                placeholder="Search in Dharan or Itahari..."
                                                value={filters.location}
                                                onChange={(e) => handleFilterChange('location', e.target.value)}
                                            />
                                        </Autocomplete>
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition"
                                            placeholder="Enter location..."
                                            value={filters.location}
                                            onChange={(e) => handleFilterChange('location', e.target.value)}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Rent Range */}
                            <div className="filter-group">
                                <label className="flex justify-between">
                                    <span>Rent Range</span>
                                    <span className="text-gray-400 font-normal normal-case">
                                        (Rs. {filters.min_price} - Rs. {filters.max_price})
                                    </span>
                                </label>
                                <div className="price-slider-container">
                                    <input
                                        type="range"
                                        min="0"
                                        max="500000"
                                        step="500"
                                        value={filters.max_price}
                                        onChange={(e) => handleFilterChange('max_price', Number(e.target.value))}
                                        className="price-slider mb-4"
                                    />
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Min Price</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
                                                value={filters.min_price}
                                                onChange={(e) => handleFilterChange('min_price', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Max Price</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
                                                value={filters.max_price}
                                                onChange={(e) => handleFilterChange('max_price', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="filter-group">
                                <label>Gender Preference</label>
                                <div className="relative">
                                    <select
                                        className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none appearance-none focus:border-blue-500 transition"
                                        value={filters.gender_preference}
                                        onChange={(e) => handleFilterChange('gender_preference', e.target.value)}
                                    >
                                        <option value="Any">Any</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Facilities */}
                        <div className="mt-6">
                            <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Facilities</label>
                            <div className="flex flex-wrap gap-x-6 gap-y-3">
                                {Object.entries({
                                    wifi: 'WiFi', parking: 'Parking',
                                    water_supply: 'Water Supply',
                                    kitchen_access: 'Kitchen Access', furnished: 'Furnished'
                                }).map(([key, label]) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                            checked={filters.facilities[key]}
                                            onChange={() => handleFacilityChange(key)}
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-end mt-8 border-t pt-6">
                            <div className="flex gap-8">
                                <div className="">
                                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Room Type</label>
                                    <div className="flex gap-2">
                                        {['Single Room', 'Double Room', 'Shared Room', 'Family Room', 'Apartment'].map(type => (
                                            <button
                                                key={type}
                                                className={`px-4 py-1.5 rounded-full text-[10px] uppercase font-bold border transition ${filters.room_type === type
                                                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                    : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                onClick={() => handleFilterChange('room_type', type)}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="">
                                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Distance</label>
                                    <div className="flex gap-2">
                                        {['500m', '1km', '2km'].map(dist => (
                                            <button
                                                key={dist}
                                                className={`px-4 py-1.5 rounded-full text-sm font-bold border transition ${filters.distance === dist
                                                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                    : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                onClick={() => handleFilterChange('distance', dist)}
                                            >
                                                {dist}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition" onClick={resetFilters}>
                                    <RotateCcw size={18} />
                                    Reset
                                </button>
                                <button className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition" onClick={fetchRooms}>
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results and Map View */}
                    <div className="grid grid-cols-2 gap-8 h-[calc(100vh-450px)] min-h-[500px]">
                        <div className="flex flex-col overflow-hidden">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                Search Results <span className="text-blue-600 text-sm font-bold ml-2">({rooms.length} rooms found)</span>
                            </h2>

                            <div className="flex-1 overflow-auto pr-2 space-y-4">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : rooms.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed">
                                        <p className="text-gray-500 font-medium">No rooms found matching your criteria.</p>
                                    </div>
                                ) : (
                                    rooms.map(room => (
                                        <div key={room.id} className="bg-white rounded-2xl p-4 flex gap-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
                                            <div className="w-40 h-32 rounded-xl overflow-hidden shrink-0">
                                                <img
                                                    src={room.images?.[0]?.image ? getMediaUrl(room.images[0].image) : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop'}
                                                    alt={room.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex flex-col">
                                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition truncate">{room.title}</h3>
                                                            {room.status === 'Rented' && (
                                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded w-fit uppercase">RENTED</span>
                                                            )}

                                                        </div>
                                                        <div className="text-blue-600 font-bold text-sm">NPR {parseFloat(room.price).toLocaleString()}/m</div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                        <MapPin size={12} className="shrink-0" />
                                                        <span className="truncate">{room.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(i => (
                                                                <Star key={i} size={12} fill={i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "none"} color={i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "#D1D5DB"} />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-bold">
                                                            {room.average_rating ? room.average_rating.toFixed(1) : '0.0'} ({room.review_count || 0} reviews)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="text-[10px] text-gray-400 font-medium">Owner: {room.owner?.full_name || 'Rajesh Basnet'}</div>
                                                    <Link to={`/room/${room.id}`} className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-1">
                                                        Details <ChevronRight size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col overflow-hidden">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Map View</h2>
                            <div className="flex-1 rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                                {isLoaded ? (
                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={center}
                                        zoom={13}
                                        onLoad={onLoad}
                                        onUnmount={onUnmount}
                                        options={mapOptions}
                                    >
                                        {rooms.map(room => (
                                            (room.latitude && room.longitude) && (
                                                <Marker
                                                    key={room.id}
                                                    position={{ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) }}
                                                    onClick={() => setSelectedRoom(room)}
                                                    icon={{
                                                        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                                                    }}
                                                    animation={window.google?.maps.Animation.DROP}
                                                />
                                            )
                                        ))}

                                        {selectedRoom && (
                                            <InfoWindow
                                                position={{ lat: parseFloat(selectedRoom.latitude), lng: parseFloat(selectedRoom.longitude) }}
                                                onCloseClick={() => setSelectedRoom(null)}
                                            >
                                                <div className="p-2 min-w-[200px]">
                                                    <img
                                                        src={selectedRoom.images?.[0]?.image ? getMediaUrl(selectedRoom.images[0].image) : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200'}
                                                        className="w-full h-24 object-cover rounded-lg mb-2"
                                                        alt=""
                                                    />
                                                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{selectedRoom.title}</h4>
                                                    <p className="text-blue-600 font-bold text-xs mt-1">NPR {parseFloat(selectedRoom.price).toLocaleString()}/month</p>
                                                    <Link to={`/room/${selectedRoom.id}`} className="block mt-3 text-center py-2 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-100">
                                                        View Details
                                                    </Link>
                                                </div>
                                            </InfoWindow>
                                        )}
                                    </GoogleMap>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <Search size={48} className="mb-4 opacity-20" />
                                        <p className="text-sm font-medium">Google Maps loading...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        </div>
    );
};

const styles = `
.search-rooms-container {
  padding: 0;
  background-color: #f8fafc;
  min-height: 100vh;
  color: #1e293b;
}

.search-rooms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

/* Filters Card */
.search-filters-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.filters-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1e293b;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 12px;
  font-bold: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Price Slider */
.price-slider-container {
  display: flex;
  flex-direction: column;
}

.price-slider {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  appearance: none;
  cursor: pointer;
  margin-top: 8px;
}

.price-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Results and Map Grid */
.rooms-list::-webkit-scrollbar {
  width: 6px;
}

.rooms-list::-webkit-scrollbar-track {
  background: transparent;
}

.rooms-list::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.rooms-list::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.gm-style-iw {
  border-radius: 12px !important;
  padding: 0 !important;
}

.gm-style-iw-d {
  overflow: hidden !important;
}
`;

const SearchRoomsWithStyles = (props) => (
    <>
        <style>{styles}</style>
        <SearchRooms {...props} />
    </>
);

export default SearchRoomsWithStyles;
