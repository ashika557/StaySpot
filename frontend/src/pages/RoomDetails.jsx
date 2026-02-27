import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Wifi, Wind, Tv, Star, User, Calendar, ShieldCheck, ArrowLeft, Loader, Utensils, Hospital, ShoppingBag, School, Navigation, Info, Cigarette, Dog, Users, Beer, UtensilsCrossed, Zap, Droplets, Car, Layout, ChefHat } from 'lucide-react';
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useMapContext } from '../context/MapContext';
import OwnerSidebar from '../components/OwnerSidebar';
import TenantSidebar from '../components/TenantSidebar';
import TenantHeader from '../components/TenantHeader';
import { roomService } from '../services/roomService';
import { bookingService } from '../services/bookingService';
import { visitService } from '../services/tenantService';
import { getMediaUrl, ROUTES } from '../constants/api';
import { CONFIG } from '../constants/config';

// Icons will be defined inside component or safely updated
const ICON_BASE_URL = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/';

const RoomDetails = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isLoaded } = useMapContext();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingEndDate, setBookingEndDate] = useState('');
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const viewTracked = React.useRef(false); // prevent double-count in StrictMode

    // Visit Request State
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitDate, setVisitDate] = useState('');
    const [visitTime, setVisitTime] = useState('');
    const [visitNote, setVisitNote] = useState('');

    const fetchCurrentlyNearbyPlaces = async (lat, lng) => {
        // Use Overpass API to get nearby amenities
        const query = `
            [out:json];
            (
              node["amenity"="restaurant"](around:2000, ${lat}, ${lng});
              node["amenity"="cafe"](around:2000, ${lat}, ${lng});
              node["amenity"="hospital"](around:2000, ${lat}, ${lng});
              node["amenity"="school"](around:2000, ${lat}, ${lng});
              node["shop"="supermarket"](around:2000, ${lat}, ${lng});
              node["shop"="mall"](around:2000, ${lat}, ${lng});
            );
            out body 20;
        `;
        try {
            const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const data = await response.json();
            const places = data.elements.map(element => ({
                id: element.id,
                name: element.tags.name || 'Unknown Place',
                lat: element.lat,
                lon: element.lon,
                type: element.tags.amenity || element.tags.shop || 'unknown',
                address: element.tags['addr:street'] ? `${element.tags['addr:street']}, ${element.tags['addr:city'] || ''}` : 'Nearby',
                rating: (Math.random() * 2 + 3).toFixed(1) // Mock rating
            }));
            setNearbyPlaces(places);
        } catch (error) {
            console.error("Error fetching nearby places:", error);
        }
    };

    const fetchRoomDetails = async () => {
        try {
            setLoading(true);
            const data = await roomService.getRoomById(id);
            setRoom(data);
            if (data.latitude && data.longitude) {
                fetchCurrentlyNearbyPlaces(data.latitude, data.longitude);
            }
            // Track view once per page load — guard against React StrictMode double-invoke
            if (!viewTracked.current && (!user || user.id !== data.owner?.id)) {
                viewTracked.current = true;
                roomService.incrementViews(id);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load room details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        viewTracked.current = false; // reset when room id changes
        fetchRoomDetails();
    }, [id]);

    const handleBooking = async (e) => {
        e.preventDefault();
        try {
            await bookingService.createBooking({
                room_id: room.id,
                start_date: bookingDate,
                end_date: bookingEndDate,
                monthly_rent: room.price
            });
            alert("Booking request sent successfully!");
            setShowBookingModal(false);
        } catch (err) {
            console.error(err);
            const errorMessage = err.message || "Failed to book room";
            if (errorMessage.toLowerCase().includes('verification') || errorMessage.toLowerCase().includes('identity')) {
                if (window.confirm(`${errorMessage}\n\nWould you like to verify your identity now?`)) {
                    navigate(ROUTES.VERIFICATION_REQUEST);
                }
            } else {
                alert(errorMessage);
            }
        }
    };

    const handleVisitRequest = async (e) => {
        e.preventDefault();
        try {
            await visitService.createVisit({
                room_id: room.id,
                owner_id: room.owner.id,
                visit_date: visitDate,
                visit_time: visitTime,
                purpose: 'Room Viewing',
                notes: visitNote
            });
            alert("Visit request scheduled successfully!");
            setShowVisitModal(false);
            setVisitDate('');
            setVisitTime('');
            setVisitNote('');
        } catch (err) {
            console.error(err);
            const errorMessage = err.message || "Failed to schedule visit";
            if (errorMessage.toLowerCase().includes('verification') || errorMessage.toLowerCase().includes('identity')) {
                if (window.confirm(`${errorMessage}\n\nWould you like to verify your identity now?`)) {
                    navigate(ROUTES.VERIFICATION_REQUEST);
                }
            } else {
                alert(errorMessage);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500 font-bold">{error || "Room not found"}</p>
                <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    const amenitiesList = room.amenities ? room.amenities.split(',').map(a => a.trim()).filter(a => a) : [];

    // Add boolean amenities if they are true
    if (room.wifi) amenitiesList.push("Free Wi-Fi");
    if (room.parking) amenitiesList.push("Parking");
    if (room.water_supply) amenitiesList.push("24/7 Water Supply");
    if (room.electricity_backup && room.electricity_backup !== 'None') amenitiesList.push(`Backup: ${room.electricity_backup}`);
    if (room.furnished) amenitiesList.push("Furnished");
    if (room.kitchen_access) amenitiesList.push("Kitchen Access");

    // Helper to get icon object
    const getIcon = (type) => {
        let color = 'blue';
        if (type.includes('restaurant') || type.includes('food')) color = 'orange';
        else if (type.includes('hospital') || type.includes('health')) color = 'green';
        else if (type.includes('shopping')) color = 'violet';
        else if (type === 'main') color = 'red';

        if (window.google) {
            return {
                url: `${ICON_BASE_URL}marker-icon-2x-${color}.png`,
                scaledSize: new window.google.maps.Size(25, 41)
            };
        }
        return null;
    };

    // Helper for labels
    const getLabel = (type) => {
        if (!window.google) return null;
        let labelIcon = '•';
        if (type.includes('restaurant') || type.includes('food')) labelIcon = '🍽️';
        else if (type.includes('hospital')) labelIcon = '🏥';
        else if (type.includes('shopping')) labelIcon = '🛍️';
        else if (type === 'main') labelIcon = '🏠';

        return {
            text: labelIcon,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
        };
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Dynamic Sidebar/Navbar based on role */}
            {user?.role === 'Tenant' ? (
                <>
                    <TenantHeader user={user} />
                    <div className="flex">
                        <TenantSidebar user={user} />
                        <main className="flex-1 p-8 ml-64 mt-16">
                            {renderContent()}
                        </main>
                    </div>
                </>
            ) : (
                <div className="flex">
                    <OwnerSidebar user={user} />
                    <main className="flex-1 p-8 ml-64">
                        {renderContent()}
                    </main>
                </div>
            )}
            {/* Modals */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md m-4">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Book {room.title}</h3>
                        <form onSubmit={handleBooking} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Move-out Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={bookingEndDate}
                                    onChange={(e) => setBookingEndDate(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    className="flex-1 px-4 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showVisitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md m-4">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Schedule a Visit</h3>
                        <form onSubmit={handleVisitRequest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={visitDate}
                                    onChange={(e) => setVisitDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={visitTime}
                                    onChange={(e) => setVisitTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                                <textarea
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                    value={visitNote}
                                    onChange={(e) => setVisitNote(e.target.value)}
                                    placeholder="Any specific questions or preferences..."
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowVisitModal(false)}
                                    className="flex-1 px-4 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Schedule Visit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    function renderContent() {
        return (
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors w-fit px-4 py-2 hover:bg-white rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Listings
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Images & Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery */}
                        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 relative group">
                                <img
                                    src={getMediaUrl(room.images[activeImageIndex]?.image)}
                                    alt={room.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/800x600?text=Room+Image';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {room.images && room.images.length > 1 && (
                                <div className="grid grid-cols-5 gap-2 mt-2 px-2 pb-2">
                                    {room.images.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveImageIndex(index)}
                                            className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === index
                                                ? 'border-blue-600 ring-2 ring-blue-100'
                                                : 'border-transparent opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            <img
                                                src={getMediaUrl(img.image)}
                                                alt={`View ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Title & Price Header */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${room.status === 'Available'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'bg-orange-50 text-orange-700'
                                            }`}>
                                            {room.status}
                                        </span>
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="text-sm font-bold text-gray-900">4.8</span>
                                            <span className="text-gray-400 text-xs">(24 reviews)</span>
                                        </div>
                                    </div>
                                    <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{room.title}</h1>
                                    <p className="flex items-center gap-2 text-gray-500 font-medium">
                                        <MapPin className="w-4 h-4 text-blue-500" />
                                        {room.location}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-blue-600">
                                        NPR {parseFloat(room.price).toLocaleString()}
                                    </div>
                                    <p className="text-gray-400 text-sm font-medium">per month</p>
                                </div>
                            </div>

                            <hr className="my-8 border-gray-100" />

                            {/* Property Spec Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Floor</p>
                                    <p className="font-bold text-gray-900">{room.floor || 'Not Specified'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Room Size</p>
                                    <p className="font-bold text-gray-900">{room.size || 'Medium'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Toilet Type</p>
                                    <p className="font-bold text-gray-900">{room.toilet_type || 'Shared'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Deposit</p>
                                    <p className="font-bold text-blue-600">NPR {parseFloat(room.deposit || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Amenities */}
                            <div className="mb-8">
                                <h3 className="font-bold text-gray-900 mb-4 px-2">Amenities</h3>
                                <div className="flex flex-wrap gap-3">
                                    {amenitiesList.map((amenity, index) => (
                                        <div key={index} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl text-gray-700 font-bold text-sm border border-gray-100">
                                            {amenity.toLowerCase().includes('wifi') && <Wifi className="w-4 h-4 text-blue-500" />}
                                            {amenity.toLowerCase().includes('tv') && <Tv className="w-4 h-4 text-blue-500" />}
                                            {amenity.toLowerCase().includes('ac') && <Wind className="w-4 h-4 text-blue-500" />}
                                            {amenity.toLowerCase().includes('parking') && <Car className="w-4 h-4 text-blue-500" />}
                                            {amenity.toLowerCase().includes('water') && <Droplets className="w-4 h-4 text-blue-500" />}
                                            {(amenity.toLowerCase().includes('backup') || amenity.toLowerCase().includes('electricity')) && <Zap className="w-4 h-4 text-blue-500" />}
                                            {amenity.toLowerCase().includes('furnished') && <Layout className="w-4 h-4 text-blue-500" />}
                                            {amenity.toLowerCase().includes('kitchen') && <ChefHat className="w-4 h-4 text-blue-500" />}
                                            <span>{amenity.trim()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-6">
                            <h3 className="font-bold text-gray-900 mb-4">Description</h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                {room.description}
                            </p>
                        </div>

                        {/* House Rules Section */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-600" />
                                House Rules & Policies
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`flex items-center justify-between p-4 rounded-2xl border ${room.cooking_allowed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <UtensilsCrossed className={`w-5 h-5 ${room.cooking_allowed ? 'text-green-600' : 'text-red-600'}`} />
                                        <span className={`font-bold text-sm ${room.cooking_allowed ? 'text-green-800' : 'text-red-800'}`}>Cooking</span>
                                    </div>
                                    <span className={`text-xs font-black uppercase ${room.cooking_allowed ? 'text-green-600' : 'text-red-600'}`}>
                                        {room.cooking_allowed ? 'Allowed' : 'Not Allowed'}
                                    </span>
                                </div>
                                <div className={`flex items-center justify-between p-4 rounded-2xl border ${room.smoking_allowed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <Cigarette className={`w-5 h-5 ${room.smoking_allowed ? 'text-green-600' : 'text-red-600'}`} />
                                        <span className={`font-bold text-sm ${room.smoking_allowed ? 'text-green-800' : 'text-red-800'}`}>Smoking</span>
                                    </div>
                                    <span className={`text-xs font-black uppercase ${room.smoking_allowed ? 'text-green-600' : 'text-red-600'}`}>
                                        {room.smoking_allowed ? 'Allowed' : 'Not Allowed'}
                                    </span>
                                </div>
                                <div className={`flex items-center justify-between p-4 rounded-2xl border ${room.pets_allowed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <Dog className={`w-5 h-5 ${room.pets_allowed ? 'text-green-600' : 'text-red-600'}`} />
                                        <span className={`font-bold text-sm ${room.pets_allowed ? 'text-green-800' : 'text-red-800'}`}>Pets</span>
                                    </div>
                                    <span className={`text-xs font-black uppercase ${room.pets_allowed ? 'text-green-600' : 'text-red-600'}`}>
                                        {room.pets_allowed ? 'Allowed' : 'Not Allowed'}
                                    </span>
                                </div>
                                <div className={`flex items-center justify-between p-4 rounded-2xl border ${room.visitor_allowed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <Users className={`w-5 h-5 ${room.visitor_allowed ? 'text-green-600' : 'text-red-600'}`} />
                                        <span className={`font-bold text-sm ${room.visitor_allowed ? 'text-green-800' : 'text-red-800'}`}>Visitors</span>
                                    </div>
                                    <span className={`text-xs font-black uppercase ${room.visitor_allowed ? 'text-green-600' : 'text-red-600'}`}>
                                        {room.visitor_allowed ? 'Allowed' : 'Not Allowed'}
                                    </span>
                                </div>
                                <div className={`flex items-center justify-between p-4 rounded-2xl border ${room.drinking_allowed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <Beer className={`w-5 h-5 ${room.drinking_allowed ? 'text-green-600' : 'text-red-600'}`} />
                                        <span className={`font-bold text-sm ${room.drinking_allowed ? 'text-green-800' : 'text-red-800'}`}>Drinking</span>
                                    </div>
                                    <span className={`text-xs font-black uppercase ${room.drinking_allowed ? 'text-green-600' : 'text-red-600'}`}>
                                        {room.drinking_allowed ? 'Allowed' : 'Not Allowed'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Booking & Map */}
                    <div className="space-y-6">
                        {/* Action Card */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                                    {room.owner_name ? room.owner_name[0] : <User className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Listed by</p>
                                    <p className="font-bold text-gray-900">{room.owner_name || 'Owner'}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    disabled={room.status !== 'Available'}
                                    className={`w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${room.status === 'Available'
                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 active:scale-[0.98]'
                                        : 'bg-gray-400 cursor-not-allowed shadow-gray-400/20'
                                        }`}
                                >
                                    <Calendar className="w-5 h-5" />
                                    {room.status === 'Available' ? 'Request to Book' : `Currently ${room.status}`}
                                </button>
                                <button
                                    onClick={() => setShowVisitModal(true)}
                                    className="w-full py-4 bg-white text-gray-900 border-2 border-gray-100 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <ShieldCheck className="w-5 h-5 text-gray-400" />
                                    Schedule Visit
                                </button>
                            </div>
                        </div>

                        {/* Map Configuration */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 px-2 tracking-tight">Location & Surroundings</h3>
                            {room.latitude && isLoaded ? (
                                <div className="space-y-4">
                                    <div className="h-80 rounded-xl overflow-hidden border border-gray-100 relative z-0">
                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '100%' }}
                                            center={{ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) }}
                                            zoom={14}
                                            options={{
                                                disableDefaultUI: true,
                                                zoomControl: true,
                                                scrollwheel: false
                                            }}
                                        >
                                            {/* Room Marker */}
                                            <Marker
                                                position={{ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) }}
                                                icon={getIcon('main')}
                                                label={getLabel('main')}
                                                zIndex={100}
                                            />

                                            {/* Radius Circle */}
                                            <Circle
                                                center={{ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) }}
                                                radius={2000}
                                                options={{
                                                    fillColor: '#3B82F6',
                                                    fillOpacity: 0.08,
                                                    strokeColor: '#3B82F6',
                                                    strokeOpacity: 0.3,
                                                    strokeWeight: 1,
                                                    clickable: false
                                                }}
                                            />

                                            {/* Nearby Places Markers */}
                                            {nearbyPlaces.map(place => (
                                                <Marker
                                                    key={place.id}
                                                    position={{ lat: place.lat, lng: place.lon }}
                                                    icon={getIcon(place.type)}
                                                    label={getLabel(place.type)}
                                                    title={place.name}
                                                />
                                            ))}
                                        </GoogleMap>
                                    </div>

                                    {/* Nearby Places List */}
                                    <div className="mt-6 pt-6 border-t border-gray-50">
                                        <h4 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                            <Navigation className="w-3.5 h-3.5 text-blue-500" />
                                            Surroundings (Within 2KM)
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {nearbyPlaces.length > 0 ? (
                                                nearbyPlaces.map(place => (
                                                    <div key={place.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300 group">
                                                        <div className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:border-blue-100 transition-colors">
                                                            {place.type.includes('restaurant') || place.type.includes('food') ? <Utensils className="w-4 h-4 text-orange-500" /> :
                                                                place.type.includes('hospital') || place.type.includes('health') ? <Hospital className="w-4 h-4 text-red-500" /> :
                                                                    place.type.includes('shopping') ? <ShoppingBag className="w-4 h-4 text-blue-500" /> :
                                                                        place.type.includes('school') || place.type.includes('university') ? <School className="w-4 h-4 text-indigo-500" /> :
                                                                            <MapPin className="w-4 h-4 text-gray-400" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h5 className="font-bold text-gray-900 text-xs truncate">{place.name}</h5>
                                                                {place.rating && (
                                                                    <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                                                        <Star className="w-2.5 h-2.5 fill-current" />
                                                                        {place.rating}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{place.address}</p>
                                                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter mt-1 block">
                                                                {place.type.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic animate-pulse">Scanning area...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-40 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200">
                                    <MapPin className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Map data unavailable</p>
                                    <p className="text-[10px] opacity-60 mt-1">Address: {room.location}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default RoomDetails;
