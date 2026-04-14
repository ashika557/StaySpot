import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Home,
  AlertCircle,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "../constants/api";

export default function AdminSidebar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin/dashboard",
    },
    { id: "users", icon: Users, label: "Manage Users", path: "/admin/users" },
    { id: "rooms", icon: Home, label: "Manage Rooms", path: "/admin/rooms" },
    {
      id: "complaints",
      icon: AlertCircle,
      label: "Complaints",
      path: "/admin/complaints",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate(ROUTES.LOGIN);
    window.location.reload();
  };

  return (
    <div className="w-72 bg-white border-r border-slate-100 h-screen sticky top-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none font-outfit uppercase">
              StaySpot
            </h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] mt-1">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-2 flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === "/admin/dashboard" &&
              location.pathname === "/admin");

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100/50 -translate-y-0.5"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"}`}
                />
                <span className={`text-sm font-bold`}>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-6 mt-auto border-t border-slate-50 bg-slate-50/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm group"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          Sign Out
        </button>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }`}</style>
    </div>
  );
}
