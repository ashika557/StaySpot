import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Home, MapPin, BadgeCheck, Shield, 
    Trash2, Edit, Wifi, Wind, Tv, Navigation,
    User, Mail, Phone, Calendar, Loader2, AlertTriangle,
    Settings
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, getMediaUrl } from '../constants/api';
import { adminService } from '../services/adminService';

export default function AdminRoomDetail({ user }) {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRoom();
    }, [id]);

    const fetchRoom = async () => {
        try {
            setLoading(true);
            const response = await apiRequest(`${API_ENDPOINTS.ROOMS}${id}/`);
            if (response.ok) {
                const data = await response.json();
                setRoom(data);
            } else {
                throw new Error('Failed to load property details');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleModerate = async (action) => {
        try {
            setActionLoading(true);
            await adminService.moderateRoom(id, action);
            fetchRoom();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this property permanently?')) return;
        try {
            setActionLoading(true);
            await apiRequest(`${API_ENDPOINTS.ROOMS}${id}/`, { method: 'DELETE' });
            navigate('/admin/rooms');
        } catch (err) {
            alert('Failed to delete property');
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Retrieving Property Data...</p>
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="p-10 text-center bg-white rounded-[3rem] border border-red-100 shadow-sm max-w-2xl mx-auto mt-20">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">Property Not Found</h2>
                <p className="text-gray-500 mb-8 font-medium">The listing you are looking for might have been removed or the ID is incorrect.</p>
                <button onClick={() => navigate('/admin/rooms')} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all">
                    Return to Inventory
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto text-left pb-20">
            
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <button 
                    onClick={() => navigate('/admin/rooms')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold transition-all w-fit group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm uppercase tracking-widest">Back to Inventory</span>
                </button>

                <div className="flex items-center gap-3">
                    {room.status === 'Pending Verification' && (
                        <button 
                            onClick={() => handleModerate('Approve')}
                            disabled={actionLoading}
                            className="px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                            Approve Listing
                        </button>
                    )}
                    
                    {room.status !== 'Disabled' && (
                        <button 
                            onClick={() => handleModerate('Disable')}
                            disabled={actionLoading}
                            className="px-6 py-3 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                            Disable Listing
                        </button>
                    )}

                    <button 
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 font-black rounded-2xl hover:bg-rose-100 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                    >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Terminiate Listing
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Property Hero & Gallery */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Hero Card */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden">
                        <div className="p-8 md:p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-gray-50/50 to-white">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${
                                        room.status === 'Available' ? 'bg-emerald-500 text-white shadow-emerald-100' :
                                        room.status === 'Pending Verification' ? 'bg-amber-500 text-white shadow-amber-100' :
                                        'bg-gray-400 text-white shadow-gray-100'
                                    }`}>
                                        {room.status}
                                    </span>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                                        ID: #{room.id}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    {room.title}
                                </h1>
                                <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-rose-500" />
                                    {room.location}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Cost</p>
                                <p className="text-3xl font-black text-blue-600 tracking-tighter">
                                    Rs. {room.price?.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10">
                            {/* Main Image */}
                            <div className="flex-1 aspect-video rounded-[2rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-inner group">
                                {room.images && room.images.length > 0 ? (
                                    <img 
                                        src={getMediaUrl(room.images[0].image)} 
                                        alt="Property" 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                                        <Home className="w-20 h-20" />
                                        <p className="font-black text-xs uppercase tracking-widest mt-4">No imagery available</p>
                                    </div>
                                )}
                            </div>

                            {/* Secondary Stats */}
                            <div className="w-full md:w-64 space-y-4">
                                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Inventory Type</p>
                                    <p className="text-lg font-black text-blue-900 leading-tight">{room.room_type}</p>
                                </div>
                                <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Gender Pref</p>
                                    <p className="text-lg font-black text-purple-900 leading-tight">{room.gender_preference}</p>
                                </div>
                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Verification</p>
                                    <p className="text-lg font-black text-emerald-900 leading-tight">
                                        {room.status === 'Available' ? 'Verified Hub' : 'Pending Audit'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
                            <h3 className="text-lg font-black text-gray-900 mb-8 uppercase tracking-tight flex items-center gap-3 border-b border-gray-50 pb-6">
                                <Settings className="w-5 h-5 text-gray-400" />
                                Specifications
                            </h3>
                            <div className="space-y-6 pt-2">
                                <div className="flex items-center justify-between group">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Floor Level</span>
                                    <span className="font-bold text-gray-900">{room.floor || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Surface Area</span>
                                    <span className="font-bold text-gray-900">{room.size || 'Medium'}</span>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">WiFi Connectivity</span>
                                    <span className={`flex items-center gap-1.5 font-bold ${room.wifi ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {room.wifi ? <Wifi className="w-3.5 h-3.5" /> : 'None'}
                                        {room.wifi ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Air Conditioning</span>
                                    <span className={`flex items-center gap-1.5 font-bold ${room.ac ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {room.ac ? <Wind className="w-3.5 h-3.5" /> : 'None'}
                                        {room.ac ? 'Equipped' : 'Not Equipped'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Television Hub</span>
                                    <span className={`flex items-center gap-1.5 font-bold ${room.tv ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {room.tv ? <Tv className="w-3.5 h-3.5" /> : 'None'}
                                        {room.tv ? 'Equipped' : 'Not Equipped'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center text-center">
                            <h3 className="text-lg font-black text-gray-900 mb-8 uppercase tracking-tight flex items-center gap-3 w-full justify-start border-b border-gray-50 pb-6">
                                <Navigation className="w-5 h-5 text-gray-400" />
                                Geolocation
                            </h3>
                            <div className="flex-1 flex flex-col items-center justify-center py-6">
                                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-rose-100">
                                    <MapPin className="w-10 h-10 text-rose-500" />
                                </div>
                                <div className="space-y-4 w-full px-6">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-black text-gray-400 uppercase tracking-widest">Latidude</span>
                                        <code className="bg-gray-50 px-3 py-1 rounded-lg text-blue-600 font-bold">{room.latitude || '27.7172'}</code>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-black text-gray-400 uppercase tracking-widest">Longitude</span>
                                        <code className="bg-gray-50 px-3 py-1 rounded-lg text-blue-600 font-bold">{room.longitude || '85.3240'}</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Owner Profile & Actions */}
                <div className="space-y-8">
                    
                    {/* Owner Card */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 bg-gray-900 flex items-center justify-between">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Verified Owner</h3>
                            <div className="p-1 px-3 bg-white/10 rounded-full">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Partner</span>
                            </div>
                        </div>
                        <div className="p-10 text-center">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-100 to-indigo-100 mx-auto mb-6 flex items-center justify-center text-blue-700 font-black text-3xl border-4 border-white shadow-xl overflow-hidden relative group">
                                {room.owner?.profile_photo ? (
                                    <img src={getMediaUrl(room.owner.profile_photo)} alt="Owner" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    room.owner?.full_name?.charAt(0) || 'U'
                                )}
                                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            
                            <h4 className="text-xl font-black text-gray-900 tracking-tight mb-2 truncate">{room.owner?.full_name}</h4>
                            <p className="text-gray-500 font-medium text-sm mb-8">{room.owner?.email}</p>
                            
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Reputation</p>
                                    <p className="text-sm font-black text-gray-900">Premium</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Role</p>
                                    <p className="text-sm font-black text-gray-900">{room.owner?.role}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/admin/users`)}
                                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-gray-100 flex items-center justify-center gap-2"
                            >
                                <User className="w-3.5 h-3.5" />
                                Inspect Owner Intelligence
                            </button>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Listing Timeline
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Created Date</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {new Date(room.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Modified</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {new Date(room.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
