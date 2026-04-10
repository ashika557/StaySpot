import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, User, Mail, Phone, Calendar, 
    MapPin, BadgeCheck, Shield, Trash2, Edit, 
    Key, Info, Loader2, AlertTriangle, CheckCircle, 
    XCircle, Clock, FileText, ExternalLink
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, getMediaUrl } from '../constants/api';
import { adminService } from '../services/adminService';

export default function AdminUserDetail({ user: loggedInUser }) {
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

    const handleToggleActive = async () => {
        try {
            setActionLoading(true);
            await adminService.updateUser(id, { is_active: !user.is_active });
            fetchUser();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this account permanently? This cannot be undone.')) return;
        try {
            setActionLoading(true);
            // Assuming DELETE endpoint exists or using update to disable
            await apiRequest(`${API_ENDPOINTS.ADMIN_USERS}${id}/`, { method: 'DELETE' });
            navigate('/admin/users');
        } catch (err) {
            alert('Failed to delete user');
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accessing User Intelligence...</p>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="p-10 text-center bg-white rounded-[3rem] border border-red-100 shadow-sm max-w-2xl mx-auto mt-20">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">Subject Not Found</h2>
                <p className="text-gray-500 mb-8 font-medium">The user profile you are looking for does not exist in our active registry.</p>
                <button onClick={() => navigate('/admin/users')} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all">
                    Return to Directory
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto text-left pb-20">
            
            {/* Top Navigation & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <button 
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold transition-all w-fit group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm uppercase tracking-widest">Back to Directory</span>
                </button>

                <div className="flex items-center gap-3">
                    {user.verification_status === 'Pending' && user.identity_document && (
                        <button 
                            onClick={() => navigate(`/admin/users/${id}/kyc`)}
                            className="px-6 py-3 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            <Shield className="w-4 h-4" />
                            Audit KYC
                        </button>
                    )}
                    
                    {user.id !== loggedInUser.id && (
                        <button 
                            onClick={handleToggleActive}
                            disabled={actionLoading}
                            className={`px-6 py-3 font-black rounded-2xl transition-all flex items-center gap-2 text-xs uppercase tracking-widest border shadow-sm ${
                                user.is_active 
                                ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                            }`}
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                            {user.is_active ? 'Suspend Account' : 'Activate Account'}
                        </button>
                    )}

                    <button 
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="px-4 py-3 bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                        title="Permanent Deletion"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                
                {/* Hero Profile Card */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden">
                    <div className="p-10 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-white flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center border-4 border-white overflow-hidden shrink-0 relative z-10">
                                {user.profile_photo ? (
                                    <img src={getMediaUrl(user.profile_photo)} alt={user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-blue-600 uppercase">
                                        {user.full_name?.charAt(0) || user.username?.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl border-4 border-white flex items-center justify-center z-20 shadow-lg ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                {user.is_active ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user.full_name || user.username}</h1>
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    user.role === 'Owner' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                                    user.role === 'Tenant' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                    'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-gray-500 font-medium text-lg mb-6">{user.email}</p>
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-50">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-600">Joined {new Date(user.date_joined).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                                </div>
                                {user.is_identity_verified ? (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Verified Identity</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                        <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Awaiting Verification</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="p-10 border-t md:border-t-0 md:border-r border-gray-50">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Personal Information
                            </h3>
                            <div className="space-y-6">
                                <InfoRow label="Mobile Access" value={user.phone || 'Unavailable'} />
                                <InfoRow label="Birth Registry" value={user.date_of_birth || 'Not Specified'} />
                                <InfoRow label="City Hub" value={user.city || 'Kathmandu'} />
                                <InfoRow label="Address" value={user.address || 'Not Provided'} />
                            </div>
                        </div>
                        <div className="p-10 border-t border-gray-50">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Key className="w-4 h-4" /> Technical Profile
                            </h3>
                            <div className="space-y-6">
                                <InfoRow label="Internal ID" value={`#${user.id}`} />
                                <InfoRow label="Username" value={user.username} />
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hashed Password</p>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-mono text-[10px] text-blue-600 break-all leading-relaxed shadow-inner">
                                        {user.password}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Identity Document Column */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Audit Document
                        </h3>
                        {user.identity_document && (
                            <a 
                                href={getMediaUrl(user.identity_document)} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                            >
                                External <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                    <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                        {user.identity_document ? (
                            <div className="w-full h-full min-h-[300px] rounded-3xl overflow-hidden border-2 border-dashed border-blue-100 bg-blue-50/30 flex items-center justify-center p-4">
                                <img 
                                    src={getMediaUrl(user.identity_document)} 
                                    alt="Identity" 
                                    className="w-full h-full object-contain hover:scale-105 transition-transform cursor-zoom-in" 
                                    onClick={() => window.open(getMediaUrl(user.identity_document), '_blank')}
                                />
                            </div>
                        ) : (
                            <div className="py-20 flex flex-col items-center gap-6">
                                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center shadow-inner">
                                    <FileText className="w-10 h-10 text-gray-200" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 uppercase">Registry Missing</p>
                                    <p className="text-xs text-gray-400 font-medium mt-1">No identity document uploaded</p>
                                </div>
                            </div>
                        )}
                        
                        {!user.is_identity_verified && user.verification_status === 'Pending' && user.identity_document && (
                            <button 
                                onClick={() => navigate(`/admin/users/${id}/kyc`)}
                                className="mt-8 w-full py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                            >
                                Launch Compliance Audit <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between group">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{label}</span>
            <span className="text-sm font-bold text-gray-900">{value}</span>
        </div>
    );
}

function ArrowRight(props) {
    return (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
    );
}
