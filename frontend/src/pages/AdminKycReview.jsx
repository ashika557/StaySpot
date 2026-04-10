import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Shield, BadgeCheck, XCircle, 
    Trash2, Edit, Loader2, AlertTriangle, 
    FileText, User, Mail, CheckCircle, Clock
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, getMediaUrl } from '../constants/api';
import { adminService } from '../services/adminService';

export default function AdminKycReview({ user: loggedInUser }) {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUserDetail(id);
            setUser(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKycAction = async (action) => {
        try {
            setActionLoading(true);
            await adminService.verifyKYC(id, action);
            fetchUser();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-gray-500 text-sm">Loading KYC details...</p>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="p-10 text-center bg-white rounded-xl border border-gray-100 shadow-sm max-w-2xl mx-auto mt-20">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">User Data Missing</h2>
                <p className="text-gray-500 mb-8">Verification cannot proceed without user data.</p>
                <button onClick={() => navigate('/admin/users')} className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto text-left pb-20">
            
            {/* Back Button */}
            <div className="mb-6">
                <button 
                    onClick={() => navigate(`/admin/users/${id}`)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold transition-all w-fit group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Back</span>
                </button>
            </div>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                <div className="p-6 bg-amber-500 flex items-center gap-5">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white uppercase tracking-wider">KYC Verification</h1>
                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-0.5">Review identification documents</p>
                    </div>
                </div>

                {/* User Summary */}
                <div className="p-6 bg-gray-50/30 border-b border-gray-50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-700 shadow-sm">
                        {user.full_name?.charAt(0) || user.username?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{user.full_name || user.username}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{user.email}</p>
                    </div>
                    <div>
                        <StatusBadge status={user.verification_status} verified={user.is_identity_verified} />
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col gap-8">
                    
                    {/* Document View */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                            <span>Identification Document</span>
                            {user.identity_document && (
                                <a 
                                    href={getMediaUrl(user.identity_document)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    Open File ↗
                                </a>
                            )}
                        </div>
                        
                        {user.identity_document ? (
                            <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 p-2 aspect-video flex items-center justify-center shadow-inner relative group cursor-zoom-in" onClick={() => window.open(getMediaUrl(user.identity_document), '_blank')}>
                                <img 
                                    src={getMediaUrl(user.identity_document)} 
                                    alt="KYC Document" 
                                    className="w-full h-full object-contain" 
                                />
                            </div>
                        ) : (
                            <div className="rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 p-16 flex flex-col items-center justify-center text-center text-gray-400">
                                <FileText className="w-10 h-10 mb-4" />
                                <p className="text-xs font-bold uppercase tracking-wider">No document uploaded</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4">
                        {user.verification_status === 'Pending' && user.identity_document ? (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-900 mb-1">Final Verdict</p>
                                    <p className="text-xs text-gray-500">Approve or reject this identification after reviewing the image above.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handleKycAction('Approve')}
                                        disabled={actionLoading}
                                        className="flex-1 py-4 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleKycAction('Reject')}
                                        disabled={actionLoading}
                                        className="flex-1 py-4 bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={`p-6 rounded-2xl flex flex-col items-center text-center gap-4 ${
                                user.is_identity_verified ? 'bg-emerald-50 border border-emerald-100' : 
                                user.verification_status === 'Rejected' ? 'bg-rose-50 border border-rose-100' :
                                'bg-gray-50 border border-gray-100'
                            }`}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-white ${
                                    user.is_identity_verified ? 'text-emerald-600' : 
                                    user.verification_status === 'Rejected' ? 'text-rose-600' : 'text-gray-400'
                                }`}>
                                    {user.is_identity_verified ? <BadgeCheck className="w-6 h-6" /> : user.verification_status === 'Rejected' ? <XCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-900">
                                        {user.is_identity_verified ? 'Identity Verified' : user.verification_status === 'Rejected' ? 'Identity Rejected' : 'Pending Verification'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {user.is_identity_verified ? 'Verified on ' + new Date().toLocaleDateString() : user.verification_status === 'Rejected' ? 'User must re-submit documentary.' : 'Awaiting document submission.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status, verified }) {
    if (verified) return (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-widest rounded-full border border-emerald-100 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3" /> Verified
        </span>
    );
    
    const configs = {
        'Pending': 'bg-amber-50 text-amber-700 border-amber-100',
        'Rejected': 'bg-rose-50 text-rose-700 border-rose-100',
    };
    
    return (
        <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border flex items-center gap-1.5 ${configs[status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
            <Clock className="w-3 h-3" /> {status || 'Unknown'}
        </span>
    );
}
