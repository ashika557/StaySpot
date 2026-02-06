import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES, getMediaUrl } from '../constants/api';
import NotificationBell from './NotificationBell';
import { Home, LogOut } from 'lucide-react';

function Navigation({ user, onLogout, showLanding }) {
  const location = useLocation();

  if (showLanding || !user) return null;

  const isOwner = user.role === 'Owner' || user.role === 'owner';
  const isTenant = user.role === 'Tenant' || user.role === 'tenant';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xl font-bold">StaySpot</span>
          </Link>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to={isOwner ? ROUTES.OWNER_DASHBOARD : ROUTES.TENANT_DASHBOARD}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(isOwner ? ROUTES.OWNER_DASHBOARD : ROUTES.TENANT_DASHBOARD)
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white hover:bg-blue-700'
                }`}
            >
              Dashboard
            </Link>
            <Link
              to={ROUTES.CHAT}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(ROUTES.CHAT)
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white hover:bg-blue-700'
                }`}
            >
              Messages
            </Link>
            {isTenant && (
              <Link
                to={ROUTES.TENANT_SEARCH}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(ROUTES.TENANT_SEARCH)
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-white hover:bg-blue-700'
                  }`}
              >
                Search Rooms
              </Link>
            )}
            <Link
              to={ROUTES.PROFILE}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(ROUTES.PROFILE)
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white hover:bg-blue-700'
                }`}
            >
              Profile
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell user={user} />

            {/* User Info */}
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-blue-500">
              <div className="text-right">
                <p className="text-xs text-blue-100">Welcome back,</p>
                <p className="text-sm font-semibold truncate max-w-[120px]">
                  {user.full_name || 'User'}
                </p>
              </div>

              {/* Profile Picture */}
              <Link to={ROUTES.PROFILE} className="relative group">
                <img
                  src={user.profile_photo ? getMediaUrl(user.profile_photo) : `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=fff&color=3b82f6&bold=true&size=128`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover group-hover:scale-105 transition-transform shadow-md"
                />
              </Link>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
