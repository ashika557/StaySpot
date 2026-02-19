import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Wifi, Wind, Tv, Star, User, Calendar, ShieldCheck, ArrowLeft, Loader, Utensils, Hospital, ShoppingBag, School, Navigation, Info, Cigarette, Dog, Users, Beer, UtensilsCrossed, Zap, Droplets, Car, Layout, ChefHat } from 'lucide-react';
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useMapContext } from '../context/MapContext';
import Sidebar from './sidebar';
import TenantSidebar from './TenantNavbar';
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
    const [hasActiveBooking, setHasActiveBooking] = useState(false);

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
        } catch (err) {
            console.error(err);
            setError("Failed to load room details.");
        } finally {
            setLoading(false);
        }
    };

    const checkUserBooking = async () => {
        try {
            if (user && user.role === 'Tenant') {
                const bookings = await bookingService.getAllBookings();
                // Check if user has a confirmed or active booking for THIS room
                const activeBooking = bookings.find(b =>
                    b.room.id === Number(id) &&
                    (b.status === 'Confirmed' || b.status === 'Active')
                );
                if (activeBooking) {
                    setHasActiveBooking(true);
                }
            }
        } catch (error) {
            console.error("Error checking booking status:", error);
        }
    };

    useEffect(() => {
        fetchRoomDetails();
        checkUserBooking();
    }, [id, user]);

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

    // Helper to get custom SVG marker with white icon inside colored pin
    const getIcon = (type) => {
        if (!window.google) return null;

        let color = '#3B82F6'; // Default Blue
        let labelIcon = '•';

        // Define colors and icons based on type
        if (type.includes('restaurant') || type.includes('food') || type.includes('cafe')) {
            color = '#F97316'; // Orange
            labelIcon = '🍽️';
        } else if (type.includes('hospital') || type.includes('health')) {
            color = '#EF4444'; // Red
            labelIcon = '🏥';
        } else if (type.includes('school') || type.includes('education') || type.includes('university')) {
            color = '#10B981'; // Green
            labelIcon = '🎓';
        } else if (type.includes('shopping') || type.includes('mall') || type.includes('supermarket')) {
            color = '#8B5CF6'; // Purple
            labelIcon = '🛍️';
        } else if (type === 'main') {
            color = '#DC2626'; // Dark Red for Room
            labelIcon = '🏠';
        }

        // SVG Path for a Pin
        const pinPath = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

        return {
            path: pinPath,
            fillColor: color,
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#FFFFFF',
            scale: 2, // Bigger scale to fit the label
            labelOrigin: new window.google.maps.Point(12, 10), // Center label in the pin head
            anchor: new window.google.maps.Point(12, 22)
        };
    };

    // Helper to get Label for the icon
    const getLabel = (type) => {
        if (!window.google) return null;

        let labelIcon = '•';
        if (type.includes('restaurant') || type.includes('food') || type.includes('cafe')) labelIcon = '🍽️';
        else if (type.includes('hospital') || type.includes('health')) labelIcon = '🏥';
        else if (type.includes('school') || type.includes('university')) labelIcon = '🎓';
        else if (type.includes('shopping') || type.includes('mall') || type.includes('supermarket')) labelIcon = '🛍️';
        else if (type === 'main') labelIcon = '🏠';

        return {
            text: labelIcon,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px', // Adjust size to fit in the pin
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
                    <Sidebar user={user} />
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

                        {/* Title & Price Header - Premium Glass Card */}
                        <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-xl shadow-blue-900/5 border border-white">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-sm ${room.status === 'Available'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-orange-500 text-white'
                                            }`}>
                                            {room.status}
                                        </span>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg text-yellow-700 border border-yellow-100">
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            <span className="text-xs font-black">4.8</span>
                                            <span className="text-yellow-400/60 text-[10px] font-bold">(24 Verified)</span>
                                        </div>
                                    </div>
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                                        {room.title}
                                    </h1>
                                    <p className="flex items-center gap-2 text-gray-500 font-bold text-sm bg-gray-50 w-fit px-3 py-1.5 rounded-full border border-gray-100">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                        {room.location}
                                    </p>
                                </div>
                                <div className="md:text-right flex flex-col items-start md:items-end">
                                    <div className="text-xs font-black text-blue-600/40 uppercase tracking-widest mb-1">Stay Value</div>
                                    <div className="text-4xl font-black text-blue-600 flex items-baseline gap-1">
                                        <span className="text-lg font-bold">NPR</span>
                                        {parseFloat(room.price).toLocaleString()}
                                    </div>
                                    <p className="text-gray-400 text-sm font-bold mt-1">per month premium</p>
                                </div>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-10" />

                            {/* Property Spec Details - Premium Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                                <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-blue-100 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Layout className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Level</p>
                                    </div>
                                    <p className="font-black text-gray-900 text-lg leading-none">{room.floor || 'Grd Floor'}</p>
                                </div>
                                <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-blue-100 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Space</p>
                                    </div>
                                    <p className="font-black text-gray-900 text-lg leading-none">{room.size || 'Standard'}</p>
                                </div>
                                <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-blue-100 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                            <UtensilsCrossed className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sanitary</p>
                                    </div>
                                    <p className="font-black text-gray-900 text-lg leading-none">{room.toilet_type || 'Shared'}</p>
                                </div>
                            </div>

                            {/* Amenities - Modern Pill Layout */}
                            <div className="mt-8">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Exclusive Amenities</h3>
                                <div className="flex flex-wrap gap-4">
                                    {amenitiesList.map((amenity, index) => {
                                        const isWifi = amenity.toLowerCase().includes('wifi');
                                        const isParking = amenity.toLowerCase().includes('parking');
                                        const isWater = amenity.toLowerCase().includes('water');
                                        const isPower = amenity.toLowerCase().includes('backup') || amenity.toLowerCase().includes('electricity');
                                        const isFurnished = amenity.toLowerCase().includes('furnished');
                                        const isKitchen = amenity.toLowerCase().includes('kitchen');

                                        return (
                                            <div key={index}
                                                className="group flex items-center gap-3 px-5 py-3 bg-white rounded-2xl text-gray-800 font-black text-xs border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all hover:-translate-y-0.5"
                                            >
                                                <div className={`p-2 rounded-lg transition-colors ${isWifi ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                                                    isKitchen ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' :
                                                        isPower ? 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white' :
                                                            'bg-gray-50 text-gray-600 group-hover:bg-gray-600 group-hover:text-white'
                                                    }`}>
                                                    {isWifi && <Wifi className="w-3.5 h-3.5" />}
                                                    {isKitchen && <ChefHat className="w-3.5 h-3.5" />}
                                                    {isParking && <Car className="w-3.5 h-3.5" />}
                                                    {isWater && <Droplets className="w-3.5 h-3.5" />}
                                                    {isPower && <Zap className="w-3.5 h-3.5" />}
                                                    {isFurnished && <Layout className="w-3.5 h-3.5" />}
                                                    {!isWifi && !isKitchen && !isParking && !isWater && !isPower && !isFurnished && <Star className="w-3.5 h-3.5" />}
                                                </div>
                                                <span className="tracking-tight">{amenity.trim()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Description - Elegant Typography */}
                        <div className="bg-white/70 backdrop-blur-sm p-10 rounded-3xl shadow-xl shadow-blue-900/5 border border-white mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-blue-600 rounded-full" />
                                <h3 className="font-black text-gray-900 text-xl tracking-tight">The Space</h3>
                            </div>
                            <p className="text-gray-600 leading-[1.8] text-lg font-medium whitespace-pre-line">
                                {room.description}
                            </p>
                        </div>

                        {/* House Rules Section - Modern Grid */}
                        <div className="bg-white/70 backdrop-blur-sm p-10 rounded-3xl shadow-xl shadow-blue-900/5 border border-white">
                            <h3 className="font-black text-gray-900 text-xl mb-8 flex items-center gap-3 tracking-tight">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <Info className="w-6 h-6" />
                                </div>
                                Essential Guidelines
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                                {[
                                    { key: 'cooking_allowed', icon: UtensilsCrossed, label: 'Culinary Activities', active: room.cooking_allowed },
                                    { key: 'smoking_allowed', icon: Cigarette, label: 'Indoor Smoking', active: room.smoking_allowed },
                                    { key: 'pets_allowed', icon: Dog, label: 'Pet Companions', active: room.pets_allowed },
                                    { key: 'visitor_allowed', icon: Users, label: 'Guest Visitation', active: room.visitor_allowed },
                                    { key: 'drinking_allowed', icon: Beer, label: 'Alcohol Policy', active: room.drinking_allowed }
                                ].map((rule, idx) => (
                                    <div key={idx}
                                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${rule.active
                                                ? 'bg-green-50/50 border-green-100/50 hover:bg-green-50'
                                                : 'bg-red-50/50 border-red-100/50 hover:bg-red-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl ${rule.active ? 'bg-white text-green-600' : 'bg-white text-red-600 shadow-sm'}`}>
                                                <rule.icon className="w-5 h-5" />
                                            </div>
                                            <span className={`font-black text-sm tracking-tight ${rule.active ? 'text-green-800' : 'text-red-800'}`}>
                                                {rule.label}
                                            </span>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${rule.active
                                                ? 'bg-green-600 text-white'
                                                : 'bg-red-600 text-white'
                                            }`}>
                                            {rule.active ? 'Yes' : 'No'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Booking & Map */}
                    <div className="space-y-6">
                        {/* Action Card - Glassmorphism style */}
                        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-white/20 sticky top-24 ring-1 ring-black/5">
                            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                                <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center p-0.5 shadow-lg shadow-blue-200">
                                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xl font-black text-blue-600 overflow-hidden">
                                        {room.owner?.profile_photo ? (
                                            <img src={getMediaUrl(room.owner.profile_photo)} alt={room.owner.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            room.owner?.full_name ? room.owner.full_name[0] : <User className="w-6 h-6" />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-600/60 font-black uppercase tracking-widest mb-0.5">Contact Host</p>
                                    <p className="font-black text-gray-900 text-lg leading-tight">{room.owner?.full_name || 'Owner'}</p>

                                    {hasActiveBooking ? (
                                        <div className="space-y-0.5 mt-1">
                                            <p className="text-xs text-blue-600 font-bold">{room.owner?.email}</p>
                                            <p className="text-xs text-gray-500">{room.owner?.phone}</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            <p className="text-[10px] text-gray-400 font-bold italic">Identity Verified</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    disabled={room.status !== 'Available'}
                                    className={`w-full py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 group ${room.status === 'Available'
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-0.5'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <Calendar className={`w-5 h-5 transition-transform group-hover:rotate-12 ${room.status === 'Available' ? 'text-blue-100' : 'text-gray-300'}`} />
                                    {room.status === 'Available' ? 'Secure Your Stay' : 'Currently ' + room.status}
                                </button>
                                <button
                                    onClick={() => setShowVisitModal(true)}
                                    className="w-full py-4.5 bg-white text-gray-900 border-2 border-gray-100 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-gray-50 hover:border-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                                >
                                    <ShieldCheck className="w-5 h-5 text-blue-500 transition-transform group-hover:scale-110" />
                                    Express Visit
                                </button>

                                <p className="text-[10px] text-center text-gray-400 font-medium px-4">
                                    No commitment required. Reach out to the owner to discuss details or schedule a viewing.
                                </p>
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
