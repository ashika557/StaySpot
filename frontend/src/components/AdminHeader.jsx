import React from 'react';
import { Search, Bell, User, ChevronDown } from 'lucide-react';
import { getMediaUrl } from '../constants/api';

export default function AdminHeader({ user }) {
    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search users, rooms, or complaints..."
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                </button>

                <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>

                <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                            {user?.full_name || 'Administrator'}
                        </p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider leading-none">
                            {user?.role || 'Admin'}
                        </p>
                    </div>
                    <div className="relative">
                        <img
                            src={user?.profile_photo ? getMediaUrl(user.profile_photo) : `https://ui-avatars.com/api/?name=${user?.full_name || 'Admin'}&background=3b82f6&color=fff&bold=true`}
                            alt="Profile"
                            className="w-10 h-10 rounded-xl border-2 border-white shadow-sm object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </div>
            </div>
        </header>
    );
}
