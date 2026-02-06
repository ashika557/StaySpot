import React from 'react';
import { Home, LayoutDashboard, Search, Calendar, AlertTriangle, MessageSquare, DollarSign, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getMediaUrl } from '../constants/api';

export default function TenantSidebar({ user }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/tenant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tenant/search', icon: Search, label: 'Search Rooms' },
    { path: '/tenant/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/tenant/complaints', icon: AlertTriangle, label: 'Complaints & Reviews' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/tenant/payments', icon: DollarSign, label: 'Payments' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="w-64 bg-white border-r h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div className="text-xl font-bold text-blue-600">Stay Spot</div>
        </div>
      </div>

      <nav className="p-4 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${isActive(item.path)
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
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