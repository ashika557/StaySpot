import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Home, AlertCircle, Settings, LogOut, ChevronRight } from 'lucide-react';
import { ROUTES, getMediaUrl } from '../constants/api';

export default function AdminSidebar({ user }) {
    const location = useLocation();

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { id: 'users', icon: Users, label: 'Manage Users', path: '/admin/users' },
        { id: 'rooms', icon: Home, label: 'Manage Rooms', path: '/admin/rooms' },
        { id: 'complaints', icon: AlertCircle, label: 'Complaints', path: '/admin/complaints' },
        { id: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings' }
    ];

    return (
        <div className="w-72 bg-white border-r border-gray-100 h-screen flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Brand Header */}
            <div className="p-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Home className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 leading-none">StaySpot</h1>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mt-1">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="px-4 py-6 flex-1 space-y-2 overflow-y-auto">
                <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Main Menu</p>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');

                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${isActive
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-100'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
                                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}>{item.label}</span>
                            </div>
                            {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Section */}
            <div className="p-6 mt-auto">
                <button
                    onClick={() => {
                        localStorage.removeItem('user');
                        window.location.href = '/';
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm group"
                >
                    <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </div>
                    Sign Out
                </button>
            </div>
        </div>
    );
}
