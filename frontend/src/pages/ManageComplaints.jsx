import React, { useState, useEffect } from 'react';
import {
    AlertCircle, Search, Filter, Loader2, MessageSquare,
    CheckCircle, AlertTriangle, Clock, ChevronRight,
    User, Home as HomeIcon, Trash2
} from 'lucide-react';
import { adminService } from '../services/adminService';

export default function ManageComplaints({ user }) {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await adminService.getComplaints();
            setComplaints(data || []);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load incidents.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            setActionLoading(id);
            await adminService.updateComplaintStatus(id, status);
            setMessage({ type: 'success', text: `Incident marked as ${status}.` });
            fetchComplaints();
        } catch (error) {
            setMessage({ type: 'error', text: 'Status update failed.' });
        } finally {
            setActionLoading(id);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const filteredComplaints = complaints.filter(c => {
        const matchesSearch =
            c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.room?.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-4">
                        <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-100">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        Incident Reports
                    </h1>
                    <p className="text-gray-500 font-medium ml-1">Track and resolve complaints from tenants and owners.</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 mb-8 flex flex-col lg:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full text-left">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by subject, user, or property..."
                        className="w-full pl-16 pr-6 py-4 bg-gray-50 border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <div className="relative min-w-[200px] flex-1">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            className="w-full pl-12 pr-10 py-4 bg-gray-50 border-transparent rounded-[1.5rem] appearance-none focus:ring-4 focus:ring-blue-50 outline-none cursor-pointer font-bold text-sm text-gray-600"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Incidents</option>
                            <option value="Pending">Pending Review</option>
                            <option value="In Progress">Under Investigation</option>
                            <option value="Resolved">Resolved Cases</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-6 pb-12">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white h-48 rounded-[2rem] border border-gray-100 shadow-sm animate-pulse"></div>
                    ))
                ) : filteredComplaints.length === 0 ? (
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-24 text-center">
                        <MessageSquare className="w-20 h-20 text-gray-100 mx-auto mb-6" />
                        <p className="text-gray-400 font-black uppercase tracking-widest">No incident reports found</p>
                    </div>
                ) : (
                    filteredComplaints.map((complaint) => (
                        <div key={complaint.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group p-8 flex flex-col lg:flex-row gap-8 items-start text-left">
                            <div className="flex-1 w-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <StatusBadge status={complaint.status} />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(complaint.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-rose-600 transition-colors uppercase tracking-tight mb-2">
                                            {complaint.subject}
                                        </h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all font-bold" title="Close Case">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-gray-600 mb-8 font-medium leading-relaxed max-w-3xl">
                                    {complaint.description}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Reported By</p>
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{complaint.user?.full_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                            <HomeIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Linked Property</p>
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1">{complaint.room?.title}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 lg:justify-end">
                                        {complaint.status !== 'Resolved' && (
                                            <button
                                                onClick={() => handleUpdateStatus(complaint.id, 'Resolved')}
                                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Mark Resolved
                                            </button>
                                        )}
                                        {complaint.status === 'Pending' && (
                                            <button
                                                onClick={() => handleUpdateStatus(complaint.id, 'In Progress')}
                                                className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 font-black uppercase tracking-widest text-[10px]"
                                            >
                                                Investigate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        Pending: 'bg-rose-50 text-rose-600 border-rose-100',
        'In Progress': 'bg-amber-50 text-amber-600 border-amber-100',
        Resolved: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return (
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${configs[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
}
