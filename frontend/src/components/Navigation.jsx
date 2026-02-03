import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/api';

function Navigation({ user, onLogout, showLanding }) {
  // Only show nav if NOT landing
  if (showLanding) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to={ROUTES.HOME} className="text-2xl font-bold">
          StaySpot
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link
                to={user.role === 'Owner' ? ROUTES.OWNER_DASHBOARD : ROUTES.TENANT_DASHBOARD}
                className="hover:text-blue-200 transition"
              >
                Dashboard
              </Link>
              <Link to={ROUTES.CHAT} className="hover:text-blue-200 transition">
                Messages
              </Link>
              {user.role === 'Tenant' && (
                <Link to={ROUTES.TENANT_SEARCH} className="hover:text-blue-200 transition">
                  Search Rooms
                </Link>
              )}
              <span className="text-blue-200">
                Welcome, {user.full_name ? user.full_name : 'User'}
              </span>
              <button
                onClick={onLogout}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.REGISTER} className="hover:text-blue-200 transition">
                Register
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
