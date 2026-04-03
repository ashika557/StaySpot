import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Home, Calendar, AlertTriangle,
    CheckCircle, Clock, Bell, Upload, UserPlus, Settings,
    Activity, ShieldCheck, Zap, ArrowUpRight, ChevronRight,
    Search, PieChart, BarChart3, TrendingUp, ShieldAlert, BadgeCheck
} from 'lucide-react';
import { adminService } from '../services/adminService';

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
        } catch (err) {
            setError('Failed to fetch platform metrics.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700 font-inter pb-12 relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-indigo-50/50 blur-[120px] rounded-full -mr-20 -mt-20"></div>

            {/* Dashboard Header */}
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
                <div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Platform Management</p>
                    <h1 className="text-4xl font-black text-slate-900 font-outfit tracking-tighter uppercase leading-none">
                        Admin Dashboard.
                    </h1>
                    <div className="flex items-center gap-3 mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Activity size={12} className="text-emerald-500 animate-pulse" />
                        System Status: Online
                        <span className="opacity-20">•</span>
                        <Clock size={12} />
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchStats}
                        className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm shadow-slate-200/50 text-slate-400 hover:text-indigo-600"
                    >
                        <Zap size={20} className={loading ? 'animate-pulse' : ''} />
                    </button>

                    <div className="hidden lg:flex items-center gap-4 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-100/50">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Status: Secure</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
                {[
                    { label: 'Total Users', value: stats?.stats?.total_users, icon: <Users />, color: 'indigo' },
                    { label: 'Total Rooms', value: stats?.stats?.total_rooms, icon: <Home />, color: 'emerald' },
                    { label: 'Total Bookings', value: stats?.stats?.total_bookings, icon: <Calendar />, color: 'amber' },
                    { label: 'Active Complaints', value: stats?.stats?.active_complaints, icon: <ShieldAlert />, color: 'rose' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:shadow-2xl transition-all duration-300">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${
                            stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                            stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                            stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                            'bg-rose-50 text-rose-500'
                        }`}>
                            {React.cloneElement(stat.icon, { className: 'w-7 h-7' })}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black font-outfit text-slate-900 tracking-tight leading-none uppercase">{stat.value?.toLocaleString() || '0'}</h3>
                        <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50/50 w-fit px-3 py-1 rounded-lg">
                            <ArrowUpRight size={12} />
                            +4.2% Growth
                        </div>
                    </div>
                ))}
            </div>

            {/* Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
                {/* Resolution Overview */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 p-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    
                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <div>
                            <h2 className="text-2xl font-black font-outfit text-slate-900 uppercase tracking-tight">Support Overview</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status of tenant and owner complaints</p>
                        </div>
                        <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm border border-slate-50"><PieChart size={20} /></button>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-20 py-6 relative z-10">
                        {/* Donut Chart */}
                        <div className="relative w-72 h-72 group">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 filter drop-shadow-2xl">
                                <PieSegment percentage={stats?.complaint_breakdown?.Resolved || 0} color="#6366F1" offset={0} />
                                <PieSegment percentage={stats?.complaint_breakdown?.['In Progress'] || 0} color="#F59E0B" offset={stats?.complaint_breakdown?.Resolved || 0} />
                                <PieSegment percentage={stats?.complaint_breakdown?.Pending || 0} color="#F43F5E" offset={(stats?.complaint_breakdown?.Resolved || 0) + (stats?.complaint_breakdown?.['In Progress'] || 0)} />
                            </svg>

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white rounded-full w-48 h-48 flex flex-col items-center justify-center shadow-inner border border-slate-50">
                                    <span className="text-6xl font-black text-slate-900 font-outfit tracking-tighter shadow-indigo-50">
                                        {stats?.stats?.active_complaints || 0}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest">
                                        Open Issues
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="space-y-8 w-full md:w-auto">
                            <LegendItem label="Resolved" value={stats?.complaint_breakdown?.Resolved || 0} color="bg-indigo-500" />
                            <LegendItem label="In Progress" value={stats?.complaint_breakdown?.['In Progress'] || 0} color="bg-amber-500" />
                            <LegendItem label="Pending" value={stats?.complaint_breakdown?.Pending || 0} color="bg-rose-500" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 p-10 flex flex-col items-center justify-center h-full relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 transition-all group-hover:w-4"></div>
                        <h2 className="text-2xl font-black font-outfit text-slate-900 uppercase tracking-tight mb-10 w-full text-left">Quick Actions</h2>

                        <div className="grid grid-cols-2 gap-6 w-full">
                            {[
                                { icon: <Users />, label: 'Users', color: 'indigo', path: '/admin/users' },
                                { icon: <Home />, label: 'Rooms', color: 'emerald', path: '/admin/rooms' },
                                { icon: <ShieldAlert />, label: 'Issues', color: 'rose', path: '/admin/complaints' },
                                { icon: <Settings />, label: 'Settings', color: 'slate', path: '/admin/settings' },
                            ].map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(action.path)}
                                    className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] flex flex-col items-center gap-4 transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1 group/btn"
                                >
                                    <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover/btn:scale-110 transition-transform ${
                                        action.color === 'indigo' ? 'text-indigo-600' :
                                        action.color === 'emerald' ? 'text-emerald-600' :
                                        action.color === 'rose' ? 'text-rose-500' :
                                        'text-slate-600'
                                    }`}>
                                        {React.cloneElement(action.icon, { size: 24 })}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 group-hover/btn:text-slate-900 uppercase tracking-widest transition-colors">
                                        {action.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-10 w-full p-6 bg-indigo-600 rounded-[2rem] text-white overflow-hidden relative group/banner cursor-pointer" onClick={() => navigate('/admin/settings')}>
                            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover/banner:rotate-12 transition-transform duration-700 text-slate-900">
                                <BadgeCheck size={120} />
                            </div>
                            <h4 className="text-lg font-black font-outfit uppercase tracking-tight mb-1">System Audit</h4>
                            <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">Platform Optimized</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            `}</style>
        </div>
    );
}

function PieSegment({ percentage, color, offset }) {
    const dashArray = `${percentage} ${100 - percentage}`;
    return (
        <circle
            cx="18"
            cy="18"
            r="15.915"
            fill="transparent"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={dashArray}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
        />
    );
}

function LegendItem({ label, value, color }) {
    return (
        <div className="flex items-center justify-between gap-12 group cursor-default">
            <div className="flex items-center gap-5">
                <div className={`w-3 h-3 ${color} rounded-full ring-4 ring-slate-50 group-hover:scale-125 transition-transform`}></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors uppercase leading-none">{label}</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-[2px] w-8 bg-slate-100 rounded-full mt-1 group-hover:w-12 transition-all"></div>
                <span className="text-xl font-black text-slate-900 font-outfit tracking-tighter">{value}%</span>
            </div>
        </div>
    );
}