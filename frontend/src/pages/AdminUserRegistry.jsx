import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Search, Loader2, BadgeCheck, CheckCircle,
    AlertTriangle, ChevronLeft, ChevronRight,
    Eye, Clock, XCircle, ShieldCheck
} from 'lucide-react';
import { adminService } from '../services/adminService';

export default function AdminUserRegistry({ user: loggedInUser }) {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    const fetchUsers = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers();
            setUsers(data || []);
        } catch {
            setMessage({ type: 'error', text: 'Failed to load users.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleUpdateStatus = async (userId, isActive) => {
        try {
            setActionLoading(userId);
            await adminService.updateUser(userId, { is_active: isActive });
            setMessage({ type: 'success', text: `User ${isActive ? 'activated' : 'deactivated'} successfully.` });
            fetchUsers();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Action failed.' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const resetFilters = () => {
        setSearchTerm(''); setRoleFilter('All Roles');
        setStatusFilter('All Status'); setCurrentPage(1);
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

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const stats = [
        { label: 'Total Users', value: users.length, color: 'bg-blue-50 text-blue-700', icon: Users },
        { label: 'Pending KYC', value: users.filter(u => u.verification_status === 'Pending').length, color: 'bg-amber-50 text-amber-700', icon: Clock },
        { label: 'Verified', value: users.filter(u => u.is_identity_verified).length, color: 'bg-emerald-50 text-emerald-700', icon: BadgeCheck },
        { label: 'Inactive', value: users.filter(u => !u.is_active).length, color: 'bg-rose-50 text-rose-700', icon: XCircle },
    ];

    return (
        <div className="max-w-[1200px] mx-auto text-left">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Manage Users</h1>
                <p className="text-gray-500 font-medium">View and manage all users on the platform.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-6 flex items-center gap-5 border border-gray-100 shadow-sm">
                        <div className={`p-3 rounded-xl ${s.color}`}>
                            <s.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 leading-tight">{s.value}</div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Message Banner */}
            {message.text && (
                <div className={`mb-8 p-4 rounded-xl flex items-center gap-4 border animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 mb-8 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                            className="px-4 py-3 bg-gray-50 border border-transparent rounded-lg text-sm outline-none cursor-pointer hover:bg-gray-100 transition-colors">
                            <option>All Roles</option>
                            <option value="Admin">Admins</option>
                            <option value="Owner">Owners</option>
                            <option value="Tenant">Tenants</option>
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="px-4 py-3 bg-gray-50 border border-transparent rounded-lg text-sm outline-none cursor-pointer hover:bg-gray-100 transition-colors">
                            <option>All Status</option>
                            <option value="Active Only">Active</option>
                            <option value="Inactive Only">Inactive</option>
                        </select>
                        <button onClick={resetFilters} className="px-6 py-3 text-blue-600 font-medium text-sm bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Verification</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Joined Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="h-10 bg-gray-50 rounded-lg w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : currentUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-400">
                                            <Users className="w-12 h-12" />
                                            <p className="text-sm">No users found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm">{u.full_name}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center"><RoleBadge role={u.role} /></td>
                                        <td className="px-6 py-4 text-center"><KYCBadge verified={u.is_identity_verified} status={u.verification_status} /></td>
                                        <td className="px-6 py-4 text-center"><StatusBadge active={u.is_active} /></td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                                            {new Date(u.date_joined).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/users/${u.id}`)}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all shadow-sm"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {u.verification_status === 'Pending' && (
                                                    <button
                                                        onClick={() => navigate(`/admin/users/${u.id}/kyc`)}
                                                        className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all shadow-sm"
                                                        title="KYC Review"
                                                    >
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {u.id !== loggedInUser.id && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(u.id, !u.is_active)}
                                                        disabled={actionLoading === u.id}
                                                        className={`p-2 rounded-lg transition-all shadow-sm ${u.is_active ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                        title={u.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {actionLoading === u.id
                                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                                            : u.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />
                                                        }
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
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                        </p>
                        <div className="flex items-center gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                                className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm">
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
                                    {i + 1}
                                </button>
                            ))}
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                                className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm">
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function KYCBadge({ verified, status }) {
    if (verified) return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-emerald-100">Verified</span>;
    if (status === 'Pending') return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-amber-100">Pending</span>;
    if (status === 'Rejected') return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-rose-100">Rejected</span>;
    return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-gray-200">Not Verified</span>;
}

function RoleBadge({ role }) {
    const cfg = { Admin: 'bg-indigo-50 text-indigo-700 border-indigo-100', Owner: 'bg-purple-50 text-purple-700 border-purple-100', Tenant: 'bg-blue-50 text-blue-700 border-blue-100' };
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${cfg[role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{role}</span>;
}

function StatusBadge({ active }) {
    return active ? (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-emerald-100">Active</span>
    ) : (
        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-rose-100">Inactive</span>
    );
}

