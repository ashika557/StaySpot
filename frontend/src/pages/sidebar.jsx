import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, DollarSign, MessageSquare, Eye, Settings, TrendingUp } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { id: 'dashboard', icon: TrendingUp, label: 'Dashboard', path: '/owner/dashboard' },
    { id: 'rooms', icon: Home, label: 'My Rooms', path: '/owner/rooms' },
    { id: 'bookings', icon: Calendar, label: 'Bookings', path: '/owner/bookings' },
    { id: 'tenants', icon: Users, label: 'Tenants', path: '/owner/tenants' },
    { id: 'payments', icon: DollarSign, label: 'Payments', path: '/owner/payments' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', path: '/owner/messages' },
    { id: 'visits', icon: Eye, label: 'Visits', path: '/owner/visits' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/owner/settings' }
  ];

  return (
    <div className="w-64 bg-white border-r h-screen sticky top-0">
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
      <nav className="p-4">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
                isActive
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
    </div>
  );
}