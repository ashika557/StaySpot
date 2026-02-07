import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';

const OwnerHeader = ({ user, title, subtitle, showIdentityWarning = false, onLogout }) => {
    return (
        <div className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-40">
            <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>

            {showIdentityWarning && (!user?.is_identity_verified && user?.role !== 'Admin') && (
                <div className={`flex-1 max-w-md mx-6 border-l-4 p-3 flex items-center gap-3 ${user?.identity_document ? 'bg-green-50 border-green-500' : 'bg-yellow-100 border-yellow-500'}`}>
                    <Bell className={`w-5 h-5 ${user?.identity_document ? 'text-green-600' : 'text-yellow-600'}`} />
                    <p className={`text-xs font-medium ${user?.identity_document ? 'text-green-700' : 'text-yellow-700'}`}>
                        {user?.identity_document
                            ? 'Identity document uploaded. You can now list rooms! Admin verification is pending.'
                            : 'Identity document missing. Please upload your Citizenship/ID in the Profile to start listing rooms.'}
                    </p>
                </div>
            )}

            <div className="flex items-center gap-6">
                <NotificationBell user={user} isDark={true} />
                <div className="flex items-center gap-3 border-l pl-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-800">{user?.full_name}</p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{user?.role}</p>
                    </div>
                    <img
                        src={`https://ui-avatars.com/api/?name=${user?.full_name || 'User'}&background=3b82f6&color=fff`}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    />
                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OwnerHeader;
