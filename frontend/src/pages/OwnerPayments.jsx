import React, { useState, useEffect } from 'react';
import { 
  Calendar, TrendingUp, ChevronLeft, 
  ChevronRight, Wallet, Filter, CreditCard, Search, 
  Home
} from 'lucide-react';
import OwnerSidebar from '../components/OwnerSidebar';
import { API_ENDPOINTS } from '../constants/api';
import { apiRequest } from '../utils/api';

const monthsList = [
    'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYearVal = new Date().getFullYear();
const yearsList = [currentYearVal.toString(), (currentYearVal - 1).toString()];

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
    const logsPerPage = 8;


    const fetchFinancialData = React.useCallback(async () => {
        try {
            setLoading(true);
        const monthIdx = monthsList.indexOf(filters.month);
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
        } catch (error) { console.error("Failed to fetch financial data", error); }
        finally { setLoading(false); }
    }, [filters.month, filters.year, filters.room_id]);

    useEffect(() => {
        fetchFinancialData();
    }, [fetchFinancialData]);

    const totalLogs = logs.length;
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(totalLogs / logsPerPage);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Paid': case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Pending': return 'bg-amber-50 text-amber-500 border-amber-100';
            case 'Overdue': return 'bg-rose-50 text-rose-500 border-rose-100';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    };

    const getPaymentMethodIcon = (method) => {
        if (!method) return (
            <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                <Wallet className="w-3.5 h-3.5" />
            </div>
        );
        const normalizedMethod = method.toLowerCase();
        if (normalizedMethod.includes('esewa')) return (
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">e</div>
        );
        if (normalizedMethod.includes('khalti')) return (
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">K</div>
        );
        return (
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                <CreditCard className="w-3.5 h-3.5" />
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
            <OwnerSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-auto">
                <div className="p-8 max-w-7xl mx-auto w-full">

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">My Income</h1>
                        <p className="text-sm text-gray-400 mt-0.5">View your room earnings and payment history</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Earnings', value: `Rs. ${stats.all_time.earnings.toLocaleString()}`, sub: `Since ${stats.all_time.since}`, icon: <TrendingUp />, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
                            { label: 'This Month', value: `Rs. ${stats.this_month.earnings.toLocaleString()}`, sub: `${stats.this_month.transactions} payments`, icon: <Calendar />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', change: stats.this_month.change },
                            { label: 'Last Month', value: `Rs. ${stats.last_month.earnings.toLocaleString()}`, sub: `${stats.last_month.transactions} payments`, icon: <CreditCard />, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
                            { label: 'Total Records', value: `${totalLogs}`, sub: 'Payment entries', icon: <Search />, iconBg: 'bg-gray-100', iconColor: 'text-gray-500' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${card.iconBg}`}>
                                    {React.cloneElement(card.icon, { className: `w-4 h-4 ${card.iconColor}` })}
                                </div>
                                <p className="text-xs text-gray-400 font-medium mb-0.5">{card.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-xl font-bold text-gray-900">{card.value}</h2>
                                    {card.change !== undefined && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${card.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                            {card.change >= 0 ? '+' : ''}{card.change}%
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Payment History Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Payment History</h2>
                                <p className="text-xs text-gray-400 mt-0.5">All payments received from tenants</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-400">
                                    <Filter className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">Filter</span>
                                </div>
                                <select
                                    className="appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer"
                                    value={filters.month}
                                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                                >
                                    {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select
                                    className="appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer"
                                    value={filters.year}
                                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                >
                                    {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <select
                                    className="appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer"
                                    value={filters.room_id}
                                    onChange={(e) => setFilters({ ...filters, room_id: e.target.value })}
                                >
                                    <option value="All Rooms">All Rooms</option>
                                    {filters.rooms.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/60 border-b border-gray-50">
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tenant</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Room</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="6" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-xs font-medium">Loading history...</p>
                                            </div>
                                        </td></tr>
                                    ) : currentLogs.length === 0 ? (
                                        <tr><td colSpan="6" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                    <Search className="w-5 h-5 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-500">No payments found</p>
                                                <p className="text-xs">Try adjusting your filters</p>
                                            </div>
                                        </td></tr>
                                    ) : (
                                        currentLogs.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50/60 transition-colors group">
                                                <td className="px-6 py-4 text-xs font-semibold text-gray-600">{p.date}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={p.tenant.profile_photo || `https://ui-avatars.com/api/?name=${p.tenant.full_name}&background=f3f4f6&color=94a3b8&bold=true`}
                                                            className="w-9 h-9 rounded-full object-cover border border-gray-100 group-hover:scale-105 transition-transform flex-shrink-0"
                                                            alt=""
                                                        />
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{p.tenant.full_name}</p>
                                                            <p className="text-xs text-gray-400 truncate max-w-[140px] mt-0.5">{p.tenant.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Home className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                                        <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{p.room}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentMethodIcon(p.payment_method)}
                                                        <span className="text-xs font-medium text-gray-500">{p.payment_method}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm font-bold text-gray-900">Rs. {p.amount.toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getStatusStyles(p.status)}`}>
                                                        {p.status}
                                                    </span>
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
                                Showing <span className="font-semibold text-gray-700">{indexOfFirstLog + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(indexOfLastLog, totalLogs)}</span> of <span className="font-semibold text-gray-700">{totalLogs}</span> records
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
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                            currentPage === i + 1
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

export default OwnerPayments;