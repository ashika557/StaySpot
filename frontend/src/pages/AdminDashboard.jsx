import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Home, Calendar, AlertTriangle,
    UserPlus, Upload, CheckCircle, Clock,
    Settings, ChevronRight, Bell, Search
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { getMediaUrl } from '../constants/api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminDashboard({ user }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

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

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <AdminSidebar user={user} />
                <div className="flex-1 lg:ml-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-[#F8F9FC] min-h-screen">
            <AdminSidebar user={user} />

            <main className="flex-1 lg:ml-64 p-8">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {/* Stats Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        label="Total Users"
                        value={stats?.stats?.total_users?.toLocaleString() || '0'}
                        change="+12% from last month"
                        icon={Users}
                        color="bg-blue-500"
                        lightColor="bg-blue-50"
                        textColor="text-blue-600"
                    />
                    <StatCard
                        label="Total Rooms"
                        value={stats?.stats?.total_rooms?.toLocaleString() || '0'}
                        change="+8% from last month"
                        icon={Home}
                        color="bg-purple-500"
                        lightColor="bg-purple-50"
                        textColor="text-purple-600"
                    />
                    <StatCard
                        label="Total Bookings"
                        value={stats?.stats?.total_bookings?.toLocaleString() || '0'}
                        change="+15% from last month"
                        icon={Calendar}
                        color="bg-green-500"
                        lightColor="bg-green-50"
                        textColor="text-green-600"
                    />
                    <StatCard
                        label="Active Complaints"
                        value={stats?.stats?.active_complaints?.toLocaleString() || '0'}
                        change="5 pending review"
                        icon={AlertTriangle}
                        color="bg-red-500"
                        lightColor="bg-red-50"
                        textColor="text-red-600"
                        isAlert={true}
                    />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Complaints Status Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-8">Complaints Status</h2>
                        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                            {/* Simple Custom SVG Pie Chart */}
                            <div className="relative w-64 h-64">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    <PieSegment
                                        percentage={stats?.complaint_breakdown?.Resolved || 45}
                                        color="#10B981"
                                        offset={0}
                                    />
                                    <PieSegment
                                        percentage={stats?.complaint_breakdown?.['In Progress'] || 32}
                                        color="#F59E0B"
                                        offset={stats?.complaint_breakdown?.Resolved || 45}
                                    />
                                    <PieSegment
                                        percentage={stats?.complaint_breakdown?.Pending || 23}
                                        color="#EF4444"
                                        offset={(stats?.complaint_breakdown?.Resolved || 45) + (stats?.complaint_breakdown?.['In Progress'] || 32)}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-white rounded-full w-40 h-40 shadow-inner flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-gray-900">{stats?.stats?.active_complaints || 0}</span>
                                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active</span>
                                    </div>
                                </div>
                            </div>

                            {/* Legends */}
                            <div className="space-y-6">
                                <LegendItem label="Resolved" value={stats?.complaint_breakdown?.Resolved || 45} color="bg-emerald-500" />
                                <LegendItem label="In Progress" value={stats?.complaint_breakdown?.['In Progress'] || 32} color="bg-amber-500" />
                                <LegendItem label="Pending" value={stats?.complaint_breakdown?.Pending || 23} color="bg-red-500" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <QuickAction icon={Users} label="Manage Users" color="bg-blue-50" iconColor="text-blue-600" onClick={() => navigate('/admin/users')} />
                                <QuickAction icon={Home} label="Manage Rooms" color="bg-purple-50" iconColor="text-purple-600" onClick={() => navigate('/admin/rooms')} />
                                <QuickAction icon={AlertTriangle} label="Complaints" color="bg-red-50" iconColor="text-red-600" onClick={() => navigate('/admin/complaints')} />
                                <QuickAction icon={Settings} label="Settings" color="bg-green-50" iconColor="text-green-600" onClick={() => navigate('/admin/settings')} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity List */}
                <section className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                        <button className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">
                            View All <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-6">
                        {stats?.recent_activity?.map((activity, idx) => (
                            <ActivityItem
                                key={idx}
                                type={activity.type}
                                detail={activity.detail}
                                time={new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                icon={getActivityIcon(activity.icon)}
                                iconBg={getActivityColor(activity.icon)}
                            />
                        ))}
                        {(stats?.recent_activity?.length === 0 || !stats?.recent_activity) && (
                            <p className="text-gray-500 text-center py-4">No recent activity found.</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

// Helper Components
function StatCard({ label, value, change, icon: Icon, color, lightColor, textColor, isAlert }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-bold text-gray-500 tracking-wide uppercase mb-1">{label}</p>
                    <h3 className="text-3xl font-black text-gray-900 leading-none">{value}</h3>
                </div>
                <div className={`${lightColor} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${textColor}`} />
                </div>
            </div>
            <p className={`text-xs font-bold ${isAlert ? 'text-red-500' : 'text-emerald-500'} flex items-center gap-1`}>
                {change}
            </p>
        </div>
    );
}

function PieSegment({ percentage, color, offset }) {
    const dashArray = `${percentage} ${100 - percentage}`;
    return (
        <circle
            cx="18"
            cy="18"
            r="15.91549430918954"
            fill="transparent"
            stroke={color}
            strokeWidth="3.8"
            strokeDasharray={dashArray}
            strokeDashoffset={-offset}
            className="transition-all duration-1000 ease-out"
        />
    );
}

function LegendItem({ label, value, color }) {
    return (
        <div className="flex items-center gap-4">
            <div className={`w-4 h-4 ${color} rounded-full`}></div>
            <div className="flex-1">
                <p className="text-sm font-bold text-gray-700">{label}</p>
            </div>
            <span className="text-sm font-black text-gray-900">{value}%</span>
        </div>
    );
}

function QuickAction({ icon: Icon, label, color, iconColor, onClick }) {
    return (
        <button onClick={onClick} className={`${color} group rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] flex flex-col items-center justify-center gap-3 border border-transparent hover:border-white/50 shadow-sm`}>
            <Icon className={`w-8 h-8 ${iconColor} transition-transform group-hover:scale-110`} />
            <span className={`text-xs font-black ${iconColor} uppercase tracking-tighter`}>{label}</span>
        </button>
    );
}

function ActivityItem({ type, detail, time, icon: Icon, iconBg }) {
    return (
        <div className="flex items-center gap-4 group cursor-pointer">
            <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{type}</h4>
                <p className="text-xs text-gray-500 truncate">{detail}</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-black text-gray-400 group-hover:text-gray-900 transition-colors">{time}</p>
            </div>
        </div>
    );
}

function getActivityIcon(iconName) {
    switch (iconName) {
        case 'user': return UserPlus;
        case 'home': return Upload;
        case 'calendar': return CheckCircle;
        case 'alert': return AlertTriangle;
        default: return Clock;
    }
}

function getActivityColor(iconName) {
    switch (iconName) {
        case 'user': return 'bg-blue-500';
        case 'home': return 'bg-purple-500';
        case 'calendar': return 'bg-emerald-500';
        case 'alert': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
}
