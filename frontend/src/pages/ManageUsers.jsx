import React, { useState, useEffect } from 'react';
import {
    Users, Search, Loader2, BadgeCheck, CheckCircle,
    AlertTriangle, ChevronLeft, ChevronRight,
    Eye, X, Shield, User, Mail, Phone, Calendar,
    MapPin, FileText, Clock, XCircle, ShieldCheck
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { getMediaUrl } from '../constants/api';

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

    // User detail modal state
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    // KYC review modal state (separate)
    const [kycUser, setKycUser] = useState(null);
    const [kycModalOpen, setKycModalOpen] = useState(false);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers();
            setUsers(data || []);
        } catch {
            setMessage({ type: 'error', text: 'Failed to load users.' });
        } finally {
            setLoading(false);
        }
    };

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

    const handleVerifyKYC = async (userId, action) => {
        try {
            setActionLoading(userId);
            await adminService.verifyKYC(userId, action);
            const approved = action === 'Approve';
            setMessage({ type: 'success', text: `Identity document ${approved ? 'approved' : 'rejected'} successfully.` });
            // Update kycUser inline so the modal reflects the result immediately
            setKycUser(prev => prev ? {
                ...prev,
                is_identity_verified: approved,
                verification_status: approved ? 'Verified' : 'Rejected'
            } : null);
            fetchUsers();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Verification failed.' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const openDetailModal = (u) => { setSelectedUser(u); setDetailModalOpen(true); };
    const closeDetailModal = () => { setDetailModalOpen(false); setSelectedUser(null); };

    const openKycModal = (u) => { setKycUser(u); setKycModalOpen(true); };
    const closeKycModal = () => { setKycModalOpen(false); setKycUser(null); };

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
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black mb-1">Manage Users</h1>
                <p className="text-gray-500">View, verify, and manage all registered accounts</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(s => (
                    <div key={s.label} className={`${s.color} rounded-2xl p-5 flex items-center gap-4`}>
                        <s.icon className="w-6 h-6 opacity-70" />
                        <div>
                            <div className="text-2xl font-black">{s.value}</div>
                            <div className="text-xs font-bold opacity-70">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Message Banner */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl border mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100 border border-transparent focus:border-blue-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                        className="px-4 py-3 bg-gray-50 rounded-xl text-sm font-semibold outline-none border border-transparent focus:border-blue-200 focus:ring-2 focus:ring-blue-100 cursor-pointer">
                        <option>All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Owner">Owner</option>
                        <option value="Tenant">Tenant</option>
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-gray-50 rounded-xl text-sm font-semibold outline-none border border-transparent focus:border-blue-200 focus:ring-2 focus:ring-blue-100 cursor-pointer">
                        <option>All Status</option>
                        <option value="Active Only">Active</option>
                        <option value="Inactive Only">Inactive</option>
                    </select>
                    <button onClick={resetFilters} className="px-5 py-3 text-blue-600 font-bold text-sm bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b">
                    <h3 className="text-lg font-black">
                        Users <span className="text-gray-400 font-bold text-base">({filteredUsers.length})</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Role</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">KYC Status</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Account</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Joined</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                                                <div className="space-y-2">
                                                    <div className="h-3 w-40 bg-gray-100 rounded" />
                                                    <div className="h-2 w-28 bg-gray-50 rounded" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : currentUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <Users className="w-16 h-16 opacity-10" />
                                            <p className="font-black text-xs uppercase tracking-widest">No users found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                                        {/* User */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-black text-sm shadow-sm shrink-0">
                                                    {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{u.full_name}</div>
                                                    <div className="text-xs text-gray-400">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Role */}
                                        <td className="px-6 py-4 text-center"><RoleBadge role={u.role} /></td>
                                        {/* KYC */}
                                        <td className="px-6 py-4 text-center"><KYCBadge verified={u.is_identity_verified} status={u.verification_status} /></td>
                                        {/* Account Status */}
                                        <td className="px-6 py-4 text-center"><StatusBadge active={u.is_active} /></td>
                                        {/* Joined */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-semibold text-gray-500">
                                                {new Date(u.date_joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* View Profile */}
                                                <button
                                                    onClick={() => openDetailModal(u)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </button>

                                                {/* KYC Review — only for pending */}
                                                {u.verification_status === 'Pending' && (
                                                    <button
                                                        onClick={() => openKycModal(u)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
                                                    >
                                                        <ShieldCheck className="w-3.5 h-3.5" /> Review KYC
                                                    </button>
                                                )}

                                                {/* Activate / Deactivate */}
                                                {u.id !== user.id && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(u.id, !u.is_active)}
                                                        disabled={actionLoading === u.id}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${u.is_active ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                                                    >
                                                        {actionLoading === u.id
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : u.is_active ? 'Deactivate' : 'Activate'}
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
                    <div className="px-6 py-5 bg-gray-50/50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-semibold text-gray-400">
                            Showing {indexOfFirstUser + 1}–{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                                className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-30 transition-colors">
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)}
                                    className={`w-9 h-9 rounded-lg font-bold text-xs transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
                                    {i + 1}
                                </button>
                            ))}
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                                className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-30 transition-colors">
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── User Details Modal ── */}
            {detailModalOpen && selectedUser && (
                <UserDetailModal
                    u={selectedUser}
                    actionLoading={actionLoading}
                    onClose={closeDetailModal}
                    onToggleStatus={handleUpdateStatus}
                    currentUser={user}
                />
            )}

            {/* ── KYC Review Modal ── */}
            {kycModalOpen && kycUser && (
                <KYCReviewModal
                    u={kycUser}
                    actionLoading={actionLoading}
                    onClose={closeKycModal}
                    onVerify={handleVerifyKYC}
                />
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   USER DETAILS MODAL — Profile information only
───────────────────────────────────────────── */
function UserDetailModal({ u, actionLoading, onClose, onToggleStatus, currentUser }) {
    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    const infoRows = [
        { icon: Mail,     label: 'Email',         value: u.email || '—' },
        { icon: Phone,    label: 'Phone',          value: u.phone || '—' },
        { icon: Calendar, label: 'Date of Birth',  value: u.date_of_birth || '—' },
        { icon: MapPin,   label: 'City',           value: u.city || '—' },
        { icon: MapPin,   label: 'Address',        value: u.address || '—' },
        { icon: Calendar, label: 'Member Since',   value: new Date(u.date_joined).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdrop}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto">

                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-gray-900 leading-none">User Details</h2>
                            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">ID #{u.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-5">

                    {/* Avatar card */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-200 to-indigo-300 flex items-center justify-center text-blue-900 font-black text-2xl shadow-sm shrink-0">
                            {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-gray-900 truncate">{u.full_name}</h3>
                            <p className="text-xs text-gray-500 truncate mb-2">{u.email}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <RoleBadge role={u.role} />
                                <StatusBadge active={u.is_active} />
                                <KYCBadge verified={u.is_identity_verified} status={u.verification_status} />
                            </div>
                        </div>
                    </div>

                    {/* Info rows */}
                    <div>
                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Personal Information</h4>
                        <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
                            {infoRows.map(row => (
                                <div key={row.label} className="flex items-center gap-4 px-5 py-3">
                                    <row.icon className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="text-xs font-bold text-gray-400 w-28 shrink-0">{row.label}</span>
                                    <span className="text-sm font-semibold text-gray-800 break-all">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Account management */}
                    {u.id !== currentUser.id && (
                        <div className="flex items-center justify-between pt-1 border-t">
                            <p className="text-xs text-gray-400 font-semibold">Account Management</p>
                            <button
                                onClick={() => { onToggleStatus(u.id, !u.is_active); onClose(); }}
                                disabled={actionLoading === u.id}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-colors ${u.is_active ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                            >
                                <Shield className="w-3.5 h-3.5" />
                                {u.is_active ? 'Deactivate Account' : 'Activate Account'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   KYC REVIEW MODAL — Dedicated identity verification panel
───────────────────────────────────────────── */
function KYCReviewModal({ u, actionLoading, onClose, onVerify }) {
    const [imgError, setImgError] = useState(false);
    const docUrl = u.identity_document ? getMediaUrl(u.identity_document) : null;

    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    const isResolved = u.verification_status === 'Verified' || u.verification_status === 'Rejected';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdrop}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-gray-900 leading-none">KYC Review</h2>
                            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Identity Verification</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-5">

                    {/* User summary */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-800 font-black text-lg shrink-0">
                            {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="font-black text-gray-900 text-sm">{u.full_name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                        <div className="ml-auto shrink-0">
                            <KYCBadge verified={u.is_identity_verified} status={u.verification_status} />
                        </div>
                    </div>

                    {/* Document viewer */}
                    <div>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-500" /> Submitted Document
                        </p>

                        {docUrl && !imgError ? (
                            <div className="rounded-2xl overflow-hidden border-2 border-dashed border-blue-200 bg-blue-50">
                                <img
                                    src={docUrl}
                                    alt="Identity Document"
                                    className="w-full max-h-64 object-contain bg-white"
                                    onError={() => setImgError(true)}
                                />
                                <div className="px-4 py-2.5 flex items-center justify-between">
                                    <p className="text-[11px] font-semibold text-blue-600">Identity document uploaded</p>
                                    <a href={docUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-[11px] font-bold text-blue-700 underline hover:text-blue-900">
                                        Open full size ↗
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 gap-2">
                                <FileText className="w-10 h-10 opacity-30" />
                                <p className="text-sm font-bold">No document uploaded</p>
                            </div>
                        )}
                    </div>

                    {/* Action area */}
                    {!isResolved && docUrl && !imgError ? (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-400 font-semibold text-center">
                                Review the document above, then approve or reject
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => onVerify(u.id, 'Approve')}
                                    disabled={actionLoading === u.id}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-100 disabled:opacity-60"
                                >
                                    {actionLoading === u.id
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <BadgeCheck className="w-5 h-5" />
                                    }
                                    Approve
                                </button>
                                <button
                                    onClick={() => onVerify(u.id, 'Reject')}
                                    disabled={actionLoading === u.id}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-rose-100 disabled:opacity-60"
                                >
                                    {actionLoading === u.id
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <XCircle className="w-5 h-5" />
                                    }
                                    Reject
                                </button>
                            </div>
                        </div>
                    ) : u.verification_status === 'Verified' ? (
                        <div className="flex items-center justify-center gap-2 py-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                            <BadgeCheck className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-black text-emerald-700">Identity has been approved</span>
                        </div>
                    ) : u.verification_status === 'Rejected' ? (
                        <div className="flex items-center justify-center gap-2 py-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
                            <XCircle className="w-5 h-5 text-rose-500" />
                            <span className="text-sm font-black text-rose-700">Identity was rejected</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 py-3.5 bg-gray-50 rounded-2xl">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-400">No document submitted yet</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Badge components ── */
function KYCBadge({ verified, status }) {
    if (verified) return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-200"><BadgeCheck className="w-3 h-3" />Verified</span>;
    if (status === 'Pending') return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200"><Clock className="w-3 h-3" />Pending</span>;
    if (status === 'Rejected') return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-200"><XCircle className="w-3 h-3" />Rejected</span>;
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-gray-200">Not Submitted</span>;
}

function RoleBadge({ role }) {
    const cfg = { Admin: 'bg-purple-100 text-purple-700 border-purple-200', Owner: 'bg-indigo-100 text-indigo-700 border-indigo-200', Tenant: 'bg-blue-100 text-blue-700 border-blue-200' };
    return <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg[role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{role}</span>;
}

function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-200">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-200">
            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />Inactive
        </span>
    );
}