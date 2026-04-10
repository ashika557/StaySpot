import React, { useState, useEffect } from 'react';
import {
    Calendar, MapPin, ArrowRight, XCircle,
    MessageSquare, ExternalLink,
    BadgeCheck, Star, ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import TenantSidebar from '../components/TenantSidebar';
import { bookingService } from '../services/bookingService';
import { chatService } from '../services/chatService';
import { getMediaUrl, ROUTES } from '../constants/api';
import { useNavigate } from 'react-router-dom';

const TenantBookings = ({ user }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const bookingsPerPage = 8;

    const navigate = useNavigate();

    const fetchBookings = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await bookingService.getAllBookings();
            setBookings(data);
        } catch (err) { console.error('Failed to grab bookings', err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const handleCancelBooking = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await bookingService.updateBookingStatus(id, 'Cancelled');
            fetchBookings();
        } catch (err) { alert("Cancellation failed."); }
    };

    const filteredBookings = bookings.filter(booking => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Upcoming') return ['Pending', 'Confirmed', 'Active'].includes(booking.status);
        if (activeTab === 'Completed') return booking.status === 'Completed';
        if (activeTab === 'Cancelled') return ['Cancelled', 'Rejected'].includes(booking.status);
        return true;
    });

    const stats = {
        all: bookings.length,
        upcoming: bookings.filter(b => ['Pending', 'Confirmed', 'Active'].includes(b.status)).length,
        completed: bookings.filter(b => b.status === 'Completed').length,
        cancelled: bookings.filter(b => ['Cancelled', 'Rejected'].includes(b.status)).length,
    };

    const totalBookings = filteredBookings.length;
    const indexOfLast = currentPage * bookingsPerPage;
    const indexOfFirst = indexOfLast - bookingsPerPage;
    const currentBookings = filteredBookings.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(totalBookings / bookingsPerPage);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Confirmed': case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Pending': return 'bg-amber-50 text-amber-500 border-amber-100';
            case 'Cancelled': case 'Rejected': return 'bg-rose-50 text-rose-500 border-rose-100';
            case 'Completed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
            <TenantSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-auto">
                <div className="p-8 max-w-7xl mx-auto w-full">

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Manage your current and past room bookings</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Bookings', value: stats.all, icon: <Calendar />, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
                            { label: 'Upcoming', value: stats.upcoming, icon: <ArrowRight />, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
                            { label: 'Completed', value: stats.completed, icon: <BadgeCheck />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                            { label: 'Cancelled', value: stats.cancelled, icon: <XCircle />, iconBg: 'bg-gray-100', iconColor: 'text-gray-500' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${card.iconBg}`}>
                                    {React.cloneElement(card.icon, { className: `w-4 h-4 ${card.iconColor}` })}
                                </div>
                                <p className="text-xs text-gray-400 font-medium mb-0.5">{card.label}</p>
                                <h2 className="text-xl font-bold text-gray-900">{card.value}</h2>
                            </div>
                        ))}
                    </div>

                    {/* Bookings Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Booking History</h2>
                                <p className="text-xs text-gray-400 mt-0.5">All your room bookings in one place</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    className="appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer"
                                    value={activeTab}
                                    onChange={(e) => { setActiveTab(e.target.value); setCurrentPage(1); }}
                                >
                                    {['All', 'Upcoming', 'Completed', 'Cancelled'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/60 border-b border-gray-50">
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Room</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Owner</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Start Date</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Price</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="7" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-xs font-medium">Loading bookings...</p>
                                            </div>
                                        </td></tr>
                                    ) : currentBookings.length === 0 ? (
                                        <tr><td colSpan="7" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                    <Search className="w-5 h-5 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-500">No bookings found</p>
                                                <p className="text-xs">Try a different filter or find a room</p>
                                                <button
                                                    onClick={() => navigate(ROUTES.TENANT_SEARCH)}
                                                    className="mt-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-all flex items-center gap-1.5"
                                                >
                                                    Find a Room <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td></tr>
                                    ) : (
                                        currentBookings.map((booking) => {
                                            const imageUrl = booking.room.images?.length > 0
                                                ? getMediaUrl(booking.room.images[0].image)
                                                : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80';

                                            const handleMessageOwner = async () => {
                                                try {
                                                    await chatService.startConversation(booking.room.owner.id);
                                                    navigate(ROUTES.CHAT);
                                                } catch (error) { console.error(error); }
                                            };

                                            return (
                                                <tr key={booking.id} className="hover:bg-gray-50/60 transition-colors group">
                                                    {/* Room */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={imageUrl}
                                                                alt={booking.room.title}
                                                                className="w-10 h-10 rounded-lg object-cover border border-gray-100 group-hover:scale-105 transition-transform flex-shrink-0"
                                                            />
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900 truncate max-w-[140px]">{booking.room.title}</p>
                                                                <p className="text-[10px] text-gray-400 mt-0.5">#BK-{booking.id.toString().padStart(4, '0')}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Location */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                                            <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">{booking.room.location}</span>
                                                        </div>
                                                    </td>

                                                    {/* Owner */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <img
                                                                src={booking.room.owner.profile_photo
                                                                    ? getMediaUrl(booking.room.owner.profile_photo)
                                                                    : `https://ui-avatars.com/api/?name=${booking.room.owner.full_name}&background=f3f4f6&color=94a3b8&bold=true`}
                                                                className="w-7 h-7 rounded-full object-cover border border-gray-100 flex-shrink-0"
                                                                alt=""
                                                            />
                                                            <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">{booking.room.owner.full_name}</span>
                                                        </div>
                                                    </td>

                                                    {/* Start Date */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                            <span className="text-xs font-semibold text-gray-600">{booking.start_date}</span>
                                                        </div>
                                                    </td>

                                                    {/* Price */}
                                                    <td className="px-6 py-4 text-right">
                                                        <p className="text-sm font-bold text-gray-900">Rs. {(booking.total_price || booking.room.price).toLocaleString()}</p>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getStatusStyles(booking.status)}`}>
                                                            {booking.status === 'Active' ? 'Confirmed' : booking.status}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={handleMessageOwner}
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                                                title="Message Owner"
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/room/${booking.room.id}`)}
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                                                title="View Room"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </button>

                                                            {['Pending', 'Confirmed', 'Active'].includes(booking.status) && (
                                                                <button
                                                                    onClick={() => handleCancelBooking(booking.id)}
                                                                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-400 rounded-lg text-[10px] font-bold hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}

                                                            {booking.status === 'Completed' && (
                                                                <button className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-gray-700 transition-all flex items-center gap-1.5">
                                                                    <Star className="w-3 h-3" /> Review
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <p className="text-xs text-gray-400">
                                Showing <span className="font-semibold text-gray-700">{indexOfFirst + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(indexOfLast, totalBookings)}</span> of <span className="font-semibold text-gray-700">{totalBookings}</span> records
                            </p>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                            currentPage === i + 1
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-white text-gray-400 border border-gray-100 hover:text-gray-700'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantBookings;