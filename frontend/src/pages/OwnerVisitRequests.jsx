import React, { useState, useEffect } from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import OwnerHeader from '../components/OwnerHeader';
import {
    Calendar,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    Filter,
    Search,
    MoreVertical,
    CalendarDays
} from 'lucide-react';
import { visitService } from '../services/tenantService';
import { getMediaUrl } from '../constants/api';
import TenantDetailsModal from '../components/TenantDetailsModal';

export default function OwnerVisitRequests({ user, onLogout }) {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All Requests');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleStatusUpdate = async (visitId, newStatus) => {
        try {
            if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this visit?`)) return;

            await visitService.updateVisitStatus(visitId, newStatus);

            // Update local state
            setVisits(visits.map(v =>
                v.id === visitId ? { ...v, status: newStatus } : v
            ));

            alert(`Visit ${newStatus.toLowerCase()} successfully!`);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status. Please try again.");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-orange-100 text-orange-600';
            case 'Approved':
            case 'Scheduled': return 'bg-green-100 text-green-600';
            case 'Rejected':
            case 'Cancelled': return 'bg-red-100 text-red-600';
            case 'Completed': return 'bg-gray-100 text-gray-600';
            default: return 'bg-blue-100 text-blue-600';
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
    const todayCount = visits.filter(v =>
        new Date(v.visit_date).toDateString() === new Date().toDateString()
    ).length;

    const handleOpenModal = (tenant) => {
        setSelectedTenant(tenant);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTenant(null);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <OwnerSidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <OwnerHeader
                    user={user}
                    title="Visit Requests"
                    subtitle="Manage tenant viewing schedules and approvals."
                    onLogout={onLogout}
                />

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-6xl mx-auto flex gap-8">

                        {/* Left Sidebar / Filters */}
                        <div className="w-64 space-y-6 hidden lg:block">
                            <div className="bg-white p-4 rounded-xl border shadow-sm">
                                <h3 className="font-bold text-gray-700 mb-4">Quick Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Pending</span>
                                        <span className="text-sm font-bold text-orange-500">{pendingCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Today</span>
                                        <span className="text-sm font-bold text-blue-500">{todayCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Total</span>
                                        <span className="text-sm font-bold text-gray-700">{visits.length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border shadow-sm">
                                <h3 className="font-bold text-gray-700 mb-4">Status</h3>
                                <div className="space-y-2">
                                    {['All Requests', 'Pending', 'Scheduled', 'Completed', 'Rejected'].map(opt => (
                                        <div
                                            key={opt}
                                            onClick={() => setFilter(opt)}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition ${filter === opt ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {opt}
                                            {opt === 'Pending' && pendingCount > 0 && (
                                                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                                                    {pendingCount}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 space-y-6">

                            {/* Toolbar */}
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by tenant name or room..."
                                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50">
                                    <Filter className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">Filter</span>
                                </button>
                                <div className="relative">
                                    <select
                                        className="appearance-none px-4 py-2 pr-8 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                    >
                                        <option>Date (Newest)</option>
                                        <option>Date (Oldest)</option>
                                    </select>
                                </div>
                            </div>

                            {/* List */}
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading requests...</p>
                                </div>
                            ) : filteredVisits.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredVisits.map(visit => (
                                        <div key={visit.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">

                                            {/* Date Box */}
                                            <div className={`p-4 rounded-xl text-center min-w-[100px] ${visit.status === 'Pending' ? 'bg-orange-50 text-orange-700' :
                                                visit.status === 'Scheduled' || visit.status === 'Approved' ? 'bg-green-50 text-green-700' :
                                                    'bg-gray-50 text-gray-700'
                                                }`}>
                                                <div className="text-2xl font-bold">
                                                    {new Date(visit.visit_date).getDate()}
                                                </div>
                                                <div className="text-xs font-bold uppercase mt-1">
                                                    {new Date(visit.visit_date).toLocaleDateString('en-US', { month: 'short' })}
                                                </div>
                                                <div className="text-xs mt-1 opacity-80">
                                                    {visit.visit_time.slice(0, 5)}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1 cursor-pointer group" onClick={() => handleOpenModal(visit.tenant)}>
                                                    <img
                                                        src={visit.tenant.profile_photo ? getMediaUrl(visit.tenant.profile_photo) : `https://ui-avatars.com/api/?name=${visit.tenant.full_name}&background=random`}
                                                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                        alt=""
                                                    />
                                                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                                                        {visit.tenant.full_name}
                                                    </h3>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(visit.status)}`}>
                                                        {visit.status === 'Approved' ? 'Scheduled' : visit.status}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {visit.room.title}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        30 mins (Est.)
                                                    </div>
                                                </div>

                                                {visit.purpose && (
                                                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg inline-block">
                                                        "{visit.purpose}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                                                {visit.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(visit.id, 'Scheduled')}
                                                            className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(visit.id, 'Rejected')}
                                                            className="flex-1 md:flex-none px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}

                                                {(visit.status === 'Scheduled' || visit.status === 'Approved') && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(visit.id, 'Completed')}
                                                        className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                                                    >
                                                        Mark Completed
                                                    </button>
                                                )}

                                                {visit.status === 'Rejected' && (
                                                    <span className="text-red-500 font-medium text-sm">Request Rejected</span>
                                                )}

                                                {visit.status === 'Completed' && (
                                                    <span className="text-green-500 font-medium text-sm flex items-center gap-1">
                                                        <CheckCircle className="w-4 h-4" /> Completed
                                                    </span>
                                                )}

                                            </div>

                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                    <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
                                    <p className="text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Tenant Details Modal */}
            <TenantDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                tenant={selectedTenant}
            />
        </div>
    );
}
