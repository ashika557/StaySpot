import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Loader2, Mail,
    BadgeCheck, Lock, Unlock, Trash2, CheckCircle,
    AlertTriangle, UserPlus, ChevronLeft, ChevronRight,
    Eye, MoreVertical, XCircle, RotateCcw
} from 'lucide-react';
import { adminService } from '../services/adminService';

export default function ManageUsers({ user }) {
    // 1. State (data we track)
    
    const [users, setUsers] = useState([]); // Stores all users fetched from backend
    const [loading, setLoading] = useState(true); // Shows spinner while loading

    const [searchTerm, setSearchTerm] = useState(''); // Text typed in search box
    const [roleFilter, setRoleFilter] = useState('All Roles'); // Role dropdown filter
    const [statusFilter, setStatusFilter] = useState('All Status'); // Active/Inactive dropdown filter

    const [actionLoading, setActionLoading] = useState(null); // Spinner for single button action
    const [message, setMessage] = useState({ type: '', text: '' }); // Success/Error message

    const [currentPage, setCurrentPage] = useState(1); // Current page number
    const usersPerPage = 10; // How many users to show per page

    // 2. Fetch users from backend on page load
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers();
            setUsers(data || []);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load users.' });
        } finally {
            setLoading(false);
        }
    };

    // 3. Admin Actions
    
    // Activate / Deactivate a user
    const handleUpdateStatus = async (userId, isActive) => {
        try {
            setActionLoading(userId);
            await adminService.updateUser(userId, { is_active: isActive });
            setMessage({
                type: 'success',
                text: `User ${isActive ? 'activated' : 'deactivated'} successfully.`
            });
            fetchUsers(); // Refresh list
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Action failed.' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    // Approve or Reject KYC documents
    const handleVerifyKYC = async (userId, action) => {
        try {
            setActionLoading(userId);
            await adminService.verifyKYC(userId, action);
            setMessage({
                type: 'success',
                text: `Identity document ${action === 'Approve' ? 'verified' : 'rejected'} successfully.`
            });
            fetchUsers();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Verification failed.' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    // Reset all filters and go back to page 1
    const resetFilters = () => {
        setSearchTerm('');
        setRoleFilter('All Roles');
        setStatusFilter('All Status');
        setCurrentPage(1);
    };

    // 4. Filter users based on search and dropdowns
    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;

        let matchesStatus = true;
        if (statusFilter === 'Active Only') matchesStatus = u.is_active;
        else if (statusFilter === 'Inactive Only') matchesStatus = !u.is_active;

        return matchesSearch && matchesRole && matchesStatus;
    });

    // 5. Pagination logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    // 6. Render JSX
    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div className="mb-8 text-left">
                <h1 className="text-3xl font-black mb-1">Manage Users</h1>
                <p className="text-gray-500">View and manage all user accounts</p>
            </div>

            {/* Message Banner */}
            {message.text && (
                <div className={`mb-6 p-5 rounded-2xl flex items-center gap-4 border shadow-sm ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-10 rounded-[2.5rem] border mb-8 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-lg">Filters & Search</h3>
                    <button onClick={resetFilters} className="text-blue-600 font-bold">Reset All</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Search box */}
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-16 pr-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Role filter */}
                    <div className="relative">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full pl-6 pr-10 py-4 bg-gray-50 rounded-2xl cursor-pointer"
                        >
                            <option>All Roles</option>
                            <option value="Admin">Admin</option>
                            <option value="Owner">Owner</option>
                            <option value="Tenant">Tenant</option>
                        </select>
                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Status filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-6 pr-10 py-4 bg-gray-50 rounded-2xl cursor-pointer"
                        >
                            <option>All Status</option>
                            <option value="Active Only">Active Status</option>
                            <option value="Inactive Only">Inactive Status</option>
                        </select>
                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-gray-50 flex justify-between">
                    <h3 className="text-2xl font-black">Users <span className="text-gray-400 ml-1 font-bold text-lg">({filteredUsers.length})</span></h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/20">
                                <th className="px-10 py-6 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">User</th>
                                <th className="px-10 py-6 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                <th className="px-10 py-6 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                                <th className="px-10 py-6 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-10 py-6 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                                <th className="px-10 py-6 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {/* Loading */}
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-10 py-10">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
                                                <div className="space-y-3">
                                                    <div className="h-4 w-48 bg-gray-100 rounded-lg"></div>
                                                    <div className="h-3 w-32 bg-gray-50 rounded-lg"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : currentUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-400">
                                            <Users className="w-20 h-20 opacity-10" />
                                            <p className="font-black text-sm uppercase tracking-[0.2em]">No users found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-blue-50/10 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-white shadow-md flex items-center justify-center text-blue-700 font-black">
                                                        {u.avatar ? <img src={u.avatar} alt={u.full_name} className="w-full h-full object-cover" /> : u.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 text-base">{u.full_name}</div>
                                                    <div className="text-xs text-gray-400 font-semibold">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center"><RoleBadge role={u.role} /></td>
                                        <td className="px-10 py-6 text-center"><KYCBadge verified={u.is_identity_verified} status={u.verification_status} /></td>
                                        <td className="px-10 py-6 text-center"><StatusBadge active={u.is_active} /></td>
                                        <td className="px-10 py-6 text-center">
                                            <span className="text-sm font-black text-gray-600">
                                                {new Date(u.date_joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center justify-center gap-3">
                                                {u.verification_status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleVerifyKYC(u.id, 'Approve')}
                                                        disabled={actionLoading === u.id}
                                                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2"
                                                    >
                                                        {actionLoading === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                                                        Verify
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/admin/users/${u.id}/details`)}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-2"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </button>
                                                {u.id !== user.id && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(u.id, !u.is_active)}
                                                        disabled={actionLoading === u.id}
                                                        className={`px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 ${u.is_active ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}
                                                    >
                                                        {actionLoading === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : u.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-10 py-8 bg-gray-50/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">
                        Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} results
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-3 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-700" />
                        </button>

                        <div className="flex items-center gap-1.5">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl font-black text-xs ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-600'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-3 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-700" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Micro components for badges
function KYCBadge({ verified, status }) {
    if (verified) return <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100"><BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />Verified</span>;
    if (status === 'Pending') return <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 italic">Pending ID</span>;
    if (status === 'Rejected') return <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">Rejected</span>;
    return <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100">Unverified</span>;
}

function RoleBadge({ role }) {
    const configs = { Admin: 'bg-purple-100 text-purple-700 border-purple-200', Owner: 'bg-indigo-100 text-indigo-700 border-indigo-200', Tenant: 'bg-blue-100 text-blue-700 border-blue-200' };
    return <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${configs[role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{role}</span>;
}

function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 opacity-80">
            <span className="w-2 h-2 bg-rose-400 rounded-full"></span>Inactive
        </span>
    );
}