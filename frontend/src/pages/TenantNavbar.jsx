import React from 'react';
import { Home, LayoutDashboard, Search, Calendar, AlertTriangle, MessageSquare, DollarSign, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function TenantSidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/tenant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tenant/search', icon: Search, label: 'Search Rooms' },
    { path: '/tenant/visits', icon: Calendar, label: 'My Visits' }, // Calendar icon is reused or use Eye
    { path: '/tenant/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/tenant/complaints', icon: AlertTriangle, label: 'Complaints & Reviews' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/tenant/payments', icon: DollarSign, label: 'Payments' },
    { path: '/tenant/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="w-64 bg-white border-r h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div className="text-xl font-bold text-blue-600">Stay Spot</div>
        </div>
      </div>

      <nav className="p-4">
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
    </div>
  );
}