import React, { useState, useEffect } from 'react';
import TenantSidebar from '../components/TenantSidebar';
import {
    Calendar, MapPin, Clock, CheckCircle, XCircle,
    CalendarDays, Eye, ArrowRight, Home
} from 'lucide-react';
import { visitService } from '../services/tenantService';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../constants/api';

export default function TenantVisits({ user }) {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchVisits();
    }, [fetchVisits]);

    const fetchVisits = React.useCallback(async () => {
        try {
            const data = await visitService.getAllVisits();
            const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setVisits(sorted);
        } catch (error) {
            console.error("Failed to fetch visits", error);
        } finally {
            setLoading(false);
        }
    }, []);

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

    const filterTabs = [
        { label: 'All', key: 'All' },
        { label: 'Pending', key: 'Pending' },
        { label: 'Scheduled', key: 'Scheduled' },
        { label: 'Completed', key: 'Completed' },
        { label: 'Cancelled', key: 'Cancelled' },
        { label: 'Rejected', key: 'Rejected' },
    ];

    const getCount = (key) => {
        if (key === 'All') return visits.length;
        return visits.filter(v => v.status === key || (key === 'Scheduled' && v.status === 'Approved')).length;
    };

    const filteredVisits = visits.filter(v => {
        if (filter === 'All') return true;
        if (filter === 'Scheduled') return v.status === 'Scheduled' || v.status === 'Approved';
        return v.status === filter;
    });

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Pending':
                return { pill: 'bg-orange-50 text-orange-500 border border-orange-200', dot: 'bg-orange-400', label: 'Pending' };
            case 'Approved':
            case 'Scheduled':
                return { pill: 'bg-green-50 text-green-600 border border-green-200', dot: 'bg-green-500', label: 'Scheduled' };
            case 'Rejected':
                return { pill: 'bg-red-50 text-red-500 border border-red-200', dot: 'bg-red-500', label: 'Rejected' };
            case 'Cancelled':
                return { pill: 'bg-gray-100 text-gray-500 border border-gray-200', dot: 'bg-gray-400', label: 'Cancelled' };
            case 'Completed':
                return { pill: 'bg-blue-50 text-blue-600 border border-blue-200', dot: 'bg-blue-500', label: 'Completed' };
            default:
                return { pill: 'bg-gray-100 text-gray-500 border border-gray-200', dot: 'bg-gray-400', label: status };
        }
    };

    const getDateBoxStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-orange-50 border-orange-100 text-orange-600';
            case 'Approved':
            case 'Scheduled': return 'bg-green-50 border-green-100 text-green-600';
            case 'Completed': return 'bg-blue-50 border-blue-100 text-blue-600';
            case 'Rejected': return 'bg-red-50 border-red-100 text-red-500';
            default: return 'bg-gray-50 border-gray-200 text-gray-500';
        }
    };

    // Stat counts
    const pendingCount = visits.filter(v => v.status === 'Pending').length;
    const scheduledCount = visits.filter(v => v.status === 'Scheduled' || v.status === 'Approved').length;
    const completedCount = visits.filter(v => v.status === 'Completed').length;
    const cancelledCount = visits.filter(v => v.status === 'Cancelled' || v.status === 'Rejected').length;

    const statCards = [
        { label: 'TOTAL VISITS', value: visits.length, icon: <CalendarDays className="w-5 h-5 text-blue-500" />, iconBg: 'bg-blue-50', border: 'border-t-blue-500', color: 'text-gray-900' },
        { label: 'PENDING', value: pendingCount, icon: <Clock className="w-5 h-5 text-orange-500" />, iconBg: 'bg-orange-50', border: 'border-t-orange-500', color: pendingCount > 0 ? 'text-orange-500' : 'text-gray-900' },
        { label: 'SCHEDULED', value: scheduledCount, icon: <CheckCircle className="w-5 h-5 text-green-500" />, iconBg: 'bg-green-50', border: 'border-t-green-500', color: 'text-gray-900' },
        { label: 'COMPLETED', value: completedCount, icon: <Eye className="w-5 h-5 text-red-400" />, iconBg: 'bg-red-50', border: 'border-t-red-400', color: 'text-gray-900' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-auto">
            <TenantSidebar user={user} />

            <div className="flex-1 flex flex-col min-w-0 overflow-auto">
                <main className="p-8">

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">My Visits</h2>
                        <p className="text-sm text-gray-400 mt-0.5">Track and manage your room visit requests</p>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                        {statCards.map((card, i) => (
                            <div key={i} className={`bg-white rounded-xl border-t-4 ${card.border} shadow-sm p-5 flex flex-col gap-3`}>
                                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                                    {card.icon}
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                                    <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Visit Directory Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* Panel Header with filter tabs */}
                        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Visit Directory</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{filteredVisits.length} visit{filteredVisits.length !== 1 ? 's' : ''} found</p>
                            </div>

                            {/* Filter tabs */}
                            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
                                {filterTabs.map(tab => {
                                    const count = getCount(tab.key);
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => setFilter(tab.key)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                                filter === tab.key
                                                    ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {tab.label}
                                            {count > 0 && tab.key !== 'All' && (
                                                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                    filter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="flex flex-col items-center gap-3 py-20">
                                    <div className="w-9 h-9 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm font-medium text-gray-400">Loading visits...</p>
                                </div>
                            ) : filteredVisits.length === 0 ? (
                                <div className="flex flex-col items-center gap-4 py-20 text-gray-400">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                        <CalendarDays className="w-7 h-7 text-gray-300" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-gray-500 mb-1">No visits found</p>
                                        <p className="text-xs">You haven't requested any room viewings yet</p>
                                    </div>
                                    <Link
                                        to="/tenant/search"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm shadow-blue-200"
                                    >
                                        <Home className="w-4 h-4" /> Browse Rooms
                                    </Link>
                                </div>
                            ) : (
                                filteredVisits.map((visit) => {
                                    const statusConfig = getStatusConfig(visit.status);
                                    const roomImage = visit.room.images?.length > 0
                                        ? getMediaUrl(visit.room.images[0].image)
                                        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop';

                                    return (
                                        <div
                                            key={visit.id}
                                            className="px-6 py-5 flex items-center gap-6 hover:bg-gray-50/60 transition-colors"
                                        >
                                            {/* Room Image */}
                                            <div className="w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                                <img
                                                    src={roomImage}
                                                    alt={visit.room.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Room Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                                                            {visit.room.title}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            <span>{visit.room.location}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide flex-shrink-0 ${statusConfig.pill}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                                        {statusConfig.label}
                                                    </span>
                                                </div>

                                                {/* Date + Time */}
                                                <div className="flex items-center gap-5">
                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${getDateBoxStyle(visit.status)}`}>
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(visit.visit_date).toLocaleDateString('en-US', {
                                                            weekday: 'short', month: 'short', day: 'numeric'
                                                        })}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                        {visit.visit_time?.slice(0, 5)}
                                                    </div>
                                                    {visit.purpose && (
                                                        <span className="text-xs text-gray-400 italic">"{visit.purpose}"</span>
                                                    )}
                                                </div>

                                                {/* Confirmed banner */}
                                                {(visit.status === 'Scheduled' || visit.status === 'Approved') && (
                                                    <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-semibold px-3 py-2 rounded-lg w-fit">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Visit confirmed! Please arrive on time.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Link
                                                    to={`/room/${visit.room.id}`}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 text-gray-600 rounded-xl text-xs font-bold transition"
                                                >
                                                    View Room <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                                {(visit.status === 'Pending' || visit.status === 'Scheduled' || visit.status === 'Approved') && (
                                                    <button
                                                        onClick={() => handleCancel(visit.id)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 rounded-xl text-xs font-bold transition"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {!loading && filteredVisits.length > 0 && (
                            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30">
                                <p className="text-xs text-gray-400 font-medium">
                                    Showing <span className="font-bold text-gray-700">{filteredVisits.length}</span> of{' '}
                                    <span className="font-bold text-gray-700">{visits.length}</span> total visits
                                </p>
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}