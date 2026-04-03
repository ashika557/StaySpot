import React from 'react';
import { LayoutDashboard, Search, Calendar, AlertTriangle, MessageSquare, DollarSign, User, Eye, Home, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getMediaUrl, ROUTES } from '../constants/api';

export default function TenantSidebar({ user }) {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { path: '/tenant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/tenant/search', icon: Search, label: 'Search Rooms' },
        { path: '/tenant/visits', icon: Eye, label: 'My Visits' },
        { path: '/tenant/bookings', icon: Calendar, label: 'Bookings' },
        { path: '/tenant/complaints', icon: AlertTriangle, label: 'Complaints' },
        { path: '/chat', icon: MessageSquare, label: 'Messages' },
        { path: '/tenant/payments', icon: DollarSign, label: 'Payments' },
        { path: '/profile', icon: User, label: 'My Profile' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate(ROUTES.LOGIN);
        window.location.reload();
    };

    return (
        <div className="w-72 bg-white border-r border-slate-100 h-screen sticky top-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Home className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-black font-outfit tracking-tighter text-slate-900 leading-none">StaySpot</div>
                </div>
                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-2 ml-1">Tenant Portal</p>
            </div>

            <nav className="px-4 flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm ${active
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100/50 -translate-y-0.5'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                            <span className="font-bold">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-slate-50 bg-slate-50/30">
                {user && (
                    <div className="flex items-center gap-4 px-2 mb-6">
                        <div className="relative">
                            <img
                                src={user.profile_photo ? getMediaUrl(user.profile_photo) : `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=4f46e5&color=fff&bold=true`}
                                alt="Profile"
                                className="w-11 h-11 rounded-2xl border-2 border-white shadow-md object-cover"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate font-outfit">
                                {user.full_name || 'User'}
                            </p>
                            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                                {user.role}
                            </p>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm group"
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
