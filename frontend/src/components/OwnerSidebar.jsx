import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, DollarSign, MessageSquare, Eye, Settings, TrendingUp, User, Wrench } from 'lucide-react';
import { getMediaUrl } from '../constants/api';

export default function OwnerSidebar({ user }) {
    const location = useLocation();

    const menuItems = [
        { id: 'dashboard', icon: TrendingUp, label: 'Dashboard', path: '/owner/dashboard' },
        { id: 'rooms', icon: Home, label: 'My Rooms', path: '/owner/rooms' },
        { id: 'bookings', icon: Calendar, label: 'Bookings', path: '/owner/bookings' },
        { id: 'tenants', icon: Users, label: 'Tenants', path: '/owner/tenants' },
        { id: 'maintenance', icon: Wrench, label: 'Maintenance', path: '/owner/maintenance' },
        { id: 'payments', icon: DollarSign, label: 'Payments', path: '/owner/payments' },
        { id: 'messages', icon: MessageSquare, label: 'Messages', path: '/chat' },
        { id: 'visits', icon: Eye, label: 'Visits', path: '/owner/visits' },
        { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
        { id: 'settings', icon: Settings, label: 'Settings', path: '/owner/settings' }
    ];

    return (
        <div className="w-64 bg-white border-r h-screen sticky top-0 flex flex-col">
            <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Home className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">StaySpot</h1>
                        <p className="text-xs text-gray-500">Owner Portal</p>
                    </div>
                </div>
            </div>
            <nav className="p-4 flex-1">
                {menuItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${isActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile Section at Bottom */}
            {user && (
                <div className="p-4 border-t bg-gray-50/50">
                    <div className="flex items-center gap-3 px-2">
                        <div className="relative">
                            <img
                                src={user.profile_photo ? getMediaUrl(user.profile_photo) : `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=3b82f6&color=fff&bold=true`}
                                alt="Profile"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {user.full_name || 'User'}
                            </p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                                {user.role}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
