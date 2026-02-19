import React, { useState, useEffect } from 'react';
import {
    AlertCircle,
    Search,
    Filter,
    CheckCircle,
    Clock,
    Eye,
    MoreVertical,
    MessageSquare,
    Building,
    User,
    Activity,
    ChevronRight,
    Loader2,
    Calendar,
    AlertTriangle
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS } from '../constants/api';

export default function ManageComplaints({ user }) {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await apiRequest(API_ENDPOINTS.COMPLAINTS);
            if (response.ok) {
                const data = await response.json();
                setComplaints(data);
            }
        } catch (error) {
            console.error('Failed to fetch complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (complaintId, newStatus) => {
        try {
            setActionLoading(complaintId);
            const response = await apiRequest(`${API_ENDPOINTS.COMPLAINTS}${complaintId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setComplaints(complaints.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
            }
        } catch (error) {
            console.error('Failed to update complaint status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredComplaints = complaints.filter(c => {
        const matchesSearch =
            (c.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.tenant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        const styles = {
            Pending: 'bg-amber-100 text-amber-700 border-amber-200',
            Investigating: 'bg-blue-100 text-blue-700 border-blue-200',
            Resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
        return styles[status] || styles.Pending;
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <AdminSidebar user={user} />

            <main className="flex-1 lg:ml-64 p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="w-7 h-7 text-indigo-600" />
                            Complaints & Support
                        </h1>
                        <p className="text-gray-500 mt-1">Review, track, and resolve system-wide tenant and owner issues.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search complaints, users, or descriptions..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-48">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none outline-none cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Investigating">Investigating</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                        <button
                            onClick={fetchComplaints}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            <Loader2 className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Complaints Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Issue Details</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Parties Involved</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Posted Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-6 py-10 h-16 bg-gray-50/30"></td>
                                        </tr>
                                    ))
                                ) : filteredComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-gray-500 font-medium">
                                            No complaints found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComplaints.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 max-w-md">
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${c.status === 'Resolved' ? 'bg-emerald-500' : c.status === 'Investigating' ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'
                                                        }`}></div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{c.complaint_type || 'General Issue'}</div>
                                                        <div className="text-gray-500 line-clamp-2 mt-1 italic">"{c.description}"</div>
                                                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                                                            <Building className="w-3 h-3" /> ROOM_ID: {c.room_id || 'Global'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">T</div>
                                                        <span className="text-gray-700 font-medium">{c.tenant?.full_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold">O</div>
                                                        <span className="text-gray-700 font-medium">{c.owner?.full_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(c.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(c.status)}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <select
                                                        className="bg-transparent text-xs text-gray-500 outline-none cursor-pointer hover:text-indigo-600 font-medium"
                                                        value={c.status}
                                                        onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                                                        disabled={actionLoading === c.id}
                                                    >
                                                        <option value="Pending">Mark Pending</option>
                                                        <option value="Investigating">Mark Investigating</option>
                                                        <option value="Resolved">Mark Resolved</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
