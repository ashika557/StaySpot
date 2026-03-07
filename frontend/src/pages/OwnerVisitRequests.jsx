import React, { useState, useEffect } from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import {
    Calendar,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    CalendarDays,
    Users,
    AlertCircle,
    Eye,
} from 'lucide-react';
import { visitService } from '../services/tenantService';
import { getMediaUrl } from '../constants/api';
import TenantDetailsModal from '../components/TenantDetailsModal';

export default function OwnerVisitRequests({ user, onLogout }) {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All Requests');
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedTenant, setSelectedTenant] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        try {
            const data = await visitService.getAllVisits();
            const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setVisits(sorted);
        } catch (error) {
            console.error("Failed to fetch visits", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (visitId, newStatus) => {
        try {
            if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this visit?`)) return;
            await visitService.updateVisitStatus(visitId, newStatus);
            setVisits(visits.map(v => v.id === visitId ? { ...v, status: newStatus } : v));
            alert(`Visit ${newStatus.toLowerCase()} successfully!`);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status. Please try again.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-orange-50 text-orange-500 border border-orange-200';
            case 'Approved':
            case 'Scheduled':
                return 'bg-green-50 text-green-600 border border-green-200';
            case 'Rejected':
            case 'Cancelled':
                return 'bg-red-50 text-red-500 border border-red-200';
            case 'Completed':
                return 'bg-gray-100 text-gray-500 border border-gray-200';
            default:
                return 'bg-blue-50 text-blue-600 border border-blue-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Pending': return 'bg-orange-400';
            case 'Approved':
            case 'Scheduled': return 'bg-green-500';
            case 'Rejected':
            case 'Cancelled': return 'bg-red-500';
            case 'Completed': return 'bg-gray-400';
            default: return 'bg-blue-500';
        }
    };

    const getDateBoxStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-orange-50 text-orange-600 border border-orange-100';
            case 'Approved':
            case 'Scheduled': return 'bg-green-50 text-green-600 border border-green-100';
            case 'Rejected':
            case 'Cancelled': return 'bg-red-50 text-red-500 border border-red-100';
            case 'Completed': return 'bg-gray-50 text-gray-500 border border-gray-200';
            default: return 'bg-blue-50 text-blue-600 border border-blue-100';
        }
    };

    const filteredVisits = visits.filter(visit => {
        const matchesFilter = filter === 'All Requests' || visit.status === filter;
        const matchesSearch =
            visit.tenant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.room.title?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const pendingCount = visits.filter(v => v.status === 'Pending').length;
    const scheduledCount = visits.filter(v => v.status === 'Scheduled' || v.status === 'Approved').length;
    const completedCount = visits.filter(v => v.status === 'Completed').length;
    const rejectedCount = visits.filter(v => v.status === 'Rejected' || v.status === 'Cancelled').length;

    const statCards = [
        {
            label: 'TOTAL REQUESTS',
            value: visits.length,
            subtext: 'All visit requests',
            icon: <CalendarDays className="w-6 h-6 text-blue-500" />,
            iconBg: 'bg-blue-50',
            borderColor: 'border-t-blue-500',
            valueColor: 'text-gray-900',
        },
        {
            label: 'PENDING',
            value: pendingCount,
            subtext: 'Awaiting your response',
            icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
            iconBg: 'bg-orange-50',
            borderColor: 'border-t-orange-500',
            valueColor: pendingCount > 0 ? 'text-orange-500' : 'text-gray-900',
        },
        {
            label: 'SCHEDULED',
            value: scheduledCount,
            subtext: 'Upcoming visits',
            icon: <Calendar className="w-6 h-6 text-green-500" />,
            iconBg: 'bg-green-50',
            borderColor: 'border-t-green-500',
            valueColor: 'text-gray-900',
        },
        {
            label: 'COMPLETED',
            value: completedCount,
            subtext: `${rejectedCount} rejected`,
            icon: <CheckCircle className="w-6 h-6 text-red-400" />,
            iconBg: 'bg-red-50',
            borderColor: 'border-t-red-400',
            valueColor: 'text-gray-900',
        },
    ];

    const filterTabs = ['All Requests', 'Pending', 'Scheduled', 'Completed', 'Rejected'];

    const handleOpenModal = (tenant) => {
        setSelectedTenant(tenant);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTenant(null);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-auto">
            <OwnerSidebar user={user} />

            <div className="flex-1 flex flex-col min-w-0 overflow-auto">
                <main className="p-8">

                    {/* Page Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Visit Requests</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Manage and respond to tenant visit requests</p>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                        {statCards.map((card, i) => (
                            <div
                                key={i}
                                className={`bg-white rounded-xl border-t-4 ${card.borderColor} shadow-sm p-5 flex flex-col gap-3`}
                            >
                                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                                    {card.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
                                    <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{card.subtext}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Visit Directory Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* Panel Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Visit Directory</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{filteredVisits.length} request{filteredVisits.length !== 1 ? 's' : ''} found</p>
                            </div>

                            {/* Search + Filter Tabs */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search tenant or room..."
                                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-56 transition"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg p-1">
                                    {filterTabs.map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setFilter(tab)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                                filter === tab
                                                    ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {tab}
                                            {tab === 'Pending' && pendingCount > 0 && (
                                                <span className="ml-1.5 bg-orange-100 text-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                    {pendingCount}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                                    <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm font-medium">Loading requests...</p>
                                </div>
                            ) : filteredVisits.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                        <CalendarDays className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-500">No requests found</p>
                                    <p className="text-xs">Try adjusting your filters or search terms</p>
                                </div>
                            ) : (
                                filteredVisits.map((visit) => (
                                    <div
                                        key={visit.id}
                                        className="px-6 py-5 flex flex-col md:flex-row items-start md:items-center gap-5 hover:bg-gray-50/60 transition-colors"
                                    >
                                        {/* Date Box */}
                                        <div className={`rounded-xl p-3 text-center min-w-[72px] ${getDateBoxStyle(visit.status)}`}>
                                            <div className="text-2xl font-bold leading-none">
                                                {new Date(visit.visit_date).getDate()}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase mt-1 opacity-80">
                                                {new Date(visit.visit_date).toLocaleDateString('en-US', { month: 'short' })}
                                            </div>
                                            <div className="text-[10px] mt-1 font-medium opacity-70">
                                                {visit.visit_time.slice(0, 5)}
                                            </div>
                                        </div>

                                        {/* Tenant Info */}
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="flex items-center gap-3 mb-2 cursor-pointer group"
                                                onClick={() => handleOpenModal(visit.tenant)}
                                            >
                                                <img
                                                    src={
                                                        visit.tenant.profile_photo
                                                            ? getMediaUrl(visit.tenant.profile_photo)
                                                            : `https://ui-avatars.com/api/?name=${visit.tenant.full_name}&background=eff6ff&color=3b82f6&bold=true`
                                                    }
                                                    className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {visit.tenant.full_name}
                                                    </p>
                                                    {visit.tenant.email && (
                                                        <p className="text-xs text-gray-400">{visit.tenant.email}</p>
                                                    )}
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(visit.status)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(visit.status)}`} />
                                                    {visit.status === 'Approved' ? 'Scheduled' : visit.status}
                                                </span>
                                            </div>

                                            <div className="flex items-center flex-wrap gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="font-medium text-gray-600">{visit.room.title}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>30 mins (Est.)</span>
                                                </div>
                                                {visit.purpose && (
                                                    <span className="text-gray-500 italic">"{visit.purpose}"</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {visit.status === 'Pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(visit.id, 'Scheduled')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition shadow-sm shadow-green-100"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(visit.id, 'Rejected')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-lg text-xs font-bold transition"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {(visit.status === 'Scheduled' || visit.status === 'Approved') && (
                                                <button
                                                    onClick={() => handleStatusUpdate(visit.id, 'Completed')}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm shadow-blue-100"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Mark Completed
                                                </button>
                                            )}

                                            {visit.status === 'Rejected' && (
                                                <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Rejected
                                                </span>
                                            )}

                                            {visit.status === 'Cancelled' && (
                                                <span className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Cancelled
                                                </span>
                                            )}

                                            {visit.status === 'Completed' && (
                                                <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Completed
                                                </span>
                                            )}

                                            {/* View tenant button */}
                                            <button
                                                onClick={() => handleOpenModal(visit.tenant)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-blue-500 transition"
                                                title="View tenant details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {!loading && filteredVisits.length > 0 && (
                            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30">
                                <p className="text-xs text-gray-400 font-medium">
                                    Showing <span className="font-bold text-gray-700">{filteredVisits.length}</span> of{' '}
                                    <span className="font-bold text-gray-700">{visits.length}</span> total requests
                                </p>
                            </div>
                        )}
                    </div>

                </main>
            </div>

            <TenantDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                tenant={selectedTenant}
            />
        </div>
    );
}