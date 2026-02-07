import React from 'react';
import { Home } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Home className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold">STAYSPOT</span>
                    </div>

                    <p className="text-xs text-gray-400">
                        © 2026 StaySpot. All rights reserved.
                    </p>

                    <div className="flex gap-4 text-xs text-gray-400">
                        <span>Dharan / Itahari, Nepal</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
