import React, { useState, useEffect } from 'react';
import { Search, Users, FileText, AlertTriangle, Wrench, MapPin, Eye, Edit, MessageSquare, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './sidebar';
import TenantHeader from '../components/TenantHeader';
import { API_ENDPOINTS, getMediaUrl, ROUTES } from '../constants/api';
import { apiRequest } from '../utils/api';

const OwnerTenants = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_tenants: 0,
        active_leases: 0,
        pending_rent: 0,
        maintenance_requests: 0
    });
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [propertyFilter, setPropertyFilter] = useState('All Properties');
    const [currentPage, setCurrentPage] = useState(1);
    const tenantsPerPage = 5;

    useEffect(() => {
        fetchTenantData();
    }, []);

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

    // Filter tenants based on search and property
    const filteredTenants = tenants.filter(t => {
        const matchesSearch = t.tenant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tenant.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProperty = propertyFilter === 'All Properties' || t.property.includes(propertyFilter);
        return matchesSearch && matchesProperty;
    });

    // Pagination logic
    const indexOfLastTenant = currentPage * tenantsPerPage;
    const indexOfFirstTenant = indexOfLastTenant - tenantsPerPage;
    const currentTenants = filteredTenants.slice(indexOfFirstTenant, indexOfLastTenant);
    const totalPages = Math.ceil(filteredTenants.length / tenantsPerPage);

    // Get unique properties for filter
    const properties = ['All Properties', ...new Set(tenants.map(t => t.property.split(', ')[1]))];

    const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass }) => (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`w-12 h-12 ${bgColorClass} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
        </div>
    );

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col min-w-0">
                <TenantHeader user={user} onLogout={onLogout} />

                <main className="p-8 overflow-y-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
                        <p className="text-gray-500">Manage and monitor your tenants</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Total Tenants"
                            value={stats.total_tenants}
                            icon={Users}
                            colorClass="text-blue-600"
                            bgColorClass="bg-blue-50"
                        />
                        <StatCard
                            title="Active Leases"
                            value={stats.active_leases}
                            icon={FileText}
                            colorClass="text-green-600"
                            bgColorClass="bg-green-50"
                        />
                        <StatCard
                            title="Pending Rent"
                            value={stats.pending_rent}
                            icon={AlertTriangle}
                            colorClass="text-orange-600"
                            bgColorClass="bg-orange-50"
                        />
                        <StatCard
                            title="Maintenance Requests"
                            value={stats.maintenance_requests}
                            icon={Wrench}
                            colorClass="text-red-600"
                            bgColorClass="bg-red-50"
                        />
                    </div>

                    {/* Tenant Directory Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-gray-900">Tenant Directory</h3>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search tenants..."
                                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Property Filter */}
                                <select
                                    className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={propertyFilter}
                                    onChange={(e) => setPropertyFilter(e.target.value)}
                                >
                                    {properties.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>

                                <button
                                    onClick={() => navigate(ROUTES.OWNER_ROOMS)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                                >
                                    <span className="text-lg">+</span> Add Tenant
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Tenant</th>
                                        <th className="px-6 py-4">Property</th>
                                        <th className="px-6 py-4">Lease Status</th>
                                        <th className="px-6 py-4">Rent Status</th>
                                        <th className="px-6 py-4">Move-in Date</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                    <p>Loading tenant data...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentTenants.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                No tenants found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        currentTenants.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={item.tenant.profile_photo || `https://ui-avatars.com/api/?name=${item.tenant.full_name}&background=eff6ff&color=3b82f6&bold=true`}
                                                            className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                                            alt=""
                                                        />
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{item.tenant.full_name}</p>
                                                            <p className="text-xs text-gray-500">{item.tenant.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-700 font-medium">{item.property}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.lease_status === 'Expiring Soon' ? 'bg-orange-50 text-orange-600' :
                                                        item.lease_status === 'Active' || item.lease_status === 'Confirmed' ? 'bg-green-50 text-green-600' :
                                                            'bg-gray-50 text-gray-500'
                                                        }`}>
                                                        {item.lease_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.rent_status === 'Paid' ? 'bg-green-50 text-green-600' :
                                                        item.rent_status === 'Pending' ? 'bg-orange-50 text-orange-600' :
                                                            item.rent_status === 'Overdue' ? 'bg-red-50 text-red-600' :
                                                                'bg-gray-50 text-gray-500'
                                                        }`}>
                                                        {item.rent_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                    {item.move_in_date}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={() => navigate(ROUTES.CHAT)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Message Tenant"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </button>
                                                        <Link
                                                            to={`/room/${item.id}`} // Adjust based on your room link structure
                                                            className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition"
                                                            title="View Room"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                        <button className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition" title="Edit Lease">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                Showing <span className="font-bold">{indexOfFirstTenant + 1}</span> to <span className="font-bold">{Math.min(indexOfLastTenant, filteredTenants.length)}</span> of <span className="font-bold">{filteredTenants.length}</span> tenants
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OwnerTenants;
