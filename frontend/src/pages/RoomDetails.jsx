import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Wifi, Wind, Tv, Star, User, Calendar, ShieldCheck, ArrowLeft, Loader } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import TenantSidebar from './TenantNavbar';
import { roomService } from '../services/roomService';
import { bookingService } from '../services/bookingService'; // Will create this
import { getMediaUrl, ROUTES } from '../constants/api';
import { CONFIG, GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from '../constants/config';

const mapContainerStyle = {
    width: '100%',
    height: '250px',
    borderRadius: '16px',
};

const RoomDetails = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Booking Form State
    const [bookingDates, setBookingDates] = useState({
        startDate: '',
        endDate: '',
    });
    const [bookingLoading, setBookingLoading] = useState(false);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: ['places']
    });

    const [userBooking, setUserBooking] = useState(null);

    useEffect(() => {
        fetchRoomDetails();
        if (user && user.role === 'Tenant') {
            fetchUserBooking();
        }
    }, [id, user]);

    const fetchUserBooking = async () => {
        try {
            const bookings = await bookingService.getAllBookings();
            const currentBooking = bookings.find(b => b.room.id === parseInt(id));
            setUserBooking(currentBooking);
        } catch (err) {
            console.error("Failed to fetch user booking status", err);
        }
    };

    const fetchRoomDetails = async () => {
        try {
            setLoading(true);
            const data = await roomService.getRoomById(id);
            setRoom(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load room details.");
        } finally {
            setLoading(false);
        }
    };

    const handleBookingRequest = async (e) => {
        e.preventDefault();
        try {
            setBookingLoading(true);

            // Calculate rent roughly? Or backend handles it. 
            // We need to send monthly_rent. Usually same as room price.
            // But if it is partial month? For now, we assume monthly_rent = room.price

            await bookingService.createBooking({
                room_id: room.id,
                start_date: bookingDates.startDate,
                end_date: bookingDates.endDate,
                monthly_rent: room.price
            });

            alert('Booking requested successfully! Waiting for owner approval.');
            setShowBookingModal(false);
            navigate(ROUTES.TENANT_BOOKINGS); // Redirect to bookings page

        } catch (err) {
            console.error(err);
            alert('Failed to request booking: ' + err.message);
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!room) return (
        <div className="flex h-screen items-center justify-center">
            <p>Room not found.</p>
        </div>
    );

    const mainImage = room.images && room.images.length > 0
        ? getMediaUrl(room.images[0].image)
        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop';

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <TenantSidebar />

            <div className="flex-1 flex flex-col overflow-auto">
                {/* Header */}
                <div className="bg-white border-b px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">Room Details</h1>
                    </div>
                    {/* Warning Banner for missing ID / Approval */}
                    {(!user?.is_identity_verified && user?.role !== 'Admin') && (
                        <div className={`flex-1 max-w-md mx-6 border-l-4 p-2 flex items-center gap-2 ${user?.identity_document ? 'bg-blue-50 border-blue-500' : 'bg-yellow-100 border-yellow-500'}`}>
                            <ShieldCheck className={`w-4 h-4 ${user?.identity_document ? 'text-blue-600' : 'text-yellow-600'}`} />
                            <p className={`text-[10px] font-medium ${user?.identity_document ? 'text-blue-700' : 'text-yellow-700'}`}>
                                {user?.identity_document
                                    ? 'Identity document pending admin approval. You can book once verified.'
                                    : 'Identity document missing. Please upload your Citizenship/ID in the Profile to book.'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-8 max-w-5xl mx-auto w-full pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Images & Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Images */}
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                <img src={mainImage} alt={room.title} className="w-full h-80 object-cover" />
                                {/* Thumbnails carousel could go here */}
                                {room.images && room.images.length > 1 && (
                                    <div className="flex gap-2 p-4 overflow-x-auto">
                                        {room.images.map((img, idx) => (
                                            <img
                                                key={img.id}
                                                src={getMediaUrl(img.image)}
                                                className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition"
                                                alt={`Room View ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{room.title}</h2>
                                        <div className="flex items-center gap-2 text-gray-500 mt-1">
                                            <MapPin size={16} />
                                            <span>{room.location}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-600">
                                            ₹{parseFloat(room.price).toLocaleString()}
                                            <span className="text-sm text-gray-400 font-normal">/month</span>
                                        </div>
                                        <div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md text-xs font-bold mt-2">
                                            <Star size={12} fill="#ea580c" /> 4.0 (24 reviews)
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-gray-100 my-6">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 font-bold uppercase mb-1">Room Type</div>
                                        <div className="font-semibold text-gray-800">{room.room_type}</div>
                                    </div>
                                    <div className="text-center border-l border-r border-gray-100">
                                        <div className="text-xs text-gray-400 font-bold uppercase mb-1">Gender</div>
                                        <div className="font-semibold text-gray-800">{room.gender_preference}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 font-bold uppercase mb-1">Details</div>
                                        <div className="font-semibold text-gray-800">{room.size || 'Standard'} • {room.floor || 'G'} Floor</div>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 mb-4">Amenities</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {room.wifi && <Amenity icon={Wifi} label="WiFi" />}
                                    {room.ac && <Amenity icon={Wind} label="AC" />}
                                    {room.tv && <Amenity icon={Tv} label="TV" />}
                                    {room.parking && <Amenity icon={ShieldCheck} label="Parking" />}
                                    {/* Add other amenities... */}
                                </div>

                                <h3 className="font-bold text-gray-900 mb-4">Description</h3>
                                <p className="text-gray-600 leading-relaxed mb-6">
                                    A comfortable {room.room_type.toLowerCase()} located in {room.location}.
                                    Perfect for students or working professionals. Close to public transport and local markets.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Owner & Booking */}
                        <div className="space-y-6">
                            {/* Owner Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4">Landlord</h3>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {room.owner?.full_name?.[0] || 'O'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{room.owner?.full_name || 'Landlord'}</div>
                                        <div className="text-xs text-gray-500">Owner</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (userBooking && ['Confirmed', 'Active'].includes(userBooking.status)) {
                                                navigate(`${ROUTES.CHAT}?userId=${room.owner.id}&roomId=${room.id}`);
                                            } else {
                                                alert(userBooking
                                                    ? 'You can chat with the owner once they accept your booking request.'
                                                    : 'You must request a booking and have it accepted before you can chat with the owner.');
                                            }
                                        }}
                                        className={`ml-auto text-sm font-bold transition ${(userBooking && ['Confirmed', 'Active'].includes(userBooking.status)) || user?.role === 'Admin'
                                            ? 'text-blue-600 hover:underline'
                                            : 'text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        Chat
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!user?.is_identity_verified && user?.role !== 'Admin') {
                                            const errorMsg = user?.identity_document
                                                ? 'Your identity document is pending verification by an administrator.'
                                                : 'You must provide an identity document (Citizenship/ID) in your Profile before requesting a booking.';
                                            alert(errorMsg);
                                            navigate(ROUTES.PROFILE);
                                            return;
                                        }
                                        setShowBookingModal(true);
                                    }}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                                >
                                    Request to Book
                                </button>
                            </div>

                            {/* Location Map */}
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4 px-2">Location</h3>
                                {isLoaded && room.latitude ? (
                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={{ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) }}
                                        zoom={14}
                                        options={{ disableDefaultUI: true }}
                                    >
                                        <Marker position={{ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) }} />
                                    </GoogleMap>
                                ) : (
                                    <div className="h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                        Map not available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Booking</h2>
                        <p className="text-sm text-gray-500 mb-6">Choose your preferred move-in dates.</p>

                        <form onSubmit={handleBookingRequest}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Move-in Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            required
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                            value={bookingDates.startDate}
                                            onChange={(e) => setBookingDates({ ...bookingDates, startDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Expected End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            required
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                            value={bookingDates.endDate}
                                            onChange={(e) => setBookingDates({ ...bookingDates, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bookingLoading}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                >
                                    {bookingLoading && <Loader className="animate-spin" size={18} />}
                                    Send Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const Amenity = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700">
        <Icon size={18} className="text-blue-500" />
        {label}
    </div>
);

export default RoomDetails;
