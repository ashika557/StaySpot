import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Home, Calendar, AlertTriangle,
    CheckCircle, Clock, Bell, Upload, UserPlus, Settings
} from 'lucide-react';
import { adminService } from '../services/adminService';

export default function AdminDashboard({ user }) {
    const navigate = useNavigate();

    // State for dashboard data
    const [stats, setStats] = useState(null);

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch dashboard data when component loads
    useEffect(() => {
        fetchStats();
    }, []);

    // Function to get dashboard statistics from API
    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await adminService.getDashboardStats();
            setStats(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
            setError('Failed to load dashboard data. Please try again.');
            setLoading(false);
        }
    };

    // Loading screen
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-gray-500 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700">

            {/* Dashboard Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                        Platform Overview
                    </h1>
                    <p className="text-gray-500 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                <div className="flex items-center gap-3">

                    {/* Refresh dashboard data */}
                    <button
                        onClick={fetchStats}
                        className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <svg className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        System Health: Good
                    </button>
                </div>
            </div>

            {/* Error message if API fails */}
            {error && (
                <div className="bg-red-50 text-red-600 p-6 rounded-3xl mb-8 flex items-center gap-4 border border-red-100 shadow-sm">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-black uppercase tracking-wider text-xs mb-1">Error</p>
                        <p className="font-semibold text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Top statistics cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

                <StatCard
                    label="Active Users"
                    value={stats?.stats?.total_users?.toLocaleString() || '0'}
                    icon={Users}
                    color="from-blue-500 to-blue-600"
                />

                <StatCard
                    label="Total Inventory"
                    value={stats?.stats?.total_rooms?.toLocaleString() || '0'}
                    icon={Home}
                    color="from-indigo-500 to-indigo-600"
                />

                <StatCard
                    label="Bookings"
                    value={stats?.stats?.total_bookings?.toLocaleString() || '0'}
                    icon={Calendar}
                    color="from-emerald-500 to-emerald-600"
                />

                <StatCard
                    label="Incidents"
                    value={stats?.stats?.active_complaints?.toLocaleString() || '0'}
                    icon={AlertTriangle}
                    color="from-rose-500 to-rose-600"
                />
            </section>

            {/* Dashboard middle section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Complaint statistics chart */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow border border-gray-100 p-10">

                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Support Metrics</h2>
                            <p className="text-gray-500 font-medium">Issue resolution breakdown</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-around gap-12">

                        {/* Donut chart */}
                        <div className="relative w-64 h-64">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">

                                <PieSegment
                                    percentage={stats?.complaint_breakdown?.Resolved || 0}
                                    color="#10B981"
                                    offset={0}
                                />

                                <PieSegment
                                    percentage={stats?.complaint_breakdown?.['In Progress'] || 0}
                                    color="#3B82F6"
                                    offset={stats?.complaint_breakdown?.Resolved || 0}
                                />

                                <PieSegment
                                    percentage={stats?.complaint_breakdown?.Pending || 0}
                                    color="#F43F5E"
                                    offset={(stats?.complaint_breakdown?.Resolved || 0) +
                                        (stats?.complaint_breakdown?.['In Progress'] || 0)}
                                />
                            </svg>

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white rounded-full w-44 h-44 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-gray-900">
                                        {stats?.stats?.active_complaints || 0}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-black uppercase mt-2">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Chart legend */}
                        <div className="space-y-8">
                            <LegendItem label="Resolved" value={stats?.complaint_breakdown?.Resolved || 0} color="bg-emerald-500" />
                            <LegendItem label="Under Investigation" value={stats?.complaint_breakdown?.['In Progress'] || 0} color="bg-blue-500" />
                            <LegendItem label="Action Required" value={stats?.complaint_breakdown?.Pending || 0} color="bg-rose-500" />
                        </div>
                    </div>
                </div>

                {/* Quick navigation actions */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow border border-gray-100 p-10">
                        <h2 className="text-2xl font-black text-gray-900 mb-8">Management</h2>

                        <div className="grid grid-cols-2 gap-6 text-center">
                            <QuickAction icon={Users} label="Users" gradient="from-blue-50 to-indigo-50" iconColor="text-blue-600" onClick={() => navigate('/admin/users')} />
                            <QuickAction icon={Home} label="Rooms" gradient="from-purple-50 to-pink-50" iconColor="text-purple-600" onClick={() => navigate('/admin/rooms')} />
                            <QuickAction icon={AlertTriangle} label="Issues" gradient="from-rose-50 to-orange-50" iconColor="text-rose-600" onClick={() => navigate('/admin/complaints')} />
                            <QuickAction icon={Settings} label="Config" gradient="from-emerald-50 to-teal-50" iconColor="text-emerald-600" onClick={() => navigate('/admin/settings')} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


/* Statistic card component */
function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="bg-white rounded-[2rem] shadow border border-gray-100 p-8 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">{label}</p>
                    <h3 className="text-4xl font-black text-gray-900">{value}</h3>
                </div>

                <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
            </div>
        </div>
    );
}


/* Donut chart segment */
function PieSegment({ percentage, color, offset }) {
    const dashArray = `${percentage} ${100 - percentage}`;

    return (
        <circle
            cx="18"
            cy="18"
            r="15.915"
            fill="transparent"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={dashArray}
            strokeDashoffset={-offset}
            strokeLinecap="round"
        />
    );
}


function LegendItem({ label, value, color }) {
    return (
        <div className="flex items-center gap-4">
            <div className={`w-4 h-4 ${color} rounded-full`}></div>
            <p className="text-sm font-bold text-gray-700">{label}</p>
            <span className="text-sm font-black text-gray-900">{value}%</span>
        </div>
    );
}


function QuickAction({ icon: Icon, label, gradient, iconColor, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`bg-gradient-to-br ${gradient} rounded-[2rem] p-8 hover:scale-[1.05] flex flex-col items-center gap-4`}
        >
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
                <Icon className={`w-7 h-7 ${iconColor}`} />
            </div>
            <span className={`text-[11px] font-black ${iconColor} uppercase`}>
                {label}
            </span>
        </button>
    );
}


/* Activity icon mapping */
function getActivityIcon(iconName) {
    switch (iconName) {
        case 'user': return UserPlus;
        case 'home': return Upload;
        case 'calendar': return CheckCircle;
        case 'alert': return AlertTriangle;
        default: return Clock;
    }
}


/* Activity color mapping */
function getActivityColor(iconName) {
    switch (iconName) {
        case 'user': return 'bg-blue-500';
        case 'home': return 'bg-purple-500';
        case 'calendar': return 'bg-emerald-500';
        case 'alert': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
}