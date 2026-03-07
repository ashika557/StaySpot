import React, { useState, useEffect } from 'react';
import { Check, X, Calendar, Clock, ChevronDown, BookOpen, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await bookingService.updateBookingStatus(id, status);
            fetchBookings();
        } catch (err) {
            alert(`Failed to ${status.toLowerCase()} booking`);
        }
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
                    <div className="text-center">
                        <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400 font-medium text-sm">Loading bookings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <OwnerSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-auto">
                <div className="p-8">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Bookings</h1>
                            <p className="text-sm text-gray-400 mt-1">Manage tenant booking requests and history</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <select
                                    className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-600 font-medium transition cursor-pointer"
                                    value={filterRoom}
                                    onChange={(e) => setFilterRoom(e.target.value)}
                                >
                                    <option value="All">All Rooms</option>
                                    {[...new Set(bookings.map(b => b.room.title))].map(title => (
                                        <option key={title} value={title}>{title}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select
                                    className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-600 font-medium transition cursor-pointer"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="All">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-4 gap-5 mb-8">
                        {[
                            { label: 'Total Requests', value: stats.total, icon: <BookOpen className="w-5 h-5" />, iconBg: '#eff6ff', iconColor: '#2563eb', accent: '#2563eb', valColor: '#111827' },
                            { label: 'Pending', value: stats.pending, icon: <Clock className="w-5 h-5" />, iconBg: '#fff7ed', iconColor: '#ea580c', accent: '#ea580c', valColor: '#ea580c' },
                            { label: 'Approved', value: stats.approved, icon: <CheckCircle className="w-5 h-5" />, iconBg: '#f0fdf4', iconColor: '#16a34a', accent: '#16a34a', valColor: '#16a34a' },
                            { label: 'Rejected', value: stats.rejected, icon: <XCircle className="w-5 h-5" />, iconBg: '#fef2f2', iconColor: '#dc2626', accent: '#dc2626', valColor: '#dc2626' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                                style={{ borderTop: `3px solid ${card.accent}` }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: card.iconBg, color: card.iconColor }}>
                                        {card.icon}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{card.label}</p>
                                <p className="text-3xl font-extrabold" style={{ color: card.valColor }}>{card.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-5">
                                <h2 className="text-base font-extrabold text-gray-900">Pending Requests</h2>
                                <span className="px-2.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
                                    {pendingRequests.length} awaiting
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

                    {/* History */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-extrabold text-gray-900">Recent Booking History</h2>
                                <p className="text-xs text-gray-400 mt-0.5">All past and active bookings</p>
                            </div>
                            <span className="text-xs font-bold text-gray-400">{history.length} records</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <BookOpen className="w-7 h-7 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-400">No booking history yet</p>
                                    <p className="text-xs text-gray-300 mt-1">Approved and rejected bookings will appear here</p>
                                </div>
                            ) : (
                                history.map(booking => (
                                    <HistoryRow key={booking.id} booking={booking} />
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const RequestCard = ({ booking, onApprove, onReject }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
        {/* Card top accent */}
        <div className="h-1 w-full bg-orange-400" />
        <div className="p-5">
            <div className="flex justify-between items-start mb-4">
                <span className="bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                    Pending
                </span>
                <Clock size={14} className="text-gray-300 mt-1" />
            </div>

            {/* Tenant Info */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 overflow-hidden ring-2 ring-white shadow flex-shrink-0">
                    {booking.tenant.profile_photo ? (
                        <img src={getMediaUrl(booking.tenant.profile_photo)} alt={booking.tenant.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm">{booking.tenant.full_name[0]}</span>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-sm">{booking.tenant.full_name}</h3>
                    <p className="text-xs text-blue-600 font-semibold">{booking.room.title}</p>
                </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 mb-4 p-2.5 bg-blue-50 rounded-xl">
                <Calendar size={13} className="text-blue-500 flex-shrink-0" />
                <span className="text-xs font-bold text-blue-700">{booking.start_date} → {booking.end_date}</span>
            </div>

            {/* Contact */}
            <div className="space-y-2 mb-4 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-[9px] font-bold text-gray-400">@</span>
                    <span className="text-xs text-gray-500 truncate">{booking.tenant.email}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-[9px] font-bold text-gray-400">#</span>
                    <span className="text-xs text-gray-500">{booking.tenant.phone || 'No phone'}</span>
                </div>
            </div>

            {/* ID Document */}
            <div className="mb-5">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Citizenship / ID</span>
                {booking.tenant.identity_document ? (
                    <div className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-100 aspect-video border border-gray-100">
                        <img
                            src={getMediaUrl(booking.tenant.identity_document)}
                            alt="ID Document"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <a href={getMediaUrl(booking.tenant.identity_document)} target="_blank" rel="noreferrer"
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span className="text-white text-[11px] font-bold border border-white/50 px-3 py-1.5 rounded-lg">View Document</span>
                        </a>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-100">
                        <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
                        <span className="text-[11px] text-red-400 font-medium">No document uploaded</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button onClick={onApprove}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-green-200">
                    <Check size={13} /> Approve
                </button>
                <button onClick={onReject}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-red-200">
                    <X size={13} /> Reject
                </button>
            </div>
        </div>
    </div>
);

const HistoryRow = ({ booking }) => {
    const getStatusConfig = (s) => {
        if (s === 'Confirmed' || s === 'Active') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Confirmed' };
        if (s === 'Rejected') return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Rejected' };
        if (s === 'Cancelled') return { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: 'Cancelled' };
        return { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: s };
    };

    const cfg = getStatusConfig(booking.status);

    return (
        <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/70 transition group">
            {/* Tenant */}
            <div className="flex items-center gap-3 min-w-0 w-48">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0">
                    {booking.tenant.profile_photo ? (
                        <img src={getMediaUrl(booking.tenant.profile_photo)} alt={booking.tenant.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <span>{booking.tenant.full_name[0]}</span>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{booking.tenant.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{booking.room.title}</p>
                </div>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-600">{booking.start_date} – {booking.end_date}</span>
            </div>

            {/* Status badge */}
            <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {cfg.label}
            </span>

            {/* Date & email */}
            <div className="text-right w-36">
                <p className="text-xs font-semibold text-gray-500">{new Date(booking.updated_at).toLocaleDateString()}</p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{booking.tenant.email}</p>
            </div>
        </div>
    );
};

export default OwnerBookings;