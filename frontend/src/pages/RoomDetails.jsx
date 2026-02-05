import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Wifi, Wind, Tv, Star, User, Calendar, ShieldCheck, ArrowLeft, Loader } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import TenantSidebar from './TenantNavbar';
import { roomService } from '../services/roomService';
import { bookingService } from '../services/bookingService';
import { visitService } from '../services/tenantService'; // Added import
import { getMediaUrl, ROUTES } from '../constants/api';
import { CONFIG, GOOGLE_MAPS_API_KEY } from '../constants/config';
import { useMapContext } from '../context/MapContext';

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

    // Visit Modal State
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitLoading, setVisitLoading] = useState(false);
    const [visitData, setVisitData] = useState({ date: '', time: '', purpose: 'Room viewing' });

    // Booking Form State
    const [bookingDates, setBookingDates] = useState({
        startDate: '',
        endDate: '',
    });
    const [bookingLoading, setBookingLoading] = useState(false);

    const { isLoaded } = useMapContext();

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

    const handleVisitRequest = async (e) => {
        e.preventDefault();
        try {
            setVisitLoading(true);
            await visitService.createVisit({
                room_id: room.id,
                owner_id: room.owner.id, // Mandatory field fix
                visit_date: visitData.date,
                visit_time: visitData.time,
                purpose: visitData.purpose
            });
            alert('Visit requested successfully! Waiting for owner approval.');
            setShowVisitModal(false);
            navigate(ROUTES.TENANT_VISITS || '/tenant/visits');
        } catch (err) {
            console.error(err);
            alert('Failed to request visit: ' + err.message);
        } finally {
            setVisitLoading(false);
        }
    };

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
                </div>

                <div className="p-8 max-w-5xl mx-auto w-full pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Images & Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Images & Details (unchanged) */}
                            {/* ... (Keep existing image/details structure) ... */}
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                <img src={mainImage} alt={room.title} className="w-full h-80 object-cover" />
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900">{room.title}</h2>
                                {/* ... Other details ... */}
                                <p className="text-gray-600 leading-relaxed mb-6 mt-4">
                                    {room.description || `A comfortable ${room.room_type.toLowerCase()} located in ${room.location}.`}
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Owner & Booking */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4">Landlord</h3>
                                {/* Owner Info */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {room.owner?.full_name?.[0] || 'O'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{room.owner?.full_name || 'Landlord'}</div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setShowBookingModal(true)}
                                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                                    >
                                        Request to Book
                                    </button>
                                    <button
                                        onClick={() => setShowVisitModal(true)}
                                        className="w-full bg-white text-blue-600 border border-blue-200 py-3 rounded-xl font-bold hover:bg-blue-50 transition"
                                    >
                                        Schedule a Visit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visit Modal */}
            {showVisitModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Schedule a Visit</h2>
                        <p className="text-sm text-gray-500 mb-6">Pick a date and time to view the room.</p>

                        <form onSubmit={handleVisitRequest}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-2 border rounded-xl"
                                        value={visitData.date}
                                        onChange={(e) => setVisitData({ ...visitData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full p-2 border rounded-xl"
                                        value={visitData.time}
                                        onChange={(e) => setVisitData({ ...visitData, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowVisitModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancel</button>
                                <button type="submit" disabled={visitLoading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">{visitLoading ? 'Sending...' : 'Request Visit'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Modal (Keep existing) */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    {/* Existing booking modal content */}
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Booking</h2>
                        <form onSubmit={handleBookingRequest}>
                            {/* Inputs */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Move-in Date</label>
                                    <input type="date" className="w-full p-2 border rounded-xl" value={bookingDates.startDate} onChange={(e) => setBookingDates({ ...bookingDates, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                                    <input type="date" className="w-full p-2 border rounded-xl" value={bookingDates.endDate} onChange={(e) => setBookingDates({ ...bookingDates, endDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowBookingModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Send Request</button>
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
