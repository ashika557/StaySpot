import React from 'react';
import { Settings, Shield, Bell, Database, Globe, Save } from 'lucide-react';

export default function AdminSettings({ user }) {
    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-4">
                        <div className="p-3 bg-gray-900 rounded-2xl shadow-lg shadow-gray-200">
                            <Settings className="w-8 h-8 text-white" />
                        </div>
                        System Preferences
                    </h1>
                    <p className="text-gray-500 font-medium ml-1">Configure platform-wide rules, security settings, and notifications.</p>
                </div>
                <button className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] hover:bg-blue-700 transition-all shadow-xl font-bold uppercase tracking-widest text-xs">
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* General Settings */}
                <div className="xl:col-span-2 space-y-8">
                    <section className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 p-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Platform Configuration</h2>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Core public settings</p>
                            </div>
                        </div>

                        <div className="space-y-8 text-left">
                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Platform Name</label>
                                <input
                                    type="text"
                                    defaultValue="StaySpot"
                                    className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-bold text-gray-900"
                                />
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Support Email Address</label>
                                <input
                                    type="email"
                                    defaultValue="support@stayspot.com"
                                    className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-bold text-gray-900"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 p-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Security & Governance</h2>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Access control & policies</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <ToggleItem label="Mandatory Identity Verification" description="Require tenants to verify ID before booking" enabled={true} />
                            <ToggleItem label="Auto-moderate Listings" description="Use AI to flag suspicious property photos" enabled={false} />
                            <ToggleItem label="Two-Factor Authentication" description="Enforce 2FA for all administrative accounts" enabled={true} />
                        </div>
                    </section>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] p-10 text-white shadow-2xl">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                            <Database className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">System Status</h3>
                        <p className="text-gray-400 font-medium text-sm leading-relaxed mb-8">
                            Platform is currently running on <span className="text-white font-bold">Node v18.16.0</span>. Database latency is within optimal range.
                        </p>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest bg-white/5 p-4 rounded-2xl">
                                <span className="text-gray-500">API Uptime</span>
                                <span className="text-emerald-400">99.98%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest bg-white/5 p-4 rounded-2xl">
                                <span className="text-gray-500">Storage Used</span>
                                <span className="text-blue-400">42.8 GB</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 p-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                                <Bell className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">System Alerts</h3>
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs text-gray-500 font-medium">No critical alerts detected. Monitoring active.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ label, description, enabled }) {
    return (
        <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-transparent hover:border-gray-100 transition-all text-left">
            <div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1">{label}</p>
                <p className="text-xs text-gray-500 font-medium">{description}</p>
            </div>
            <button className={`w-14 h-8 rounded-full transition-all relative ${enabled ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${enabled ? 'left-7 shadow-sm' : 'left-1'}`}></div>
            </button>
        </div>
    );
}
