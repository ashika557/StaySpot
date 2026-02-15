import React, { useState, useEffect } from 'react';
import {
    Calendar,
    TrendingUp,
    DollarSign,
    Search,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    CreditCard,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Filter
} from 'lucide-react';
import Sidebar from './sidebar';
import TenantHeader from '../components/TenantHeader';
import { API_ENDPOINTS, ROUTES, getMediaUrl } from '../constants/api';
import { apiRequest } from '../utils/api';

const OwnerPayments = ({ user, onLogout }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        this_month: { earnings: 0, transactions: 0, change: 0 },
        last_month: { earnings: 0, transactions: 0, change: 0 },
        all_time: { earnings: 0, since: 'January 2024' }
    });
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState({
        rooms: [],
        month: 'All Months',
        year: new Date().getFullYear().toString(),
        room_id: 'All Rooms'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 6;

    const months = [
        'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear.toString(), (currentYear - 1).toString()];

    useEffect(() => {
        fetchFinancialData();
    }, [filters.month, filters.year, filters.room_id]);

    const fetchFinancialData = async () => {
        try {
            setLoading(true);
            const monthIdx = months.indexOf(filters.month);
            const queryParams = new URLSearchParams({
                month: monthIdx > 0 ? monthIdx.toString() : 'All Months',
                year: filters.year,
                room_id: filters.room_id
            });

            const response = await apiRequest(`${API_ENDPOINTS.OWNER_FINANCIALS}?${queryParams.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
                setLogs(data.logs);
                if (data.filters && data.filters.rooms) {
                    setFilters(prev => ({ ...prev, rooms: data.filters.rooms }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch financial data", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered logs count for display
    const totalLogs = logs.length;
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(totalLogs / logsPerPage);

    const StatCard = ({ title, value, subtext, icon: Icon, change, isMain }) => (
        <div className={`${isMain ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'} p-6 rounded-2xl border ${isMain ? 'border-blue-500' : 'border-gray-100'} shadow-sm flex flex-col relative`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${isMain ? 'bg-white/20' : 'bg-blue-50'}`}>
                    <Icon className={`w-5 h-5 ${isMain ? 'text-white' : 'text-blue-600'}`} />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${change >= 0 ? (isMain ? 'bg-white/20 text-white' : 'bg-green-50 text-green-600') : 'bg-red-50 text-red-600'}`}>
                        {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {change >= 0 ? `+${change}%` : `${change}%`}
                    </div>
                )}
            </div>
            <p className={`${isMain ? 'text-blue-100' : 'text-gray-500'} text-xs font-medium mb-1`}>{title}</p>
            <h3 className="text-2xl font-bold mb-1">NPR {value.toLocaleString()}</h3>
            <p className={`${isMain ? 'text-blue-200' : 'text-gray-400'} text-[10px]`}>{subtext}</p>
            {isMain && (
                <div className="absolute right-4 bottom-4">
                    <TrendingUp className="w-12 h-12 text-white/10" />
                </div>
            )}
        </div>
    );

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Paid':
            case 'Completed':
                return 'bg-green-50 text-green-600';
            case 'Pending':
                return 'bg-orange-50 text-orange-600';
            case 'Overdue':
                return 'bg-red-50 text-red-600';
            default:
                return 'bg-gray-50 text-gray-500';
        }
    };

    const getPaymentMethodIcon = (method) => {
        if (!method) return null;
        if (method.toLowerCase().includes('esewa')) return <img src="https://esewa.com.np/common/images/esewa_logo.png" className="w-5 h-5 object-contain" alt="eSewa" />;
        if (method.toLowerCase().includes('khalti')) return <img src="https://khalti.com/static/img/logo1.png" className="w-5 h-5 object-contain" alt="Khalti" />;
        return <Wallet className="w-4 h-4 text-blue-600" />;
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col min-w-0">
                <TenantHeader user={user} onLogout={onLogout} />

                <main className="p-8 overflow-y-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Earnings & Payments</h2>
                        <p className="text-gray-500">Track and manage your rental income</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard
                            title="This Month"
                            value={stats.this_month.earnings}
                            subtext={`${stats.this_month.transactions} transactions`}
                            icon={Calendar}
                            change={stats.this_month.change}
                        />
                        <StatCard
                            title="Last Month"
                            value={stats.last_month.earnings}
                            subtext={`${stats.last_month.transactions} transactions`}
                            icon={Calendar}
                            change={0.2}
                        />
                        <StatCard
                            title="All-Time Earnings"
                            value={stats.all_time.earnings}
                            subtext={`Since ${stats.all_time.since}`}
                            icon={TrendingUp}
                            isMain={true}
                        />
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filters:</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-400 font-bold ml-1">MONTH</label>
                                <select
                                    className="bg-gray-50 border border-transparent rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                    value={filters.month}
                                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-400 font-bold ml-1">YEAR</label>
                                <select
                                    className="bg-gray-50 border border-transparent rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                    value={filters.year}
                                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-400 font-bold ml-1">ROOM</label>
                                <select
                                    className="bg-gray-50 border border-transparent rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                    value={filters.room_id}
                                    onChange={(e) => setFilters({ ...filters, room_id: e.target.value })}
                                >
                                    <option value="All Rooms">All Rooms</option>
                                    {filters.rooms.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Payment Logs Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Payment Logs</h3>
                            <p className="text-xs text-gray-400 font-medium">Recent payment transactions</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Tenant Name</th>
                                        <th className="px-6 py-4">Room</th>
                                        <th className="px-6 py-4">Payment Method</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                    <p>Updating records...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">
                                                No payment records found for this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        currentLogs.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                    {p.date}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={p.tenant.profile_photo || `https://ui-avatars.com/api/?name=${p.tenant.full_name}&background=eff6ff&color=3b82f6&bold=true`}
                                                            className="w-8 h-8 rounded-full object-cover border border-gray-100"
                                                            alt=""
                                                        />
                                                        <p className="font-bold text-gray-900 text-sm">{p.tenant.full_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 font-medium font-sans italic">
                                                    {p.room}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentMethodIcon(p.payment_method)}
                                                        <span className="text-xs text-gray-600 font-medium">{p.payment_method}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900 text-sm">NPR {p.amount.toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(p.status)}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
                            <p className="text-xs text-gray-500 font-medium">
                                Showing <span className="font-bold text-gray-900">{indexOfFirstLog + 1}</span> to <span className="font-bold text-gray-900">{Math.min(indexOfLastLog, totalLogs)}</span> of <span className="font-bold text-gray-900">{totalLogs}</span> entries
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition text-xs font-bold text-gray-600"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 border border-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition text-xs font-bold text-gray-600"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OwnerPayments;
