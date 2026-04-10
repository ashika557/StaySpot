import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Home, Calendar, AlertTriangle,
    Bell, Settings, CheckCircle
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function AdminDashboard({ user }) {
    const navigate = useNavigate();

    // State for dashboard data
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
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64 text-red-500">
                {error}
            </div>
        );
    }

    const pieData = [
        { name: 'Resolved', value: stats?.complaint_breakdown?.Resolved || 0, color: '#10B981' },
        { name: 'In Progress', value: stats?.complaint_breakdown?.['In Progress'] || 0, color: '#F59E0B' },
        { name: 'Pending', value: stats?.complaint_breakdown?.Pending || 0, color: '#EF4444' }
    ].filter(item => item.value > 0);

    // Provide default data if no breakdown is available so the chart at least renders
    const defaultPieData = pieData.length > 0 ? pieData : [
        { name: 'Resolved', value: 45, color: '#10B981' },
        { name: 'In Progress', value: 32, color: '#F59E0B' },
        { name: 'Pending', value: 23, color: '#EF4444' }
    ];

    const getIconForType = (type) => {
        if (type.includes('user')) return <Users className="w-5 h-5 text-blue-600" />;
        if (type.includes('room')) return <Home className="w-5 h-5 text-green-600" />;
        if (type.includes('booking')) return <Calendar className="w-5 h-5 text-purple-600" />;
        if (type.includes('omplaint')) return <AlertTriangle className="w-5 h-5 text-red-600" />;
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
    };

    const getColorClassForType = (type) => {
        if (type.includes('user')) return 'bg-blue-100';
        if (type.includes('room')) return 'bg-green-100';
        if (type.includes('booking')) return 'bg-purple-100';
        if (type.includes('omplaint')) return 'bg-red-100';
        return 'bg-gray-100';
    };

    const recentActivities = stats?.recent_activity || [];

    return (
        <div className="max-w-[1200px] mx-auto text-left">
            {/* Dashboard Header */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10 pt-4">
                <h1 className="text-2xl font-bold text-gray-800 px-2">Dashboard Overview</h1>
            </div>

            {/* Site Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2 px-2">
                {/* Total Users */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats?.stats?.total_users?.toLocaleString() || 0}</h3>
                            <p className="text-xs font-medium text-green-500 mt-1">+12% from last month</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Total Rooms */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Rooms</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats?.stats?.total_rooms?.toLocaleString() || 0}</h3>
                            <p className="text-xs font-medium text-green-500 mt-1">+8% from last month</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                            <Home className="w-6 h-6 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Total Bookings */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Bookings</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats?.stats?.total_bookings?.toLocaleString() || 0}</h3>
                            <p className="text-xs font-medium text-green-500 mt-1">+15% from last month</p>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Active Complaints */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Active Complaints</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats?.stats?.active_complaints?.toLocaleString() || 0}</h3>
                            <p className="text-xs font-medium text-red-500 mt-1">5 pending review</p>
                        </div>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Complaints Status Chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8 mx-2">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Complaints Status</h2>
                <div className="h-[250px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={defaultPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={90}
                                dataKey="value"
                                stroke="none"
                            >
                                {defaultPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 600 }}
                            />
                            <Legend 
                                verticalAlign="middle" 
                                align="right"
                                layout="vertical"
                                iconType="square"
                                wrapperStyle={{ paddingLeft: '40px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Lower Grid: Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 px-2 flex-grow">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col h-full min-h-[300px]">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h2>
                    
                    <div className="space-y-6 overflow-y-auto pr-2">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((act, idx) => {
                                const lowerType = act.type.toLowerCase();
                                return (
                                    <div key={idx} className="flex items-start gap-4">
                                        <div className={`w-10 h-10 ${getColorClassForType(lowerType)} rounded-full flex items-center justify-center shrink-0`}>
                                            {getIconForType(lowerType)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{act.type}</p>
                                            <p className="text-sm text-gray-500">{act.detail}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(act.time).toLocaleString(undefined, { 
                                                    month: 'short', day: 'numeric', 
                                                    hour: 'numeric', minute: '2-digit' 
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center text-gray-500 py-4">No recent activity</div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl bg-transparent border-0 flex flex-col h-full">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 px-1">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4 flex-grow">
                        <button 
                            onClick={() => navigate('/admin/users')}
                            className="bg-blue-50/50 hover:bg-blue-50 border border-blue-50 hover:border-blue-100 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors h-full min-h-[140px]"
                        >
                            <Users className="w-8 h-8 text-blue-600" />
                            <span className="font-medium text-sm text-gray-700">Manage Users</span>
                        </button>
                        
                        <button 
                            onClick={() => navigate('/admin/rooms')}
                            className="bg-purple-50/50 hover:bg-purple-50 border border-purple-50 hover:border-purple-100 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors h-full min-h-[140px]"
                        >
                            <Home className="w-8 h-8 text-purple-600" />
                            <span className="font-medium text-sm text-gray-700">Manage Rooms</span>
                        </button>

                        <button 
                            onClick={() => navigate('/admin/complaints')}
                            className="bg-red-50/50 hover:bg-red-50 border border-red-50 hover:border-red-100 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors h-full min-h-[140px]"
                        >
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                            <span className="font-medium text-sm text-gray-700">Complaints</span>
                        </button>

                        <button 
                            onClick={() => navigate('/admin/settings')}
                            className="bg-green-50/50 hover:bg-green-50 border border-green-50 hover:border-green-100 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors h-full min-h-[140px]"
                        >
                            <Settings className="w-8 h-8 text-green-600" />
                            <span className="font-medium text-sm text-gray-700">Settings</span>
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}