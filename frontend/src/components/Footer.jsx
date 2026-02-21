import React from 'react';
import { Home, Twitter, Facebook, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/api';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                <Home className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">STAYSPOT</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">Modern room renting, digital booking, and secure for everyone.</p>
                        <div className="flex gap-3">
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
                        <div className="space-y-2 text-sm text-gray-400">
                            <Link to={ROUTES.HOME} className="block hover:text-blue-400 transition-colors">Home</Link>
                            <Link to="#" className="block hover:text-blue-400 transition-colors">About</Link>
                            <Link to="#" className="block hover:text-blue-400 transition-colors">Features</Link>
                            <Link to="#" className="block hover:text-blue-400 transition-colors">Contact</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-white">Support</h4>
                        <div className="space-y-2 text-sm text-gray-400">
                            <Link to="#" className="block hover:text-blue-400 transition-colors">About Us</Link>
                            <Link to="#" className="block hover:text-blue-400 transition-colors">Privacy Policy</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-white">Contact Info</h4>
                        <div className="space-y-2 text-sm text-gray-400">
                            <p>hello@stayspot.com</p>
                            <p>+977 9800000000</p>
                            <p>Kathmandu, Nepal</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                    © {new Date().getFullYear()} STAYSPOT. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
