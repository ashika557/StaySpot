import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES, getMediaUrl } from "../constants/api";
import NotificationBell from "./NotificationBell";
import { Home, LogOut, User, Menu } from "lucide-react";

function Navigation({ user, onLogout, showLanding }) {
  const location = useLocation();

  if (showLanding || !user) return null;

  const isOwner = user.role?.toLowerCase() === "owner";
  const isTenant = user.role?.toLowerCase() === "tenant";
  const isAdmin = user.role?.toLowerCase() === "admin";

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-3 group premium-hover"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-all">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black font-outfit tracking-tighter text-slate-900">
              StaySpot
            </span>
          </Link>

          {/* Main Navigation (Desktop) */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
            <Link
              to={
                isAdmin
                  ? ROUTES.ADMIN_DASHBOARD
                  : isOwner
                    ? ROUTES.OWNER_DASHBOARD
                    : ROUTES.TENANT_DASHBOARD
              }
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                isActive(
                  isAdmin
                    ? ROUTES.ADMIN_DASHBOARD
                    : isOwner
                      ? ROUTES.OWNER_DASHBOARD
                      : ROUTES.TENANT_DASHBOARD,
                )
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-indigo-600"
              }`}
            >
              Dashboard
            </Link>

            {!isAdmin && (
              <Link
                to={ROUTES.CHAT}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive(ROUTES.CHAT)
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                Messages
              </Link>
            )}

            {isTenant && (
              <Link
                to={ROUTES.TENANT_SEARCH}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive(ROUTES.TENANT_SEARCH)
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                Find Rooms
              </Link>
            )}

            {!isAdmin && (
              <Link
                to={ROUTES.PROFILE}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive(ROUTES.PROFILE)
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                My Profile
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-5">
            <NotificationBell user={user} />

            <div className="hidden sm:flex items-center gap-4 pl-5 border-l border-slate-200">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Logged in as
                </p>
                <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">
                  {user.full_name || user.username || "User"}
                </p>
              </div>

              {!isAdmin ? (
                <Link to={ROUTES.PROFILE} className="relative group">
                  <img
                    src={
                      user.profile_photo
                        ? getMediaUrl(user.profile_photo)
                        : `https://ui-avatars.com/api/?name=${user.full_name || "User"}&background=4f46e5&color=fff&bold=true&size=128`
                    }
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-lg group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full"></div>
                </Link>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}

              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all group"
                title="Logout"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <button className="lg:hidden p-2 text-slate-600">
              <Menu />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
