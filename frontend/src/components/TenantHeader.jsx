import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Bell } from 'lucide-react';
import { ROUTES, getMediaUrl } from '../constants/api';
import NotificationBell from './NotificationBell';

export default function TenantHeader({ user }) {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { to: ROUTES.TENANT_DASHBOARD, label: 'Dashboard' },
        { to: ROUTES.TENANT_SEARCH, label: 'Search Rooms' },
        { to: ROUTES.CHAT, label: 'Messages' },
        { to: ROUTES.PROFILE, label: 'Profile' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm h-16 flex items-center px-6">
            {/* Logo */}
            <Link to={ROUTES.TENANT_DASHBOARD} className="flex items-center gap-2 mr-8 flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Home className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">StaySpot</span>
            </Link>

            {/* Nav Links */}
            <nav className="flex items-center gap-1 flex-1">
                {navLinks.map(({ to, label }) => (
                    <Link
                        key={to}
                        to={to}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(to)
                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        {label}
                    </Link>
                ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4 flex-shrink-0">
                <NotificationBell user={user} />
                {user && (
                    <Link to={ROUTES.PROFILE} className="flex items-center gap-2 group">
                        <img
                            src={
                                user.profile_photo
                                    ? getMediaUrl(user.profile_photo)
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=3b82f6&color=fff&bold=true&size=64`
                            }
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover border-2 border-gray-100 group-hover:border-blue-300 transition"
                        />
                        <span className="text-sm font-medium text-gray-700 hidden md:block max-w-[100px] truncate">
                            {user.full_name || 'Tenant'}
                        </span>
                    </Link>
                )}
            </div>
        </header>
    );
}
