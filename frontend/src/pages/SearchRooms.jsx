import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, MapPin, Star, ChevronDown, RotateCcw,
    ChevronRight, MessageCircle, SlidersHorizontal,
    Map, Wifi, Car, Droplets, UtensilsCrossed, Sofa, PawPrint, Home
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Autocomplete } from '@react-google-maps/api';
import { useMapContext } from '../context/MapContext';
import TenantSidebar from '../components/TenantSidebar';
import RoomMap from '../components/RoomMap';
import { roomService } from '../services/roomService';
import { CONFIG } from '../constants/config';
import { getMediaUrl } from '../constants/api';

const SearchRooms = ({ user }) => {
    const { isLoaded } = useMapContext();
    const mapRef = useRef(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [searchCoords, setSearchCoords] = useState(null);
    const [searchInputValue, setSearchInputValue] = useState('');

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

    const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

    const onAutocompleteLoad = (instance) => {
        instance.setFields(['geometry', 'formatted_address', 'name']);
        setAutocomplete(instance);
    };

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (!place.geometry?.location) return;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setSearchCoords({ lat, lng });
            const name = place.formatted_address || place.name;
            setSearchInputValue(name);
            setFilters(prev => ({ ...prev, location: name }));
            if (mapRef.current) { mapRef.current.panTo({ lat, lng }); mapRef.current.setZoom(14); }
        }
    };

    const fetchRooms = useCallback(async () => {
        try {
            setLoading(true);
            const radius = filters.distance.includes('km')
                ? parseFloat(filters.distance)
                : parseFloat(filters.distance) / 1000;
            const apiFilters = {
                location: filters.location,
                min_price: filters.min_price,
                max_price: filters.max_price,
                gender_preference: filters.gender_preference !== 'Any' ? filters.gender_preference : '',
                room_type: filters.room_type,
                lat: searchCoords?.lat || '',
                lng: searchCoords?.lng || '',
                radius: searchCoords ? radius : '',
                ...Object.fromEntries(
                    Object.entries(filters.facilities).map(([k, v]) => [k, v ? 'true' : ''])
                )
            };
            const data = await roomService.getAllRooms(apiFilters);
            setRooms(data);
            setError(null);
            if (searchCoords && mapRef.current) mapRef.current.panTo(searchCoords);
        } catch (err) {
            setError('Failed to load rooms.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters, searchCoords]);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const handleFacilityChange = (f) => setFilters(prev => ({
        ...prev, facilities: { ...prev.facilities, [f]: !prev.facilities[f] }
    }));

    const resetFilters = () => {
        setFilters({
            location: '', min_price: 0, max_price: 100000,
            gender_preference: 'Any', room_type: '', distance: '',
            facilities: { wifi: false, parking: false, water_supply: false, kitchen_access: false, furnished: false }
        });
        setSearchCoords(null);
        setSearchInputValue('');
    };

    const facilityOptions = [
        { key: 'wifi', label: 'WiFi', icon: <Wifi className="w-3.5 h-3.5" /> },
        { key: 'parking', label: 'Parking', icon: <Car className="w-3.5 h-3.5" /> },
        { key: 'water_supply', label: 'Water Supply', icon: <Droplets className="w-3.5 h-3.5" /> },
        { key: 'kitchen_access', label: 'Kitchen', icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
        { key: 'furnished', label: 'Furnished', icon: <Sofa className="w-3.5 h-3.5" /> },
    ];

    const roomTypes = ['Single Room', 'Double Room', 'Shared Room', 'Family Room', 'Apartment'];
    const distances = ['500m', '1km', '2km'];

    return (
        <div className="flex h-screen bg-[#f7f8fc] overflow-hidden">
            <TenantSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-auto">
                <main className="p-7 space-y-6">

                    {/* ─── Page Header ───────────────────────────── */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Search Rooms</h2>
                            <p className="text-sm text-gray-400 mt-0.5">Find your perfect place to stay</p>
                        </div>
                        {!loading && (
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold">
                                {rooms.length} rooms found
                            </div>
                        )}
                    </div>

                    {/* ─── Filter Card ────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        {/* Header */}
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                <SlidersHorizontal className="w-4.5 h-4.5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Search Filters</h3>
                                <p className="text-xs text-gray-400">Narrow down your search</p>
                            </div>
                        </div>

                        {/* Row 1: Location | Price | Gender */}
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            {/* Location */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Location</label>
                                <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search location..."
                                            value={searchInputValue}
                                            onChange={(e) => setSearchInputValue(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
                                        />
                                    </div>
                                </Autocomplete>
                            </div>

                            {/* Price Range */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Rent Range</label>
                                    <span className="text-xs font-bold text-blue-600">
                                        Rs. {filters.min_price.toLocaleString()} – Rs. {filters.max_price.toLocaleString()}
                                    </span>
                                </div>
                                <input
                                    type="range" min="0" max="500000" step="500"
                                    value={filters.max_price}
                                    onChange={(e) => handleFilterChange('max_price', Number(e.target.value))}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 mb-3"
                                    style={{ background: `linear-gradient(to right, #3b82f6 ${(filters.max_price / 500000) * 100}%, #e2e8f0 0%)` }}
                                />
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1.5">Min (Rs.)</p>
                                        <input type="number" min="0" value={filters.min_price}
                                            onChange={(e) => handleFilterChange('min_price', Number(e.target.value))}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1.5">Max (Rs.)</p>
                                        <input type="number" min="0" value={filters.max_price}
                                            onChange={(e) => handleFilterChange('max_price', Number(e.target.value))}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Gender Preference */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Gender Preference</label>
                                <div className="relative">
                                    <select
                                        value={filters.gender_preference}
                                        onChange={(e) => handleFilterChange('gender_preference', e.target.value)}
                                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
                                    >
                                        <option value="Any">Any</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>

                                {/* Gender toggle pills as alternative */}
                                <div className="flex gap-2 mt-3">
                                    {['Any', 'Male', 'Female'].map(g => (
                                        <button key={g} onClick={() => handleFilterChange('gender_preference', g)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                                                filters.gender_preference === g
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >{g}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 mb-6" />

                        {/* Row 2: Facilities */}
                        <div className="mb-6">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Facilities</label>
                            <div className="flex flex-wrap gap-2.5">
                                {facilityOptions.map(({ key, label, icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => handleFacilityChange(key)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition select-none ${
                                            filters.facilities[key]
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                    >
                                        {icon}
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 3: Room Type + Distance + Actions */}
                        <div className="flex flex-wrap items-end justify-between gap-5">
                            <div className="flex flex-wrap gap-8">
                                {/* Room Type */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Room Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {roomTypes.map(type => (
                                            <button key={type}
                                                onClick={() => handleFilterChange('room_type', filters.room_type === type ? '' : type)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                                                    filters.room_type === type
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'
                                                }`}
                                            >{type}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Distance */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Distance</label>
                                    <div className="flex gap-2">
                                        {distances.map(d => (
                                            <button key={d}
                                                onClick={() => handleFilterChange('distance', filters.distance === d ? '' : d)}
                                                className={`px-5 py-2 rounded-xl text-sm font-bold border transition ${
                                                    filters.distance === d
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'
                                                }`}
                                            >{d}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                <button onClick={resetFilters}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 hover:border-gray-300 transition"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                                </button>
                                <button onClick={fetchRooms}
                                    className="flex items-center gap-2 px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition"
                                >
                                    <Search className="w-3.5 h-3.5" /> Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ─── Results + Map ─────────────────────────── */}
                    <div className="grid grid-cols-12 gap-6 pb-6">

                        {/* Room List — col 5 */}
                        <div className="col-span-5 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-gray-900">
                                    Search Results
                                </h3>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                                    {rooms.length} found
                                </span>
                            </div>

                            <div className="space-y-4 overflow-auto max-h-[660px] pr-1 rooms-scrollbar">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                                        <div className="w-9 h-9 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm font-medium">Finding rooms...</p>
                                    </div>
                                ) : rooms.length === 0 ? (
                                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
                                            <MapPin className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-500">No rooms match your criteria</p>
                                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                                    </div>
                                ) : (
                                    rooms.map(room => (
                                        <RoomCard
                                            key={room.id}
                                            room={room}
                                            navigate={navigate}
                                            isSelected={selectedRoom?.id === room.id}
                                            onClick={() => setSelectedRoom(room)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Map — col 7 */}
                        <div className="col-span-7 flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-base font-bold text-gray-900">Interactive Map</h3>
                                <span className="text-xs text-gray-400 font-medium">Click a pin to explore</span>
                            </div>
                            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex-1" style={{ minHeight: '660px' }}>
                                <RoomMap
                                    rooms={rooms}
                                    externalSelectedRoom={selectedRoom}
                                    onRoomClick={setSelectedRoom}
                                />
                            </div>
                        </div>
                    </div>

                </main>
            </div>

            <style>{`
                .rooms-scrollbar::-webkit-scrollbar { width: 5px; }
                .rooms-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .rooms-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
                .rooms-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
};

/* ─── Room Card Component ───────────────────────────────────── */
function RoomCard({ room, navigate, isSelected, onClick }) {
    const imageUrl = room.images?.[0]?.image
        ? getMediaUrl(room.images[0].image)
        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop';

    const isOccupied = room.status === 'Rented' || room.status === 'Occupied';

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                isSelected
                    ? 'border-blue-400 ring-2 ring-blue-100 shadow-md'
                    : 'border-gray-100 hover:border-blue-200'
            }`}
        >
            <div className="flex gap-0">
                {/* Image */}
                <div className="relative w-44 flex-shrink-0 overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={room.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        style={{ minHeight: '160px' }}
                    />
                    {/* Room type badge */}
                    <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-bold text-blue-600 bg-white/90 backdrop-blur px-2 py-1 rounded-lg uppercase tracking-wide shadow-sm">
                            {room.room_type || 'Room'}
                        </span>
                    </div>
                    {/* Occupied overlay */}
                    {isOccupied && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white bg-red-500 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                {room.status}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                    <div>
                        {/* Title + Price */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition line-clamp-1">
                                {room.title}
                            </h3>
                            <div className="text-right flex-shrink-0">
                                <span className="text-blue-600 font-bold text-base">
                                    NPR {parseFloat(room.price).toLocaleString()}
                                </span>
                                <span className="text-gray-400 text-xs font-normal">/mo</span>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-300" />
                            <span className="truncate">{room.location}</span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} size={12}
                                        fill={i <= Math.round(room.average_rating || 0) ? '#FBBF24' : 'none'}
                                        color={i <= Math.round(room.average_rating || 0) ? '#FBBF24' : '#D1D5DB'}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-gray-400 font-medium">
                                {room.average_rating ? room.average_rating.toFixed(1) : '0.0'}
                                <span className="text-gray-300 ml-1">({room.review_count || 0} reviews)</span>
                            </span>
                        </div>

                        {/* Amenity pills */}
                        <div className="flex flex-wrap gap-1.5">
                            {room.wifi && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-lg border border-green-100">
                                    <Wifi className="w-2.5 h-2.5" /> WiFi
                                </span>
                            )}
                            {room.parking && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-lg border border-blue-100">
                                    <Car className="w-2.5 h-2.5" /> Parking
                                </span>
                            )}
                            {room.pets_allowed && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded-lg border border-orange-100">
                                    <PawPrint className="w-2.5 h-2.5" /> Pets OK
                                </span>
                            )}
                            <span className="inline-flex items-center text-[10px] bg-purple-50 text-purple-600 font-bold px-2 py-0.5 rounded-lg border border-purple-100 uppercase">
                                {room.gender_preference || 'Any'}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <p className="text-xs text-gray-400">
                            by <span className="font-semibold text-gray-600">{room.owner?.full_name || 'Unknown'}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (room.owner?.id) navigate(`/messages?userId=${room.owner.id}`);
                                }}
                                title="Message Owner"
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white border border-gray-200 hover:border-blue-600 transition"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>
                            <Link
                                to={`/room/${room.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-200"
                            >
                                View Details <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SearchRooms;