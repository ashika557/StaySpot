import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle, Search, Filter, Loader2, MessageSquare,
    Clock, ChevronRight, Home, Shield
} from 'lucide-react';
import { adminService } from '../services/adminService';

export default function AdminComplaintRegistry({ user }) {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await adminService.getComplaints();
            setComplaints(data || []);
        } catch (error) {
            console.error('Failed to fetch complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            setActionLoading(id);
            await adminService.updateComplaintStatus(id, status);
            fetchComplaints();
        } catch (error) {
            alert('Failed to update complaint status');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredComplaints = useMemo(() => {
        return complaints.filter(c => {
            const matchesSearch = 
                c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
            const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [complaints, searchTerm, statusFilter, priorityFilter]);

    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
        critical: complaints.filter(c => (c.priority === 'High' || c.priority === 'Priority Alpha')).length
    };

    return (
        <div className="max-w-[1200px] mx-auto text-left">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Manage Complaints</h1>
                    <p className="text-gray-500 font-medium flex items-center gap-2">
                        View and manage all user complaints on the platform.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                    <StatItem label="Active" value={stats.pending} color="text-amber-600" />
                    <div className="w-[1px] h-8 bg-gray-100" />
                    <StatItem label="Critical" value={stats.critical} color="text-rose-600" />
                    <div className="w-[1px] h-8 bg-gray-100" />
                    <StatItem label="Resolved" value={stats.resolved} color="text-emerald-600" />
                </div>
            </div>

            {/* Filters & Actions bar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                <div className="lg:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search by subject, description, or user..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-lg shadow-sm focus:border-blue-500 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative">
                    <select 
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg shadow-sm outline-none cursor-pointer text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>

                <div className="relative">
                    <select 
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg shadow-sm outline-none cursor-pointer text-sm"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <option value="All">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </div>

            {/* Complaints Grid/List */}
            <div className="space-y-6 pb-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-gray-500 text-sm">Loading complaints...</p>
                    </div>
                ) : filteredComplaints.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-20 text-center shadow-sm">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-500">No complaints found</p>
                    </div>
                ) : (
                    filteredComplaints.map((complaint) => (
                        <ComplaintCard 
                            key={complaint.id} 
                            complaint={complaint} 
                            onUpdateStatus={handleUpdateStatus}
                            navigate={navigate}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function StatItem({ label, value, color }) {
    return (
        <div className="px-5 py-2 text-center">
            <p className={`text-xl font-bold ${color} mb-0.5`}>{value}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        </div>
    );
}

function ComplaintCard({ complaint, onUpdateStatus, navigate }) {
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const getPriorityStyle = (priority) => {
        switch(priority?.toLowerCase()) {
            case 'high':
            case 'priority alpha':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'medium':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            default:
                return 'bg-blue-50 text-blue-700 border-blue-100';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                
                {/* Left Side: Metadata & User */}
                <div className="lg:w-64 shrink-0 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                            {complaint.user_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Reporter</p>
                            <p className="font-semibold text-gray-900 text-sm leading-tight">{complaint.user_name}</p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-50">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Priority</span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getPriorityStyle(complaint.priority)}`}>
                                {complaint.priority === 'Priority Alpha' ? 'High' : (complaint.priority || 'Medium')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Status</span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                                complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                complaint.status === 'Investigating' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                                {complaint.status}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-gray-500">Date</span>
                            <span className="text-gray-900">{timeAgo(complaint.created_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-1.5 bg-blue-50 rounded">
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {complaint.subject}
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                            {complaint.description}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Home className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">Property #{complaint.room_id || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-600">
                                <Shield className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Formal Report</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {complaint.status !== 'Resolved' && (
                                <button
                                    onClick={() => onUpdateStatus(complaint.id, 'Resolved')}
                                    className="text-blue-600 text-xs font-bold uppercase tracking-wider hover:text-blue-800 transition-colors"
                                >
                                    Resolve
                                </button>
                            )}
                            <button 
                                onClick={() => navigate(`/admin/complaints/${complaint.id}`)}
                                className="flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider group"
                            >
                                <span>View Details</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


