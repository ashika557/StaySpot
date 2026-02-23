import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Loader2, Mail,
    BadgeCheck, Lock, Unlock, Trash2, CheckCircle,
    AlertTriangle, UserPlus, ChevronLeft, ChevronRight,
    Eye, MoreVertical, XCircle, RotateCcw
} from 'lucide-react';
import { adminService } from '../services/adminService';

export default function ManageUsers({ user }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers();
            setUsers(data || []);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load platform users.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (userId, isActive) => {
        try {
            setActionLoading(userId);
            await adminService.updateUser(userId, { is_active: isActive });
            setMessage({
                type: 'success',
                text: `User ${isActive ? 'activated' : 'deactivated'} successfully.`
            });
            fetchUsers();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Operation failed.' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

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

    const resetFilters = () => {
        setSearchTerm('');
        setRoleFilter('All Roles');
        setStatusFilter('All Status');
        setCurrentPage(1);
    };

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

    // Pagination logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    return (
        <div className="animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="mb-8 overflow-hidden text-left">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Manage Users</h1>
                <p className="text-gray-500 font-medium tracking-tight">View and manage all user accounts</p>
            </div>

            {/* Feedback Messages */}
            {message.text && (
                <div className={`mb-6 p-5 rounded-2xl flex items-center gap-4 border shadow-sm animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <p className="text-sm font-bold tracking-tight">{message.text}</p>
                </div>
            )}

            {/* Filters & Search Card */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-8">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-gray-900">Filters & Search</h3>
                        <button
                            onClick={resetFilters}
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors uppercase tracking-widest"
                        >
                            Reset All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2 relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                className="w-full pl-16 pr-6 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all text-sm font-bold text-gray-600 shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <select
                                className="w-full pl-6 pr-10 py-4 bg-gray-50 border-gray-100 rounded-2xl appearance-none focus:ring-4 focus:ring-blue-50 outline-none cursor-pointer text-sm font-black text-gray-700 shadow-inner"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option>All Roles</option>
                                <option value="Admin">Admin</option>
                                <option value="Owner">Owner</option>
                                <option value="Tenant">Tenant</option>
                            </select>
                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
                        </div>

                        <div className="relative">
                            <select
                                className="w-full pl-6 pr-10 py-4 bg-gray-50 border-gray-100 rounded-2xl appearance-none focus:ring-4 focus:ring-blue-50 outline-none cursor-pointer text-sm font-black text-gray-700 shadow-inner"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option>All Status</option>
                                <option value="Active Only">Active Status</option>
                                <option value="Inactive Only">Inactive Status</option>
                            </select>
                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-3 text-sm uppercase tracking-widest">
                            <Filter className="w-4 h-4" />
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Users List Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-2xl font-black text-gray-900 leading-none">
                        Users <span className="text-gray-400 ml-1 font-bold text-lg">({filteredUsers.length})</span>
                    </h3>
                    <button className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 font-black text-sm uppercase tracking-widest">
                        <UserPlus className="w-4 h-4" />
                        Add User
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/20">
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">User</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Role</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Identity</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Joined</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-10 py-10">
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
                                    <td colSpan="5" className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-400">
                                            <Users className="w-20 h-20 opacity-10" />
                                            <p className="font-black text-sm tracking-[0.2em] uppercase">No secure accounts found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-blue-50/10 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-white shadow-md flex items-center justify-center text-blue-700 font-black group-hover:scale-110 transition-transform overflow-hidden">
                                                        {u.avatar ? (
                                                            <img src={u.avatar} alt={u.full_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            u.full_name?.charAt(0) || 'U'
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 text-base leading-tight tracking-tight mb-1">{u.full_name}</div>
                                                    <div className="text-xs text-gray-400 font-semibold tracking-tight">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <RoleBadge role={u.role} />
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <KYCBadge verified={u.is_identity_verified} status={u.verification_status} />
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <StatusBadge active={u.is_active} />
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className="text-sm font-black text-gray-600 tracking-tight">
                                                {new Date(u.date_joined).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center justify-center gap-3">
                                                {u.verification_status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleVerifyKYC(u.id, 'Approve')}
                                                        disabled={actionLoading === u.id}
                                                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50 flex items-center gap-2 uppercase tracking-tight"
                                                        title="Approve ID"
                                                    >
                                                        {actionLoading === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                                                        Verify
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/admin/users/${u.id}/details`)}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 flex items-center gap-2 uppercase tracking-tight"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </button>
                                                {u.id !== user.id && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(u.id, !u.is_active)}
                                                        disabled={actionLoading === u.id}
                                                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2 uppercase tracking-tight ${u.is_active
                                                            ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-50'
                                                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-50'
                                                            }`}
                                                    >
                                                        {actionLoading === u.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : u.is_active ? (
                                                            <>Deactivate</>
                                                        ) : (
                                                            <>Activate</>
                                                        )}
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

                {/* Pagination Footer */}
                <div className="px-10 py-8 bg-gray-50/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] leading-none">
                        Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} results
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-700" />
                        </button>

                        <div className="flex items-center gap-1.5">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-110'
                                        : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 hover:scale-105'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-700" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KYCBadge({ verified, status }) {
    if (verified) {
        return (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                Verified
            </span>
        );
    }
    if (status === 'Pending') {
        return (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 italic">
                Pending ID
            </span>
        );
    }
    if (status === 'Rejected') {
        return (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">
                Rejected
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100">
            Unverified
        </span>
    );
}

function RoleBadge({ role }) {
    const configs = {
        Admin: 'bg-purple-100 text-purple-700 border-purple-200',
        Owner: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        Tenant: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return (
        <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${configs[role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {role}
        </span>
    );
}

function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 opacity-80">
            <span className="w-2 h-2 bg-rose-400 rounded-full"></span>
            Inactive
        </span>
    );
}
