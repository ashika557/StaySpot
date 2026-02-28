import React, { useState, useEffect, useMemo } from 'react';
import {
    AlertCircle, Search, Filter, Loader2, MessageSquare,
    CheckCircle, AlertTriangle, Clock, ChevronRight,
    User, Home as HomeIcon, Trash2, Camera, UserPlus,
    BarChart3, Shield, Info, MoreHorizontal, ArrowUpDown,
    Tag, Bell
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { getMediaUrl } from '../constants/api';

export default function ManageComplaints({ user }) {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Latest');
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
            setMessage({ type: 'error', text: 'Failed to load complaints.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            setActionLoading(id);
            await adminService.updateComplaintStatus(id, status);
            setMessage({ type: 'success', text: `Status updated to ${status}.` });
            fetchComplaints();
        } catch (error) {
            setMessage({ type: 'error', text: 'Status update failed.' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    // Derived stats for sidebar
    const stats = useMemo(() => {
        const typeCounts = {
            Maintenance: 0,
            Noise: 0,
            Billing: 0,
            Security: 0,
            Other: 0
        };
        const ownerCounts = {};

        complaints.forEach(c => {
            if (typeCounts[c.complaint_type] !== undefined) {
                typeCounts[c.complaint_type]++;
            } else {
                typeCounts['Other']++;
            }

            if (c.owner) {
                const ownerId = c.owner.id;
                if (!ownerCounts[ownerId]) {
                    ownerCounts[ownerId] = {
                        name: c.owner.full_name,
                        count: 0,
                        avatar: c.owner.profile_image
                    };
                }
                ownerCounts[ownerId].count++;
            }
        });

        const total = complaints.length || 1;
        const topIssues = Object.entries(typeCounts)
            .filter(([_, count]) => count > 0 || ['Maintenance', 'Noise', 'Security'].includes(_))
            .map(([name, count]) => ({
                name,
                percentage: Math.round((count / total) * 100)
            })).sort((a, b) => b.percentage - a.percentage);

        const highComplaintOwners = Object.values(ownerCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        return { topIssues, highComplaintOwners };
    }, [complaints]);

    const filteredComplaints = useMemo(() => {
        let result = complaints.filter(c => {
            const matchesSearch =
                c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.tenant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.room?.title?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = categoryFilter === 'All' || c.complaint_type === categoryFilter;
            const matchesSeverity = severityFilter === 'All' || c.priority === severityFilter;

            return matchesSearch && matchesCategory && matchesSeverity;
        });

        // Sorting
        if (sortBy === 'Latest') {
            result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sortBy === 'Oldest') {
            result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else if (sortBy === 'Priority') {
            const priorityMap = { High: 0, Medium: 1, Low: 2 };
            result.sort((a, b) => (priorityMap[a.priority] ?? 3) - (priorityMap[b.priority] ?? 3));
        }

        return result;
    }, [complaints, searchTerm, categoryFilter, severityFilter, sortBy]);

    return (
        <div className="max-w-[1600px] mx-auto p-8 animate-in fade-in duration-700 bg-[#f9fafb] min-h-screen text-left">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Complaints Management</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">Monitor and manage users complaints</p>
                </div>
                <div className="flex items-center gap-6">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
                        <Bell className="w-6 h-6" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f9fafb]"></span>
                    </button>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm cursor-pointer">
                        {user?.profile_image ? (
                            <img src={getMediaUrl(user.profile_image)} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-amber-100 text-amber-700 font-black uppercase text-sm">
                                {user?.full_name?.charAt(0) || 'A'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-10">
                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    {/* Filters & Search */}
                    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 mb-10 flex flex-wrap items-center gap-6">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search complaints..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-200 transition-all outline-none text-sm font-medium text-gray-600"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-50 outline-none cursor-pointer min-w-[160px]"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Noise">Noise</option>
                                <option value="Billing">Billing</option>
                                <option value="Security">Security</option>
                                <option value="Other">Other</option>
                            </select>

                            <select
                                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-50 outline-none cursor-pointer min-w-[140px]"
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                            >
                                <option value="All">All Severity</option>
                                <option value="High">High Priority</option>
                                <option value="Medium">Medium Priority</option>
                                <option value="Low">Low Priority</option>
                            </select>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sort by:</span>
                                <select
                                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-800 outline-none cursor-pointer min-w-[120px]"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="Latest">Latest</option>
                                    <option value="Oldest">Oldest</option>
                                    <option value="Priority">Priority</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Complaint Cards */}
                    <div className="space-y-6">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="bg-white h-52 rounded-3xl border border-gray-100 shadow-sm animate-pulse"></div>
                            ))
                        ) : filteredComplaints.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-24 text-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <MessageSquare className="w-12 h-12 text-gray-200" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">No complaints found</h3>
                                <p className="text-gray-500 font-medium">Try adjusting your filters or search keywords.</p>
                            </div>
                        ) : (
                            filteredComplaints.map((complaint) => (
                                <ComplaintCard
                                    key={complaint.id}
                                    complaint={complaint}
                                    onUpdateStatus={handleUpdateStatus}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right Sidebar Stats */}
                <div className="w-full xl:w-96 space-y-8">
                    {/* Top Issues Card */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">
                            Top Issues
                        </h3>
                        <div className="space-y-8">
                            {stats.topIssues.map((issue) => (
                                <div key={issue.name}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-gray-600 tracking-tight">{issue.name}</span>
                                        <span className="text-sm font-black text-gray-900">{issue.percentage}%</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${issue.name === 'Maintenance' ? 'bg-blue-600' :
                                                issue.name === 'Noise' ? 'bg-emerald-500' :
                                                    issue.name === 'Security' ? 'bg-amber-500' : 'bg-gray-400'
                                                }`}
                                            style={{ width: `${issue.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* High Complaint Owners Card */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">High Complaint Owners</h3>
                        <div className="space-y-4">
                            {stats.highComplaintOwners.map((owner, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${idx === 0 ? 'bg-rose-50/50' : idx === 1 ? 'bg-amber-50/50' : 'bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-white shadow-sm">
                                            {owner.avatar ? (
                                                <img src={getMediaUrl(owner.avatar)} alt={owner.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600 font-black text-sm uppercase">
                                                    {owner.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm font-black text-gray-800 tracking-tight">{owner.name}</span>
                                    </div>
                                    <div className={`text-xs font-black uppercase tracking-wider ${idx === 0 ? 'text-rose-600' : idx === 1 ? 'text-amber-600' : 'text-gray-500'
                                        }`}>
                                        {owner.count} complaints
                                    </div>
                                </div>
                            ))}
                            {stats.highComplaintOwners.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4 font-medium italic">No performance data yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ComplaintCard({ complaint, onUpdateStatus }) {
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

    const statusColors = {
        'Pending': 'bg-amber-100 text-amber-700',
        'Investigating': 'bg-blue-100 text-blue-700',
        'Resolved': 'bg-emerald-100 text-emerald-700'
    };

    const priorityColors = {
        'High': 'bg-rose-50 text-rose-600',
        'Medium': 'bg-amber-50 text-amber-600',
        'Low': 'bg-emerald-50 text-emerald-600'
    };

    return (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            <div className="flex gap-6">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gray-50 overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                        {complaint.tenant?.profile_image ? (
                            <img src={getMediaUrl(complaint.tenant.profile_image)} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold text-xl uppercase">
                                {complaint.tenant?.full_name?.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-6 mb-4">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate tracking-tight">
                                {complaint.description?.split('.')[0]}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2 font-medium">
                                <span className="text-sm font-bold text-gray-600">Room {complaint.room?.room_number || complaint.room?.title || 'DNA'}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-500">Reported by <span className="text-gray-900 font-bold">{complaint.tenant?.full_name}</span></span>
                                <span className="text-gray-300 font-light">•</span>
                                <span className="text-xs text-gray-400 font-bold">{timeAgo(complaint.created_at)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${priorityColors[complaint.priority] || 'bg-gray-50 text-gray-600'}`}>
                                {complaint.priority || 'Medium'} Priority
                            </span>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[complaint.status] || 'bg-gray-100 text-gray-600'}`}>
                                {complaint.status || 'Pending'}
                            </span>
                        </div>
                    </div>

                    <p className="text-gray-600 text-[15px] font-medium line-clamp-2 mb-8 leading-relaxed max-w-3xl">
                        {complaint.description}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div className="flex items-center gap-10">
                            <div className="flex items-center gap-2.5 text-gray-400 group-hover:text-gray-600 transition-colors">
                                <Tag className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-wider">{complaint.complaint_type}</span>
                            </div>
                            {complaint.image && (
                                <div className="flex items-center gap-2.5 text-blue-500 font-black">
                                    <Camera className="w-4 h-4" />
                                    <span className="text-[11px] uppercase tracking-wider">1 Photo</span>
                                </div>
                            )}
                            {complaint.owner && (
                                <div className="flex items-center gap-2.5 text-gray-400">
                                    <User className="w-4 h-4" />
                                    <span className="text-[11px] font-black uppercase tracking-wider">Owner: {complaint.owner.full_name}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-6">
                            {complaint.status !== 'Resolved' && (
                                <button
                                    onClick={() => onUpdateStatus(complaint.id, 'Resolved')}
                                    className="text-blue-600 text-xs font-black uppercase tracking-[0.15em] hover:text-blue-800 transition-colors"
                                >
                                    Solve Issue
                                </button>
                            )}
                            <button className="flex items-center gap-1.5 text-blue-600 text-xs font-black uppercase tracking-[0.15em] group/btn">
                                <span>View Details</span>
                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
