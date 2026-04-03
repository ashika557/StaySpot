import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Twitter, Facebook, Linkedin } from 'lucide-react';
import { ROUTES } from '../constants/api';

const Footer = () => {
    return (
        <footer className="bg-[#0f172a] text-white pt-20 pb-10 mt-auto">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">STAYSPOT</span>
                        </div>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Simplifying room renting across Nepal with trust and security.
                        </p>
                    </div>
                    
                    {/* For Tenants */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white uppercase tracking-wider">For Renters</h4>
                        <div className="flex flex-col gap-4 text-slate-400">
                            <Link to={ROUTES.TENANT_SEARCH} className="hover:text-blue-400 transition-colors">Search Rooms</Link>
                            <Link to={ROUTES.TENANT_DASHBOARD} className="hover:text-blue-400 transition-colors">My Dashboard</Link>
                            <Link to={ROUTES.TENANT_BOOKINGS} className="hover:text-blue-400 transition-colors">My Bookings</Link>
                        </div>
                    </div>

                    {/* For Owners */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white uppercase tracking-wider">For Room Owners</h4>
                        <div className="flex flex-col gap-4 text-slate-400">
                            <Link to={ROUTES.OWNER_DASHBOARD} className="hover:text-blue-400 transition-colors">My Dashboard</Link>
                            <Link to={ROUTES.OWNER_ROOMS} className="hover:text-blue-400 transition-colors">My Rooms</Link>
                            <Link to={ROUTES.OWNER_PAYMENTS} className="hover:text-blue-400 transition-colors">My Income</Link>
                        </div>
                    </div>

                    {/* Support & Contacts */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white uppercase tracking-wider">Support</h4>
                        <div className="flex flex-col gap-4 text-slate-400">
                            <p className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer">hello@stayspot.com</p>
                            <p className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer">+977 9800000000</p>
                            <p>Kathmandu, Nepal</p>
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-slate-800/50 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
                    <p>© {new Date().getFullYear()} STAYSPOT. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
