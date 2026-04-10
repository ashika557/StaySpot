import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, CheckCircle, Home as HomeIcon,  
    Trash2, Camera, UserPlus, Shield,
    Info, Loader2, AlertTriangle,
    Building, MoreHorizontal
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, getMediaUrl } from '../constants/api';
import { adminService } from '../services/adminService';

export default function AdminComplaintDetail({ user: loggedInUser }) {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchComplaint();
    }, [id, fetchComplaint]);

    const fetchComplaint = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminService.getComplaintDetail(id);
            setComplaint(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const handleUpdateStatus = async (status) => {
        try {
            setStatusUpdating(true);
            await adminService.updateComplaintStatus(id, status);
            fetchComplaint();
        } catch (err) {
            alert(err.message);
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this complaint record permanently?')) return;
        try {
            setActionLoading(true);
            await apiRequest(`${API_ENDPOINTS.ADMIN_COMPLAINTS}${id}/`, { method: 'DELETE' });
            navigate('/admin/complaints');
        } catch (err) {
            alert('Deletion failed');
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accessing Incident Records...</p>
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="p-10 text-center bg-white rounded-[3rem] border border-red-100 shadow-sm max-w-2xl mx-auto mt-20">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">Record Not Found</h2>
                <p className="text-gray-500 mb-8 font-medium">The complaint record ID: #{id} could not be retrieved from the central database.</p>
                <button onClick={() => navigate('/admin/complaints')} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all">
                    Return to Inbox
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto text-left pb-20">
            
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <button 
                    onClick={() => navigate('/admin/complaints')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold transition-all w-fit group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm uppercase tracking-widest">Back to Incident List</span>
                </button>

                <div className="flex items-center gap-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Logged: {new Date(complaint.created_at).toLocaleString(undefined, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <button 
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all border border-rose-100"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Core Complaint Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden mb-8">
                <div className="p-8 md:p-10 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-4 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                                Case #{complaint.id}
                            </span>
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                complaint.priority === 'High' ? 'bg-rose-500 text-white border-rose-600' :
                                complaint.priority === 'Medium' ? 'bg-amber-500 text-white border-amber-600' :
                                'bg-emerald-500 text-white border-emerald-600'
                            }`}>
                                {complaint.priority || 'Medium'} Priority
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{complaint.complaint_type}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <StatusIndicator status={complaint.status} />
                    </div>
                </div>

                <div className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Building className="w-4 h-4" /> Affected Asset
                            </h3>
                            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4 group cursor-pointer hover:bg-blue-50 transition-all" onClick={() => navigate(`/admin/rooms/${complaint.room?.id}`)}>
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-blue-600">
                                    <HomeIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-gray-900 text-sm tracking-tight truncate">{complaint.room?.title}</p>
                                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">Asset Intelligence ↗</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Responsible Partner
                            </h3>
                            <div className="p-6 bg-purple-50/50 rounded-3xl border border-purple-100 flex items-center gap-4 group cursor-pointer hover:bg-purple-50 transition-all" onClick={() => navigate(`/admin/users/${complaint.owner?.id}`)}>
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-purple-600 font-black">
                                    {complaint.owner?.full_name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-gray-900 text-sm tracking-tight truncate">{complaint.owner?.full_name}</p>
                                    <p className="text-[10px] text-purple-500 font-black uppercase tracking-widest mt-0.5">Partner Profile ↗</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Info className="w-4 h-4" /> Reported Description
                        </h3>
                        <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 text-gray-700 leading-relaxed font-medium shadow-inner">
                            {complaint.description}
                        </div>
                    </div>
                </div>
            </div>

            {/* Media & Reporter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Evidence Card */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Camera className="w-4 h-4" /> Visual Evidence
                        </h3>
                    </div>
                    <div className="p-8 flex-1 flex items-center justify-center min-h-[300px]">
                        {complaint.image ? (
                            <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50/50 p-3 group relative cursor-zoom-in" onClick={() => window.open(getMediaUrl(complaint.image), '_blank')}>
                                <img src={getMediaUrl(complaint.image)} alt="Evidence" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="px-4 py-2 bg-white rounded-xl shadow-lg text-[10px] font-black uppercase tracking-widest text-blue-600 transform scale-90 group-hover:scale-100 transition-transform">
                                        Zoom Evidence
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
                                    <Camera className="w-8 h-8" />
                                </div>
                                <p className="text-xs font-black text-gray-400 uppercase">No Media Captured</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reporter Card */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="p-6 border-b border-gray-50">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Reporter Intelligence
                        </h3>
                    </div>
                    <div className="p-10 text-center">
                        <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 text-indigo-600 mx-auto mb-6 flex items-center justify-center text-2xl font-black border-4 border-white shadow-xl overflow-hidden cursor-pointer group" onClick={() => navigate(`/admin/users/${complaint.tenant?.id}`)}>
                            {complaint.tenant?.profile_image ? (
                                <img src={getMediaUrl(complaint.tenant.profile_image)} alt="Tenant" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                complaint.tenant?.full_name?.charAt(0) || 'U'
                            )}
                        </div>
                        <h4 className="text-xl font-black text-gray-900 tracking-tight mb-2">{complaint.tenant?.full_name}</h4>
                        <p className="text-gray-500 font-medium text-sm mb-8 truncate uppercase">{complaint.tenant?.email}</p>
                        
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center gap-10">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-xs font-black text-emerald-500">Active Tenant</p>
                            </div>
                            <div className="w-px h-6 bg-gray-200" />
                            <div className="text-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Role</p>
                                <p className="text-xs font-black text-gray-900">{complaint.tenant?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resolution Panel */}
            <div className="bg-gray-900 rounded-[2.5rem] p-10 border border-gray-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-blue-600/20 transition-all duration-1000" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Resolution Management</h2>
                        <p className="text-gray-400 text-sm font-medium">Update the investigation status of this incident record.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative">
                            <select 
                                className="pl-6 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus:bg-white/10 focus:ring-4 focus:ring-blue-600/20 outline-none cursor-pointer appearance-none min-w-[220px]"
                                value={complaint.status}
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                disabled={statusUpdating}
                            >
                                <option value="Pending" className="bg-gray-900">🕒 Pending Audit</option>
                                <option value="Investigating" className="bg-gray-900">🔍 Investigating</option>
                                <option value="Resolved" className="bg-gray-900">✅ Case Resolved</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                {statusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
                            </div>
                        </div>

                        {complaint.status !== 'Resolved' && (
                            <button 
                                onClick={() => handleUpdateStatus('Resolved')}
                                disabled={statusUpdating}
                                className="px-8 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-900/20"
                            >
                                {statusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Instant Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusIndicator({ status }) {
    const configs = {
        'Pending': 'bg-amber-500 text-white shadow-amber-200',
        'Investigating': 'bg-blue-500 text-white shadow-blue-200',
        'Resolved': 'bg-emerald-500 text-white shadow-emerald-200',
    };
    
    return (
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${status === 'Pending' ? 'bg-amber-400' : status === 'Investigating' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border-2 border-white ${configs[status] || configs.Pending}`}>
                {status || 'Pending'}
            </span>
        </div>
    );
}
