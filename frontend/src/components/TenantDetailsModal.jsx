import React from 'react';
import { X, Phone, Mail, Shield, ShieldAlert, CheckCircle } from 'lucide-react';
import { getMediaUrl } from '../constants/api';

export default function TenantDetailsModal({ isOpen, onClose, tenant }) {
    if (!isOpen || !tenant) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Cover-like background */}
                <div className="relative h-24 bg-gradient-to-r from-blue-600 to-blue-400">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-8 -mt-12 text-center">
                    <div className="relative inline-block">
                        <img
                            src={tenant.profile_photo
                                ? getMediaUrl(tenant.profile_photo)
                                : `https://ui-avatars.com/api/?name=${tenant.full_name}&background=fff&color=3b82f6&bold=true&size=128`
                            }
                            alt={tenant.full_name}
                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                        />
                        {tenant.is_identity_verified && (
                            <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white" title="Identity Verified">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mt-3">{tenant.full_name}</h2>
                    <p className="text-sm text-gray-500 font-medium">Tenant</p>

                    <div className="mt-6 space-y-3 text-left">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Email Address</p>
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">{tenant.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone Number</p>
                                <p className="text-sm font-medium text-gray-900">{tenant.phone || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${tenant.is_identity_verified
                                ? 'bg-green-50 border-green-200'
                                : 'bg-orange-50 border-orange-200'
                            }`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tenant.is_identity_verified ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                {tenant.is_identity_verified ? <Shield className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className={`text-xs uppercase tracking-wide ${tenant.is_identity_verified ? 'text-green-600' : 'text-orange-600'
                                    }`}>Identity Status</p>
                                <p className={`text-sm font-bold ${tenant.is_identity_verified ? 'text-green-700' : 'text-orange-700'
                                    }`}>
                                    {tenant.is_identity_verified ? 'Verified' : 'Not Verified'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-colors"
                        >
                            Close Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
