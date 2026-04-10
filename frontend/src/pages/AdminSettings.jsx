import React, { useState } from 'react';
import { 
    User, Mail, Edit, 
    Save, Lock, Trash2, Camera, Shield,
    Bell, CheckCircle, XCircle
} from 'lucide-react';
import { getMediaUrl } from '../constants/api';

export default function AdminSettings({ user }) {
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-4xl mx-auto text-left pb-20">
            {/* Page Title */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
                <p className="text-gray-500 text-sm">Manage your account settings</p>
            </div>

            <div className="space-y-8">
                
                {/* 1. Hero Profile Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group shrink-0">
                            <div className="w-32 h-32 rounded-3xl bg-gray-50 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                                {user?.profile_photo ? (
                                    <img 
                                        src={getMediaUrl(user.profile_photo)} 
                                        alt={user.full_name} 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <span className="text-4xl font-bold text-blue-600">
                                        {user?.full_name?.charAt(0) || 'A'}
                                    </span>
                                )}
                            </div>
                            <button className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                                    {user?.full_name || 'Admin User'}
                                </h2>
                                <span className="px-3 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100">
                                    {user?.role || 'Admin'}
                                </span>
                            </div>
                            
                            <div className="mt-6 max-w-sm mx-auto md:mx-0">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center md:justify-start">
                                        <Mail className="w-3 h-3" /> Email Address
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {user?.email || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 md:self-start">
                            <button className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm">
                                <Edit className="w-4 h-4" /> Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Edit Basic Information */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-8 border-b border-gray-50 pb-4">
                        Edit Basic Information
                    </h3>

                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input 
                                    type="text" 
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all font-medium text-sm text-gray-900 shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input 
                                    type="email" 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all font-medium text-sm text-gray-900 shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex items-center justify-between border-t border-gray-50">
                            <button className="px-8 py-3 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-md flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                            <button type="button" className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>

                {/* 3. Security Settings */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-8 border-b border-gray-50 pb-4 flex items-center gap-3">
                        Security Settings
                    </h3>
                    
                    <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100 group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-blue-600">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">Change Password</p>
                                <p className="text-[11px] text-gray-400">Update your account password</p>
                            </div>
                        </div>
                        <button className="px-6 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg hover:shadow-lg transition-all">
                            Change
                        </button>
                    </div>
                </div>

                {/* 4. Delete Account */}
                <div className="bg-rose-50/30 rounded-3xl border border-rose-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-rose-600 mb-2">Delete your Account</h3>
                    <p className="text-xs text-gray-500 mb-8 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
                    
                    <button className="px-8 py-3 bg-rose-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-md flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Delete Account
                    </button>
                </div>

            </div>
        </div>
    );
}