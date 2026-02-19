import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Home, AlertCircle, Settings, Home as LogoIcon } from 'lucide-react';
import { ROUTES, getMediaUrl } from '../constants/api';

/**
 * Premium Sidebar for the Admin Panel
 */
export default function AdminSidebar({ user }) {
    const location = useLocation();

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD },
        { id: 'users', icon: Users, label: 'Manage Users', path: '/admin/users' },
        { id: 'rooms', icon: Home, label: 'Manage Rooms', path: '/admin/rooms' },
        { id: 'complaints', icon: AlertCircle, label: 'Complaints', path: '/admin/complaints' },
        { id: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings' }
    ];

    return (
        <div className="w-64 bg-white border-r h-screen sticky top-0 flex flex-col shadow-sm">
            {/* Brand Header */}
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                        <LogoIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">StaySpot</h1>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-[0.2em]">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 flex-1 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-900'}`} />
                            <span className="text-sm font-semibold">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer Section */}
            {user && (
                <div className="p-4 border-t border-gray-100 mt-auto bg-gray-50/30">
                    <div className="flex items-center gap-3 px-2">
                        <div className="relative">
                            <img
                                src={user.profile_photo ? getMediaUrl(user.profile_photo) : `https://ui-avatars.com/api/?name=${user.full_name || 'Admin'}&background=3b82f6&color=fff&bold=true`}
                                alt="Profile"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                            />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {user.full_name || 'Administrator'}
                            </p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest leading-none mt-1">
                                {user.role}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
