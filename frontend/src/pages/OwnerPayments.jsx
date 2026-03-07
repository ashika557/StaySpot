import React, { useState, useEffect } from 'react';
import {
    Calendar,
    TrendingUp,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    CreditCard,
} from 'lucide-react';
import Sidebar from './sidebar';
import { API_ENDPOINTS } from '../constants/api';
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

    const totalLogs = logs.length;
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(totalLogs / logsPerPage);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Paid':
            case 'Completed':
                return 'bg-green-50 text-green-600 border border-green-200';
            case 'Pending':
                return 'bg-orange-50 text-orange-500 border border-orange-200';
            case 'Overdue':
                return 'bg-red-50 text-red-500 border border-red-200';
            default:
                return 'bg-gray-50 text-gray-500 border border-gray-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Paid':
            case 'Completed': return 'bg-green-500';
            case 'Pending': return 'bg-orange-400';
            case 'Overdue': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const getPaymentMethodIcon = (method) => {
        if (!method) return null;
        if (method.toLowerCase().includes('esewa'))
            return <img src="https://esewa.com.np/common/images/esewa_logo.png" className="w-5 h-5 object-contain" alt="eSewa" />;
        if (method.toLowerCase().includes('khalti'))
            return <img src="https://khalti.com/static/img/logo1.png" className="w-5 h-5 object-contain" alt="Khalti" />;
        return <Wallet className="w-4 h-4 text-blue-600" />;
    };

    const statCards = [
        {
            label: 'TOTAL EARNINGS',
            value: `NPR ${stats.all_time.earnings.toLocaleString()}`,
            subtext: `Since ${stats.all_time.since}`,
            icon: <DollarSign className="w-6 h-6 text-blue-500" />,
            iconBg: 'bg-blue-50',
            borderColor: 'border-t-blue-500',
            valueColor: 'text-gray-900',
        },
        {
            label: 'THIS MONTH',
            value: `NPR ${stats.this_month.earnings.toLocaleString()}`,
            subtext: `${stats.this_month.transactions} transactions`,
            icon: <Calendar className="w-6 h-6 text-green-500" />,
            iconBg: 'bg-green-50',
            borderColor: 'border-t-green-500',
            valueColor: 'text-gray-900',
            change: stats.this_month.change,
        },
        {
            label: 'LAST MONTH',
            value: `NPR ${stats.last_month.earnings.toLocaleString()}`,
            subtext: `${stats.last_month.transactions} transaction${stats.last_month.transactions !== 1 ? 's' : ''}`,
            icon: <CreditCard className="w-6 h-6 text-orange-500" />,
            iconBg: 'bg-orange-50',
            borderColor: 'border-t-orange-500',
            valueColor: stats.last_month.earnings > 0 ? 'text-orange-500' : 'text-gray-900',
        },
        {
            label: 'TOTAL TRANSACTIONS',
            value: `${totalLogs}`,
            subtext: 'All payment records',
            icon: <TrendingUp className="w-6 h-6 text-red-500" />,
            iconBg: 'bg-red-50',
            borderColor: 'border-t-red-500',
            valueColor: 'text-gray-900',
        },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-auto">
            <Sidebar user={user} />

            <div className="flex-1 flex flex-col min-w-0 overflow-auto">
                <main className="p-8">

                    {/* Page Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Earnings & Payments</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Track and manage your rental income</p>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                        {statCards.map((card, i) => (
                            <div
                                key={i}
                                className={`bg-white rounded-xl border-t-4 ${card.borderColor} shadow-sm p-5 flex flex-col gap-3`}
                            >
                                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                                    {card.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
                                    <div className="flex items-end gap-2">
                                        <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
                                        {card.change !== undefined && (
                                            <span className={`flex items-center gap-0.5 text-[10px] font-bold mb-0.5 ${card.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {card.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                {card.change >= 0 ? `+${card.change}%` : `${card.change}%`}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{card.subtext}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Payment Logs Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* Panel Header with inline filters */}
                        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Payment Directory</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{totalLogs} record{totalLogs !== 1 ? 's' : ''} found</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    <Filter className="w-3.5 h-3.5" />
                                    <span className="text-xs font-semibold text-gray-400">Filters:</span>
                                </div>

                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                                    value={filters.month}
                                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>

                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                                    value={filters.year}
                                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>

                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                                    value={filters.room_id}
                                    onChange={(e) => setFilters({ ...filters, room_id: e.target.value })}
                                >
                                    <option value="All Rooms">All Properties</option>
                                    {filters.rooms.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/60 border-b border-gray-100">
                                        <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tenant</th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Property</th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment Method</th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3 text-gray-400">
                                                    <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-sm font-medium">Loading records...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                                    <DollarSign className="w-8 h-8 text-gray-200" />
                                                    <p className="text-sm font-semibold text-gray-500">No payment records found</p>
                                                    <p className="text-xs">Try adjusting your filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentLogs.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{p.date}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={p.tenant.profile_photo || `https://ui-avatars.com/api/?name=${p.tenant.full_name}&background=eff6ff&color=3b82f6&bold=true`}
                                                            className="w-8 h-8 rounded-full object-cover border border-gray-100"
                                                            alt=""
                                                        />
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">{p.tenant.full_name}</p>
                                                            {p.tenant.email && (
                                                                <p className="text-xs text-gray-400">{p.tenant.email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                                        <span className="text-sm text-gray-600 italic">{p.room}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentMethodIcon(p.payment_method)}
                                                        <span className="text-sm text-gray-600">{p.payment_method}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900">NPR {p.amount.toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${getStatusStyles(p.status)}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(p.status)}`} />
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
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-xs text-gray-400 font-medium">
                                Showing{' '}
                                <span className="font-bold text-gray-700">{Math.min(indexOfFirstLog + 1, totalLogs)}</span>
                                {' '}to{' '}
                                <span className="font-bold text-gray-700">{Math.min(indexOfLastLog, totalLogs)}</span>
                                {' '}of{' '}
                                <span className="font-bold text-gray-700">{totalLogs}</span> records
                            </p>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                                            currentPage === i + 1
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-500 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition"
                                >
                                    <ChevronRight className="w-4 h-4" />
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