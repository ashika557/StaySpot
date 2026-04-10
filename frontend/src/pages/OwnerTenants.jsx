import React, { useState, useEffect } from 'react';
import {
    Search, Users, FileText, AlertTriangle, Wrench, MapPin,
    Eye, Edit, MessageSquare, ChevronLeft, ChevronRight,
    ChevronDown, BadgeCheck, UserPlus, Bell
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import OwnerSidebar from '../components/OwnerSidebar';
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
    const tenantsPerPage = 6;

    const fetchTenantData = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiRequest(API_ENDPOINTS.OWNER_TENANTS);
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
                setTenants(data.tenants);
            }
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTenantData(); }, [fetchTenantData]);

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

    const getLeaseStyle = (s) => {
        if (s === 'Active' || s === 'Confirmed') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (s === 'Expiring Soon') return 'bg-amber-50 text-amber-600 border-amber-100';
        return 'bg-gray-50 text-gray-400 border-gray-100';
    };

    const getRentStyle = (s) => {
        if (s === 'Paid') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (s === 'Pending') return 'bg-amber-50 text-amber-600 border-amber-100';
        if (s === 'Overdue') return 'bg-rose-50 text-rose-500 border-rose-100';
        return 'bg-gray-50 text-gray-400 border-gray-100';
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
            <OwnerSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-auto">
                <div className="p-8 max-w-7xl mx-auto w-full">

                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Tenants</h1>
                            <p className="text-sm text-gray-400 mt-0.5">Manage your tenants and their information</p>
                        </div>
                        <button
                            onClick={() => navigate(ROUTES.OWNER_ROOMS)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                        >
                            <UserPlus className="w-3.5 h-3.5" /> Add Tenant
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Tenants', value: stats.total_tenants, icon: <Users />, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
                            { label: 'Active Leases', value: stats.active_leases, icon: <FileText />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                            { label: 'Pending Rent', value: stats.pending_rent, icon: <AlertTriangle />, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
                            { label: 'Maintenance', value: stats.maintenance_requests, icon: <Wrench />, iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${card.iconBg}`}>
                                    {React.cloneElement(card.icon, { className: `w-4 h-4 ${card.iconColor}` })}
                                </div>
                                <p className="text-xs text-gray-400 font-medium mb-0.5">{card.label}</p>
                                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tenant Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Table Header / Filters */}
                        <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Tenant List</h2>
                                <p className="text-xs text-gray-400 mt-0.5">All your current residents</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search tenants..."
                                        className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all w-48"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <select
                                        className="appearance-none pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer"
                                        value={propertyFilter}
                                        onChange={(e) => setPropertyFilter(e.target.value)}
                                    >
                                        {properties.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/60 border-b border-gray-50">
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tenant</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Room</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lease</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Move-in</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="6" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-xs font-medium">Loading tenants...</p>
                                            </div>
                                        </td></tr>
                                    ) : currentTenants.length === 0 ? (
                                        <tr><td colSpan="6" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                    <Search className="w-5 h-5 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-500">No tenants found</p>
                                                <p className="text-xs">Try adjusting your search or filter</p>
                                            </div>
                                        </td></tr>
                                    ) : (
                                        currentTenants.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/60 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative flex-shrink-0">
                                                            <img
                                                                src={item.tenant.profile_photo ? getMediaUrl(item.tenant.profile_photo) : `https://ui-avatars.com/api/?name=${item.tenant.full_name}&background=f3f4f6&color=94a3b8&bold=true`}
                                                                className="w-10 h-10 rounded-full object-cover border border-gray-100 group-hover:scale-105 transition-transform"
                                                                alt=""
                                                            />
                                                            {item.tenant.is_identity_verified && (
                                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white border border-white">
                                                                    <BadgeCheck size={9} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 truncate">{item.tenant.full_name}</p>
                                                            <p className="text-xs text-gray-400 truncate max-w-[150px] mt-0.5">{item.tenant.email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                                        <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{item.property}</span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getLeaseStyle(item.lease_status)}`}>
                                                        {item.lease_status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getRentStyle(item.rent_status)}`}>
                                                        {item.rent_status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-semibold text-gray-700">{item.move_in_date}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">Move-in date</p>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => navigate(ROUTES.CHAT)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                                                            title="Chat"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                        </button>
                                                        <Link
                                                            to={`/room/${item.id}`}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                                                            title="View"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Link>
                                                        <button
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        {(item.rent_status === 'Pending' || item.rent_status === 'Overdue') && (
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const response = await apiRequest(API_ENDPOINTS.TRIGGER_REMINDERS, {
                                                                            method: 'POST',
                                                                            body: JSON.stringify({ booking_id: item.id })
                                                                        });
                                                                        if (response.ok) alert("Reminder sent!");
                                                                        else alert("Failed to send reminder");
                                                                    } catch (e) { alert("Error sending reminder"); }
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-50 border border-orange-100 text-orange-500 hover:bg-orange-100 transition-all shadow-sm"
                                                                title="Remind"
                                                            >
                                                                <Bell className="w-3.5 h-3.5" />
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
                        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <p className="text-xs text-gray-400">
                                Showing <span className="font-semibold text-gray-700">{indexOfFirstTenant + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(indexOfLastTenant, filteredTenants.length)}</span> of <span className="font-semibold text-gray-700">{filteredTenants.length}</span> tenants
                            </p>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${currentPage === i + 1
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-white text-gray-400 border border-gray-100 hover:text-gray-700'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerTenants;