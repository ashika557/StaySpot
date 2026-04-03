import React from 'react';
import { Settings, Shield, Bell, Database, Globe, Save, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AdminSettings({ user }) {
    return (
        <div className="animate-in fade-in duration-700 text-slate-900 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                <div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Platform Management</p>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight font-outfit uppercase flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                            <Settings className="w-8 h-8 text-white" />
                        </div>
                        Settings
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                   <button className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-400 border border-slate-100 rounded-2xl hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm font-bold uppercase tracking-widest text-xs active:scale-95">
                        Reset Defaults
                    </button>
                    <button className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-bold uppercase tracking-widest text-xs active:scale-95">
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Main Settings Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                
                {/* Left Side Settings */}
                <div className="xl:col-span-2 space-y-10">
                    
                    {/* Platform Configuration */}
                    <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden group">
                        <div className="bg-indigo-600 p-8 text-white relative flex items-center justify-between">
                            <div className="absolute inset-0 bg-indigo-950/20"></div>
                            <div className="relative z-10 text-left">
                                <h3 className="text-2xl font-black font-outfit uppercase tracking-tight">General Controls</h3>
                                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-1">Platform-wide Operational settings</p>
                            </div>
                            <div className="relative z-10 w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                                <Globe className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="p-10 space-y-10 text-left bg-white">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">
                                    Platform Identity
                                </label>
                                <input
                                    type="text"
                                    defaultValue="StaySpot"
                                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 shadow-inner"
                                />
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">
                                    Communication Endpoint
                                </label>
                                <input
                                    type="email"
                                    defaultValue="support@stayspot.com"
                                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 shadow-inner"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Security Settings */}
                    <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden group">
                        <div className="bg-indigo-600 p-8 text-white relative flex items-center justify-between">
                            <div className="absolute inset-0 bg-indigo-950/20"></div>
                            <div className="relative z-10 text-left">
                                <h3 className="text-2xl font-black font-outfit uppercase tracking-tight text-white leading-none mb-1">Security Policies</h3>
                                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Access and authentication rules</p>
                            </div>
                            <div className="relative z-10 w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="p-10 space-y-4 bg-white">
                            <ToggleItem
                                label="Identity Mandatory"
                                description="Require users to verify ID before any listing activity"
                                enabled={true}
                            />
                            <ToggleItem
                                label="Listing Shield"
                                description="Automatically moderate and flag suspicious room entries"
                                enabled={false}
                            />
                            <ToggleItem
                                label="Alert Propagation"
                                description="Broadcast security alerts to all administrative nodes"
                                enabled={true}
                            />
                        </div>
                    </section>

                    <div className="flex justify-end pt-4">
                        <button className="px-12 py-5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100/50 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 group">
                            Sync All Configurations <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Right Side Information Panels */}
                <div className="space-y-10">
                    
                    {/* System Status Card */}
                    <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/10">
                            <Database className="w-8 h-8 text-indigo-100" />
                        </div>

                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tight font-outfit leading-none">
                            System Status
                        </h3>

                        <p className="text-indigo-100 font-medium text-sm leading-relaxed mb-10 opacity-80">
                            All platform nodes are operational across geographical clusters.
                        </p>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest bg-white/5 p-5 rounded-2xl border border-white/5">
                                <span className="text-indigo-200">System Uptime</span>
                                <span className="text-emerald-400">99.9% Reliable</span>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest bg-white/5 p-5 rounded-2xl border border-white/5">
                                <span className="text-indigo-200">Storage Load</span>
                                <span className="text-white">42% Capacity</span>
                            </div>
                        </div>
                    </div>

                    {/* Alerts Panel */}
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100">
                                <Bell className="w-5 h-5 shadow-sm" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-outfit leading-none">
                                    Broadcasts
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global System Logs</p>
                            </div>
                        </div>

                        <div className="p-10 space-y-4">
                            <div className="flex flex-col items-center py-6 gap-4 opacity-30 text-slate-300">
                                <ShieldCheck className="w-12 h-12" />
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center">No active alerts detected</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ label, description, enabled }) {
    return (
        <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-100 transition-all text-left group">
            <div className="flex-1 pr-6">
                <p className="text-base font-black text-slate-900 uppercase tracking-tight mb-1 font-outfit leading-none">
                    {label}
                </p>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {description}
                </p>
            </div>

            <button
                className={`w-14 h-8 rounded-full transition-all relative ${
                    enabled ? 'bg-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-200'
                }`}
            >
                <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                        enabled ? 'left-7 shadow-sm' : 'left-1'
                    }`}
                ></div>
            </button>
        </div>
    );
}