import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ArrowRight, XCircle } from 'lucide-react';
import TenantSidebar from '../components/TenantSidebar';
import TenantHeader from '../components/TenantHeader';
import Footer from '../components/Footer';
import { bookingService } from '../services/bookingService';
import { chatService } from '../services/chatService';
import { getMediaUrl, ROUTES } from '../constants/api';
import { useNavigate } from 'react-router-dom';

const TenantBookings = ({ user }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All'); // All, Upcoming, Completed, Cancelled
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getAllBookings();
            setBookings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this booking request?")) return;
        try {
            await bookingService.updateBookingStatus(id, 'Cancelled');
            fetchBookings(); // Refresh list
        } catch (err) {
            alert("Failed to cancel booking");
        }
    };

    // Filter bookings based on tab
    const filteredBookings = bookings.filter(booking => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Upcoming') return ['Pending', 'Confirmed', 'Active'].includes(booking.status);
        if (activeTab === 'Completed') return booking.status === 'Completed';
        if (activeTab === 'Cancelled') return ['Cancelled', 'Rejected'].includes(booking.status);
        return true;
    });

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <TenantSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <TenantHeader
                    user={user}
                    title="My Bookings"
                    subtitle="Track your room requests and history"
                    onLogout={() => {
                        localStorage.removeItem('user');
                        window.location.href = '/';
                    }}
                />
                <div className="flex-1 overflow-auto p-8">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-8">
                        {['All', 'Upcoming', 'Completed', 'Cancelled'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition ${activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
                                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                                <p>No bookings found in this category.</p>
                            </div>
                        ) : (
                            filteredBookings.map(booking => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    onCancel={() => handleCancelBooking(booking.id)}
                                    navigate={navigate}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BookingCard = ({ booking, onCancel, navigate }) => {
    const imageUrl = booking.room.images && booking.room.images.length > 0
        ? getMediaUrl(booking.room.images[0].image)
        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop';

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmed': case 'Active': return 'bg-green-100 text-green-700';
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            case 'Completed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleMessageOwner = async () => {
        try {
            await chatService.startConversation(booking.room.owner.id);
            navigate(ROUTES.CHAT);
        } catch (error) {
            console.error(error);
            alert('Failed to start chat with owner');
        }
    };

    return (
        <div className="bg-white rounded-2xl p-4 flex gap-6 border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="w-48 h-32 rounded-xl overflow-hidden shrink-0">
                <img src={imageUrl} alt={booking.room.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{booking.room.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 overflow-hidden">
                                {booking.room.owner.profile_photo ? (
                                    <img src={getMediaUrl(booking.room.owner.profile_photo)} alt={booking.room.owner.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    booking.room.owner.full_name[0]
                                )}
                            </div>
                            <div className="text-sm text-gray-500">Landlord: {booking.room.owner.full_name}</div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin size={14} /> {booking.room.location}
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                        {booking.status === 'Active' ? 'Confirmed' : booking.status}
                    </span>
                </div>

                <div className="flex items-end justify-between mt-4">
                    <div className="text-sm font-bold text-gray-700">
                        Move-in: {booking.start_date}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleMessageOwner}
                            className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-sm font-bold hover:bg-blue-100 transition mr-auto"
                        >
                            Message Owner
                        </button>

                        <button
                            onClick={() => navigate(`/room/${booking.room.id}`)}
                            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition"
                        >
                            View Details
                        </button>

                        {['Pending', 'Confirmed', 'Active'].includes(booking.status) && (
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition"
                            >
                                Cancel Booking
                            </button>
                        )}

                        {booking.status === 'Completed' && (
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition">
                                Leave Review
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantBookings;
