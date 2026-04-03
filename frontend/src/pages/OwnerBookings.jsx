import React, { useState, useEffect } from 'react';
import { 
  Check, X, Calendar, Clock, ChevronDown, 
  BookOpen, AlertCircle, CheckCircle, XCircle, 
  User, ShieldCheck, Mail, Phone, BadgeCheck, 
  Eye, ArrowRight, TrendingUp, Filter, Loader, Search, ExternalLink
} from 'lucide-react';
import OwnerSidebar from '../components/OwnerSidebar';
import { bookingService } from '../services/bookingService';
import { getMediaUrl } from '../constants/api';

const OwnerBookings = ({ user, onLogout }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRoom, setFilterRoom] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => { fetchBookings(); }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getAllBookings();
            setBookings(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await bookingService.updateBookingStatus(id, status);
            fetchBookings();
        } catch (err) { console.error(err); }
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'Pending').length,
        approved: bookings.filter(b => ['Confirmed', 'Active'].includes(b.status)).length,
        rejected: bookings.filter(b => ['Rejected', 'Cancelled'].includes(b.status)).length,
    };

    const filteredBookings = bookings.filter(b => {
        if (filterStatus !== 'All' && b.status !== filterStatus) return false;
        if (filterRoom !== 'All' && b.room.title !== filterRoom) return false;
        return true;
    });

    const pendingRequests = filteredBookings.filter(b => b.status === 'Pending');
    const history = filteredBookings.filter(b => b.status !== 'Pending');

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <OwnerSidebar user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400 font-medium">Loading bookings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen font-inter overflow-hidden">
            <OwnerSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-auto">
                <div className="p-8 max-w-7xl mx-auto w-full">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
                            <p className="text-sm text-gray-400 mt-0.5">Manage room booking requests from tenants</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <select
                                    className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer shadow-sm"
                                    value={filterRoom}
                                    onChange={(e) => setFilterRoom(e.target.value)}
                                >
                                    <option value="All">All Rooms</option>
                                    {[...new Set(bookings.map(b => b.room.title))].map(title => (
                                        <option key={title} value={title}>{title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <select
                                    className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer shadow-sm"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="All">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Bookings', value: stats.total, icon: <BookOpen />, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
                            { label: 'Pending', value: stats.pending, icon: <Clock />, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
                            { label: 'Approved', value: stats.approved, icon: <CheckCircle />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                            { label: 'Rejected', value: stats.rejected, icon: <XCircle />, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${card.iconBg}`}>
                                    {React.cloneElement(card.icon, { className: `w-4 h-4 ${card.iconColor}` })}
                                </div>
                                <p className="text-xs text-gray-400 font-medium mb-0.5">{card.label}</p>
                                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-5">
                                <h2 className="text-base font-bold text-gray-900">New Requests</h2>
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100">
                                    {pendingRequests.length} waiting
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingRequests.map(booking => (
                                    <RequestCard
                                        key={booking.id}
                                        booking={booking}
                                        onApprove={() => handleUpdateStatus(booking.id, 'Confirmed')}
                                        onReject={() => handleUpdateStatus(booking.id, 'Rejected')}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Booking History */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Booking History</h2>
                                <p className="text-xs text-gray-400 mt-0.5">All bookings and their current status</p>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                                {history.length} entries
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">No history found</p>
                                    <p className="text-xs text-gray-400 mt-1">Processed bookings will appear here</p>
                                </div>
                            ) : (
                                history.map(booking => <HistoryRow key={booking.id} booking={booking} />)
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RequestCard = ({ booking, onApprove, onReject }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="h-1 w-full bg-amber-400/40"></div>

        <div className="p-5">
            <div className="flex justify-between items-start mb-5">
                <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                    Pending Approval
                </span>
                <Clock className="w-4 h-4 text-gray-300" />
            </div>

            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-shrink-0">
                    <img
                        src={booking.tenant.profile_photo ? getMediaUrl(booking.tenant.profile_photo) : `https://ui-avatars.com/api/?name=${booking.tenant.full_name}&background=4f46e5&color=fff&bold=true`}
                        className="w-11 h-11 rounded-full object-cover border border-gray-100"
                        alt=""
                    />
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{booking.tenant.full_name}</h3>
                    <p className="text-xs text-indigo-500 font-medium truncate mt-0.5">{booking.room.title}</p>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 mb-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs text-gray-500">Booking Date</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{booking.start_date}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-gray-500">Identity</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${booking.tenant.is_identity_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        {booking.tenant.is_identity_verified ? 'Verified' : 'Unverified'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onApprove}
                    className="py-2.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                    onClick={onReject}
                    className="py-2.5 bg-white border border-rose-200 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
            </div>
        </div>
    </div>
);

const HistoryRow = ({ booking }) => {
    const isApproved = booking.status === 'Confirmed' || booking.status === 'Active';
    const isRejected = booking.status === 'Rejected' || booking.status === 'Cancelled';

    return (
        <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all group">
            <div className="flex items-center gap-4 w-64">
                <img
                    src={booking.tenant.profile_photo ? getMediaUrl(booking.tenant.profile_photo) : `https://ui-avatars.com/api/?name=${booking.tenant.full_name}&background=f3f4f6&color=94a3b8&bold=true`}
                    className="w-10 h-10 rounded-full object-cover border border-gray-100 group-hover:scale-105 transition-transform flex-shrink-0"
                    alt=""
                />
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{booking.tenant.full_name}</p>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{booking.room.title}</p>
                </div>
            </div>

            <div className="hidden lg:flex flex-col items-center">
                <p className="text-[10px] text-gray-400 mb-1">Stay Duration</p>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
                    <span className="text-xs font-semibold text-gray-600">{booking.start_date}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                    <span className="text-xs font-semibold text-gray-600">{booking.end_date}</span>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${
                    isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    isRejected ? 'bg-rose-50 text-rose-500 border-rose-100' :
                    'bg-gray-50 text-gray-400 border-gray-100'
                }`}>
                    {booking.status === 'Active' ? 'Confirmed' : booking.status}
                </span>
                <p className="text-[10px] text-gray-400">
                    {new Date(booking.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
            </div>
        </div>
    );
};

export default OwnerBookings;