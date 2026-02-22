import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, Clock, AlertTriangle, Search, Filter, MessageSquare, User, Home, ChevronRight, X, UserCheck, Info } from 'lucide-react';
import OwnerSidebar from '../components/OwnerSidebar';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, getMediaUrl } from '../constants/api';
import complaintService from '../services/complaintService';

export default function OwnerMaintenance({ user, onLogout }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await complaintService.getComplaints();
            // Filter to show maintenance and other issues for the owner
            setRequests(data);
        } catch (error) {
            console.error("Failed to fetch maintenance requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setUpdatingId(id);
            // API expects FormData for updates often, or JSON depending on backend
            // Our complaintService.updateComplaint handles both
            const updateData = { status: newStatus };

            await complaintService.updateComplaint(id, updateData);

            // Optimistic update
            setRequests(requests.map(req =>
                req.id === id ? { ...req, status: newStatus } : req
            ));
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Error updating status: " + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch =
            (req.tenant?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (req.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (req.complaint_type || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-50 text-green-600 border-green-100';
            case 'Investigating': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-orange-50 text-orange-600 border-orange-100';
        }
    };

    const StatusBadge = ({ status }) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(status)}`}>
            {status}
        </span>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <OwnerSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-6xl mx-auto space-y-8">

                        {/* Header & Stats */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Maintenance & Issues</h1>
                                <p className="text-gray-500">Track and fix reported problems across your properties</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search description/tenant..."
                                        className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                                    {['All', 'Pending', 'Investigating', 'Resolved'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === status
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-gray-500 hover:text-gray-900'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 shadow-sm">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="text-blue-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 font-display">All clear!</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">No maintenance requests found matching your filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                                {filteredRequests.map((req) => (
                                    <div key={req.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition duration-300 group">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-xl ${req.complaint_type === 'Maintenance' ? 'bg-orange-50 text-orange-600' :
                                                        req.complaint_type === 'Security' ? 'bg-red-50 text-red-600' :
                                                            'bg-gray-50 text-gray-600'
                                                        }`}>
                                                        {req.complaint_type === 'Maintenance' ? <Wrench size={20} /> : <Info size={20} />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{req.complaint_type}</h3>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                                                            ID: {req.id} • {new Date(req.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={req.status} />
                                            </div>

                                            <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                                                {req.description}
                                            </p>

                                            {req.image && (
                                                <div className="mb-6 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 h-44 relative">
                                                    <img
                                                        src={getMediaUrl(req.image)}
                                                        alt="Evidence"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 py-4 border-t border-gray-50 mb-6">
                                                <img
                                                    src={req.tenant?.profile_photo || `https://ui-avatars.com/api/?name=${req.tenant?.full_name || 'Tenant'}&background=eff6ff&color=3b82f6&bold=true`}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                                    alt={req.tenant?.full_name}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900">{req.tenant?.full_name || 'Anonymous Tenant'}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <Home size={12} />
                                                        <span>{req.room?.title || 'Unknown Property'}</span>
                                                    </div>
                                                </div>
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
                                                    <MessageSquare size={18} />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {req.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(req.id, 'Investigating')}
                                                        disabled={updatingId === req.id}
                                                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                                                    >
                                                        {updatingId === req.id ? (
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        ) : <>
                                                            <Clock size={14} /> Start Investigation
                                                        </>}
                                                    </button>
                                                )}
                                                {req.status === 'Investigating' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(req.id, 'Resolved')}
                                                        disabled={updatingId === req.id}
                                                        className="flex-1 bg-green-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                                                    >
                                                        {updatingId === req.id ? (
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        ) : <>
                                                            <CheckCircle size={14} /> Mark as Resolved
                                                        </>}
                                                    </button>
                                                )}
                                                {req.status === 'Resolved' && (
                                                    <div className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-gray-100">
                                                        <UserCheck size={14} /> Request Fulfilled
                                                    </div>
                                                )}
                                                {req.status !== 'Resolved' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(req.id, 'Resolved')}
                                                        disabled={updatingId === req.id}
                                                        className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition border border-transparent hover:border-green-100"
                                                        title="Quick Resolve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
