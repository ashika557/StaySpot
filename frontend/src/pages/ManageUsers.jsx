import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Shield,
    CheckCircle,
    XCircle,
    MoreVertical,
    Mail,
    Phone,
    UserPlus,
    Loader2,
    Trash2,
    Lock,
    Unlock,
    BadgeCheck,
    AlertTriangle
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { adminService } from '../services/adminService';

export default function ManageUsers({ user }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers();
            setUsers(data);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load users.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (userId, data) => {
        try {
            setActionLoading(userId);
            await adminService.updateUser(userId, data);
            setMessage({ type: 'success', text: 'User updated successfully.' });
            fetchUsers(); // Refresh list
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Update failed.' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = roleFilter === 'All' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role) => {
        const styles = {
            Admin: 'bg-purple-100 text-purple-700 border-purple-200',
            Owner: 'bg-blue-100 text-blue-700 border-blue-200',
            Tenant: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {role}
            </span>
        );
    };

    const getStatusBadge = (user) => {
        if (!user.is_active) {
            return (
                <span className="inline-flex items-center text-red-600 text-xs font-medium">
                    <XCircle className="w-3 h-3 mr-1" /> Deactivated
                </span>
            );
        }
        return (
            <span className="inline-flex items-center text-emerald-600 text-xs font-medium">
                <CheckCircle className="w-3 h-3 mr-1" /> Active
            </span>
        );
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <AdminSidebar user={user} />

            <main className="flex-1 lg:ml-64 p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-7 h-7 text-indigo-600" />
                            Manage Users
                        </h1>
                        <p className="text-gray-500 mt-1">Control access, manage roles, and monitor account activity.</p>
                    </div>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
                        <UserPlus className="w-4 h-4" />
                        Add New User
                    </button>
                </div>

                {/* Feedback Messages */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border shadow-sm ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-48">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="All">All Roles</option>
                                <option value="Admin">Admin</option>
                                <option value="Owner">Owner</option>
                                <option value="Tenant">Tenant</option>
                            </select>
                        </div>
                        <button
                            onClick={fetchUsers}
                            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Refresh List"
                        >
                            <Loader2 className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">User Info</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Verification</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-6 py-8 h-16">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                                        <div className="h-3 w-24 bg-gray-100 rounded"></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-gray-500">
                                            No users found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                        {u.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{u.full_name}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" /> {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    {getRoleBadge(u.role)}
                                                    <select
                                                        className="text-[10px] text-gray-500 bg-transparent border-none focus:ring-0 cursor-pointer hover:text-indigo-600 outline-none w-min"
                                                        value={u.role}
                                                        onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                                                        disabled={actionLoading === u.id || u.id === user.id}
                                                    >
                                                        <option value="Tenant">Set as Tenant</option>
                                                        <option value="Owner">Set as Owner</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.is_identity_verified ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                                        <BadgeCheck className="w-4 h-4" />
                                                        <span className="text-xs font-semibold">Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={`text-xs font-medium ${u.verification_status === 'Pending' ? 'text-amber-600' : 'text-gray-400'
                                                            }`}>
                                                            {u.verification_status || 'Not Submitted'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(u)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {u.id !== user.id && (
                                                        <button
                                                            onClick={() => handleUpdateUser(u.id, { is_active: !u.is_active })}
                                                            disabled={actionLoading === u.id}
                                                            className={`p-2 rounded-lg transition-all ${u.is_active
                                                                ? 'text-amber-600 hover:bg-amber-50'
                                                                : 'text-emerald-600 hover:bg-emerald-50'
                                                                }`}
                                                            title={u.is_active ? 'Suspend Account' : 'Activate Account'}
                                                        >
                                                            {actionLoading === u.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : u.is_active ? (
                                                                <Lock className="w-4 h-4" />
                                                            ) : (
                                                                <Unlock className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete User (Permanently)">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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
