import React, { useState, useEffect } from 'react';
import { Check, X, Calendar, Clock, ChevronDown } from 'lucide-react';
import OwnerSidebar from '../components/OwnerSidebar';
import { bookingService } from '../services/bookingService';
import { getMediaUrl } from '../constants/api';
import OwnerHeader from '../components/OwnerHeader';
import Footer from '../components/Footer';

const OwnerBookings = ({ user, onLogout }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRoom, setFilterRoom] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

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

    const handleUpdateStatus = async (id, status) => {
        try {
            await bookingService.updateBookingStatus(id, status);
            fetchBookings(); // Refresh list to update UI
        } catch (err) {
            alert(`Failed to ${status.toLowerCase()} booking`);
        }
    };

    // Derived stats
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'Pending').length,
        approved: bookings.filter(b => ['Confirmed', 'Active'].includes(b.status)).length,
        rejected: bookings.filter(b => ['Rejected', 'Cancelled'].includes(b.status)).length,
    };

    // Filter Logic
    const filteredBookings = bookings.filter(b => {
        if (filterStatus !== 'All' && b.status !== filterStatus) return false;
        if (filterRoom !== 'All' && b.room.title !== filterRoom) return false;
        return true;
    });

    const pendingRequests = filteredBookings.filter(b => b.status === 'Pending');
    const history = filteredBookings.filter(b => b.status !== 'Pending');

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <OwnerSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-auto">

                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Filters & Actions</h1>
                        </div>
                        <div className="flex gap-4">
                            {/* Room Filter Mock */}
                            <select
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
                                value={filterRoom}
                                onChange={(e) => setFilterRoom(e.target.value)}
                            >
                                <option value="All">All Rooms</option>
                                {[...new Set(bookings.map(b => b.room.title))].map(title => (
                                    <option key={title} value={title}>{title}</option>
                                ))}
                            </select>

                            <select
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
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

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <StatCard label="Total Requests" value={stats.total} color="bg-blue-100 text-blue-600" />
                        <StatCard label="Pending" value={stats.pending} color="bg-orange-100 text-orange-600" />
                        <StatCard label="Approved" value={stats.approved} color="bg-green-100 text-green-600" />
                        <StatCard label="Rejected" value={stats.rejected} color="bg-red-100 text-red-600" />
                    </div>

                    {/* Pending Requests Grid */}
                    {pendingRequests.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Pending Requests</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                    {/* Recent History List */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-800">
                            Recent Booking History
                        </div>
                        <div className="divide-y divide-gray-50">
                            {history.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No history available</div>
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

const StatCard = ({ label, value, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
            <div className="text-gray-500 text-sm font-medium">{label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${color}`}>
            {/* Icon placeholder */}
            #
        </div>
    </div>
);

const RequestCard = ({ booking, onApprove, onReject }) => {
    // Calculate time ago (mock)
    const timeAgo = "2 hours ago";

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>
                <Clock size={14} className="text-gray-400" />
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 overflow-hidden">
                    {booking.tenant.profile_photo ? (
                        <img src={getMediaUrl(booking.tenant.profile_photo)} alt={booking.tenant.full_name} className="w-full h-full object-cover" />
                    ) : (
                        booking.tenant.full_name[0]
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">{booking.tenant.full_name}</h3>
                    <div className="text-xs text-blue-600 font-medium">{booking.room.title}</div>
                </div>
            </div>

            <div className="text-xs text-gray-500 space-y-3 mb-6">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" />
                    <span className="font-medium text-gray-700">{booking.start_date} - {booking.end_date}</span>
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-1 gap-2 border-t pt-3">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-400 w-4 font-mono">@</span>
                        <span className="truncate">{booking.tenant.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-400 w-4 font-mono">#</span>
                        <span>{booking.tenant.phone || 'No phone'}</span>
                    </div>
                </div>

                {/* Identity Preview */}
                <div className="border-t pt-3">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Citizenship/ID</span>
                    {booking.tenant.identity_document ? (
                        <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 aspect-video">
                            <img
                                src={getMediaUrl(booking.tenant.identity_document)}
                                alt="ID Document"
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                            <a
                                href={getMediaUrl(booking.tenant.identity_document)}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="text-white text-[10px] font-bold underline">View Document</span>
                            </a>
                        </div>
                    ) : (
                        <div className="text-[10px] italic text-red-400">No document uploaded</div>
                    )}
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onApprove}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition"
                >
                    Approve
                </button>
                <button
                    onClick={onReject}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition"
                >
                    Reject
                </button>
            </div>
        </div>
    );
};

const HistoryRow = ({ booking }) => {
    const getStatusStyle = (s) => {
        if (s === 'Confirmed' || s === 'Active') return 'bg-green-100 text-green-700';
        if (s === 'Rejected') return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-sm overflow-hidden">
                    {booking.tenant.profile_photo ? (
                        <img src={getMediaUrl(booking.tenant.profile_photo)} alt={booking.tenant.full_name} className="w-full h-full object-cover" />
                    ) : (
                        booking.tenant.full_name[0]
                    )}
                </div>
                <div>
                    <div className="font-bold text-gray-900 text-sm">{booking.tenant.full_name}</div>
                    <div className="text-xs text-gray-500">{booking.room.title}</div>
                </div>
            </div>

            <div className="text-sm text-gray-600 font-medium">
                {booking.start_date} - {booking.end_date}
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase w-24 text-center ${getStatusStyle(booking.status)}`}>
                {booking.status === 'Active' ? 'Confirmed' : booking.status}
            </span>

            <div className="text-xs text-gray-400 font-medium w-32 text-right">
                <div>{new Date(booking.updated_at).toLocaleDateString()}</div>
                <div className="mt-1 truncate">{booking.tenant.email}</div>
            </div>
        </div>
    );
};

export default OwnerBookings;
