import React, { useState, useEffect } from 'react';
import { Search, Users, FileText, AlertTriangle, Wrench, MapPin, Eye, Edit, MessageSquare, ChevronLeft, ChevronRight, User, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './sidebar';
import { API_ENDPOINTS, getMediaUrl, ROUTES } from '../constants/api';
import { apiRequest } from '../utils/api';

const OwnerTenants = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total_tenants: 0, active_leases: 0, pending_rent: 0, maintenance_requests: 0 });
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [propertyFilter, setPropertyFilter] = useState('All Properties');
    const [currentPage, setCurrentPage] = useState(1);
    const tenantsPerPage = 5;

    useEffect(() => { fetchTenantData(); }, []);

    const fetchTenantData = async () => {
        try {
            setLoading(true);
            const response = await apiRequest(API_ENDPOINTS.OWNER_TENANTS);
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
                setTenants(data.tenants);
            }
        } catch (error) {
            console.error("Failed to fetch tenant data", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTenants = tenants.filter(t => {
        const matchesSearch = t.tenant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tenant.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProperty = propertyFilter === 'All Properties' || t.property.includes(propertyFilter);
        return matchesSearch && matchesProperty;
    });

    const indexOfLastTenant = currentPage * tenantsPerPage;
    const indexOfFirstTenant = indexOfLastTenant - tenantsPerPage;
    const currentTenants = filteredTenants.slice(indexOfFirstTenant, indexOfLastTenant);
    const totalPages = Math.ceil(filteredTenants.length / tenantsPerPage);
    const properties = ['All Properties', ...new Set(tenants.map(t => t.property.split(', ')[1]))];

    const statCards = [
        { title: 'Total Tenants', value: stats.total_tenants, icon: Users, iconBg: '#eff6ff', iconColor: '#2563eb', accent: '#2563eb', valColor: '#111827' },
        { title: 'Active Leases', value: stats.active_leases, icon: FileText, iconBg: '#f0fdf4', iconColor: '#16a34a', accent: '#16a34a', valColor: '#111827' },
        { title: 'Pending Rent', value: stats.pending_rent, icon: AlertTriangle, iconBg: '#fff7ed', iconColor: '#ea580c', accent: '#ea580c', valColor: '#ea580c' },
        { title: 'Maintenance Requests', value: stats.maintenance_requests, icon: Wrench, iconBg: '#fef2f2', iconColor: '#dc2626', accent: '#dc2626', valColor: '#111827' },
    ];

    const getLeaseStyle = (s) => {
        if (s === 'Active' || s === 'Confirmed') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
        if (s === 'Expiring Soon') return { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
        return { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
    };

    const getRentStyle = (s) => {
        if (s === 'Paid') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
        if (s === 'Pending') return { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
        if (s === 'Overdue') return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
        return { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-auto">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col min-w-0">
                <main className="p-8">

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tenant Management</h2>
                        <p className="text-sm text-gray-400 mt-1">Manage and monitor your tenants</p>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-4 gap-5 mb-8">
                        {statCards.map((card, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                                style={{ borderTop: `3px solid ${card.accent}` }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                        style={{ background: card.iconBg, color: card.iconColor }}>
                                        <card.icon className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{card.title}</p>
                                <p className="text-3xl font-extrabold" style={{ color: card.valColor }}>{card.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tenant Directory */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                        {/* Directory Header */}
                        <div className="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-900">Tenant Directory</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''} found</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search tenants..."
                                        className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-56 transition"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Property Filter */}
                                <div className="relative">
                                    <select
                                        className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-600 font-medium transition cursor-pointer"
                                        value={propertyFilter}
                                        onChange={(e) => setPropertyFilter(e.target.value)}
                                    >
                                        {properties.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>

                                <button
                                    onClick={() => navigate(ROUTES.OWNER_ROOMS)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm shadow-blue-200"
                                >
                                    <span className="text-base leading-none">+</span> Add Tenant
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/70 border-b border-gray-100">
                                        {['Tenant', 'Property', 'Lease Status', 'Rent Status', 'Move-in Date', 'Actions'].map((h, i) => (
                                            <th key={i} className={`px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider ${i === 5 ? 'text-center' : ''}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-sm text-gray-400 font-medium">Loading tenant data...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentTenants.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
                                                        <Users className="w-7 h-7 text-gray-300" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-400">No tenants found</p>
                                                    <p className="text-xs text-gray-300">Try adjusting your search or filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentTenants.map((item) => {
                                            const leaseStyle = getLeaseStyle(item.lease_status);
                                            const rentStyle = getRentStyle(item.rent_status);
                                            return (
                                                <tr key={item.id} className="hover:bg-blue-50/20 transition group">
                                                    {/* Tenant */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow flex-shrink-0">
                                                                <img
                                                                    src={item.tenant.profile_photo
                                                                        ? getMediaUrl(item.tenant.profile_photo)
                                                                        : `https://ui-avatars.com/api/?name=${item.tenant.full_name}&background=eff6ff&color=2563eb&bold=true`}
                                                                    className="w-full h-full object-cover"
                                                                    alt=""
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm">{item.tenant.full_name}</p>
                                                                <p className="text-xs text-gray-400">{item.tenant.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Property */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                                            <span className="text-sm text-gray-700 font-medium">{item.property}</span>
                                                        </div>
                                                    </td>

                                                    {/* Lease Status */}
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                                            style={{ background: leaseStyle.bg, color: leaseStyle.color, border: `1px solid ${leaseStyle.border}` }}>
                                                            {item.lease_status}
                                                        </span>
                                                    </td>

                                                    {/* Rent Status */}
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                                            style={{ background: rentStyle.bg, color: rentStyle.color, border: `1px solid ${rentStyle.border}` }}>
                                                            {item.rent_status}
                                                        </span>
                                                    </td>

                                                    {/* Move-in Date */}
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600 font-medium">{item.move_in_date}</span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                onClick={() => navigate(ROUTES.CHAT)}
                                                                className="w-8 h-8 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                                title="Message Tenant"
                                                            >
                                                                <MessageSquare className="w-4 h-4" />
                                                            </button>
                                                            <Link
                                                                to={`/room/${item.id}`}
                                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition"
                                                                title="View Room"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                            <button
                                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition"
                                                                title="Edit Lease"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && filteredTenants.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
                                <p className="text-xs text-gray-400 font-medium">
                                    Showing <span className="font-bold text-gray-600">{indexOfFirstTenant + 1}</span> to{' '}
                                    <span className="font-bold text-gray-600">{Math.min(indexOfLastTenant, filteredTenants.length)}</span> of{' '}
                                    <span className="font-bold text-gray-600">{filteredTenants.length}</span> tenants
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-500" />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition ${currentPage === i + 1
                                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                                    : 'text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
                                    >
                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OwnerTenants;