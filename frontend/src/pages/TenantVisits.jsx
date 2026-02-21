import React, { useState, useEffect } from 'react';
import TenantSidebar from '../components/TenantSidebar';
import {
    Calendar,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    MoreVertical,
    CalendarDays,
    Eye,
    AlertCircle
} from 'lucide-react';
import { visitService } from '../services/tenantService';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../constants/api';

export default function TenantVisits({ user }) {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All Requests');

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        try {
            const data = await visitService.getAllVisits();
            // Sort by date descending
            const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setVisits(sorted);
        } catch (error) {
            console.error("Failed to fetch visits", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (visitId) => {
        if (!window.confirm("Are you sure you want to cancel this visit request?")) return;
        try {
            await visitService.updateVisitStatus(visitId, 'Cancelled');
            setVisits(visits.map(v => v.id === visitId ? { ...v, status: 'Cancelled' } : v));
        } catch (error) {
            console.error("Failed to cancel visit", error);
            alert("Failed to cancel visit.");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-orange-100 text-orange-600';
            case 'Approved':
            case 'Scheduled': return 'bg-green-100 text-green-600';
            case 'Rejected': return 'bg-red-100 text-red-600';
            case 'Cancelled': return 'bg-gray-100 text-gray-600';
            case 'Completed': return 'bg-blue-100 text-blue-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const filteredVisits = visits.filter(visit => {
        if (filter === 'All Requests') return true;
        return visit.status === filter;
    });

    return (
        <div className="flex h-screen bg-gray-50 overflow-auto">
            <TenantSidebar user={user} />

            <div className="flex-1 flex flex-col">
                <div className="flex-1 p-8">
                    <div className="max-w-5xl mx-auto">

                        {/* Filters */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            {['All Requests', 'Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setFilter(opt)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${filter === opt ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border hover:bg-gray-50'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading visits...</p>
                            </div>
                        ) : filteredVisits.length > 0 ? (
                            <div className="space-y-4">
                                {filteredVisits.map(visit => (
                                    <div key={visit.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Room Image */}
                                            <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                                <img
                                                    src={visit.room.images && visit.room.images.length > 0
                                                        ? getMediaUrl(visit.room.images[0].image)
                                                        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'}
                                                    alt={visit.room.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-900 mb-1">{visit.room.title}</h3>
                                                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                                                            <MapPin className="w-4 h-4" />
                                                            {visit.room.location}
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(visit.status)}`}>
                                                        {visit.status === 'Approved' ? 'Scheduled' : visit.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-500" />
                                                        <span className="font-medium">
                                                            {new Date(visit.visit_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-blue-500" />
                                                        <span className="font-medium">
                                                            {visit.visit_time.slice(0, 5)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Message/Note */}
                                                {(visit.status === 'Scheduled' || visit.status === 'Approved') && (
                                                    <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg flex items-start gap-2 mb-3">
                                                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                        <div>
                                                            <strong>Visit Confirmed!</strong> The owner has accepted your request. Please arrive on time.
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-50">
                                                    <Link to={`/room/${visit.room.id}`} className="text-sm font-bold text-gray-600 hover:text-blue-600">
                                                        View Room Details
                                                    </Link>

                                                    {(visit.status === 'Pending' || visit.status === 'Scheduled' || visit.status === 'Approved') && (
                                                        <button
                                                            onClick={() => handleCancel(visit.id)}
                                                            className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                                                        >
                                                            Cancel Visit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No visits found</h3>
                                <p className="text-gray-500 mt-1 mb-6">You haven't requested any room viewings yet.</p>
                                <Link to="/tenant/search" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
                                    Browse Rooms
                                </Link>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
