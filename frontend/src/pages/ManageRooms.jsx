// TEST REFRESH 2
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home, Search, Filter, Loader2, Building,
    MapPin, Eye, Trash2
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS } from '../constants/api';
import { adminService } from '../services/adminService';

export default function ManageRooms({ user }) {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await apiRequest(API_ENDPOINTS.ROOMS);
            if (response.ok) {
                const data = await response.json();
                setRooms(data || []);
            }
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModerateRoom = async (roomId, action) => {
        try {
            setActionLoading(roomId);
            await adminService.moderateRoom(roomId, action);
            // Refresh rooms after action
            fetchRooms();
        } catch (error) {
            console.error(`Failed to ${action} room:`, error);
            alert(`Failed to ${action} room. Please try again.`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm('Are you sure you want to delete this room permanently? This action cannot be undone.')) return;

        try {
            setActionLoading(roomId);
            const response = await apiRequest(`${API_ENDPOINTS.ROOMS}${roomId}/`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setRooms(rooms.filter(r => r.id !== roomId));
            }
        } catch (error) {
            console.error('Failed to delete room:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredRooms = rooms.filter(r => {
        const matchesSearch =
            r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                            <Home className="w-8 h-8 text-white" />
                        </div>
                        Inventory Control
                    </h1>
                    <p className="text-gray-500 font-medium ml-1">Monitor and moderate all property listings across the platform.</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 mb-8 flex flex-col lg:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full text-left">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by title, location, or owner name..."
                        className="w-full pl-16 pr-6 py-4 bg-gray-50 border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <div className="relative min-w-[200px] flex-1">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            className="w-full pl-12 pr-10 py-4 bg-gray-50 border-transparent rounded-[1.5rem] appearance-none focus:ring-4 focus:ring-blue-50 outline-none cursor-pointer font-bold text-sm text-gray-600"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending Verification">Pending Verification</option>
                            <option value="Available">Available</option>
                            <option value="Occupied">Occupied</option>
                            <option value="Disabled">Disabled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Rooms Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm animate-pulse h-80"></div>
                    ))}
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-24 text-center">
                    <Home className="w-20 h-20 text-gray-100 mx-auto mb-6" />
                    <p className="text-gray-400 font-black uppercase tracking-widest">No listings found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                    {filteredRooms.map((room) => (
                        <div key={room.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group text-left">
                            <div className="h-56 relative overflow-hidden bg-gray-100">
                                {room.images && room.images[0] ? (
                                    <img src={room.images[0].image} alt={room.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                        <Building className="w-16 h-16" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <StatusBadge status={room.status} />
                                </div>
                                <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl text-xs font-black text-gray-900 shadow-lg">
                                    Rs. {room.price}
                                </div>
                            </div>

                            <div className="p-8">
                                <h3 className="text-xl font-black text-gray-900 line-clamp-1 mb-3 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{room.title}</h3>

                                <div className="flex items-center text-sm text-gray-500 font-medium gap-2 mb-6">
                                    <MapPin className="w-4 h-4 text-rose-500" />
                                    <span className="line-clamp-1">{room.location}</span>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-900 flex items-center justify-center font-black text-xs border border-gray-100">
                                            {room.owner?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-gray-900 uppercase tracking-tight">{room.owner?.full_name || 'Unknown'}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Property Owner</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {room.status === 'Pending Verification' && (
                                            <>
                                                <button
                                                    onClick={() => handleModerateRoom(room.id, 'Approve')}
                                                    disabled={actionLoading === room.id}
                                                    className="w-10 h-10 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all font-bold"
                                                    title="Approve Room"
                                                >
                                                    {actionLoading === room.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleModerateRoom(room.id, 'Disable')}
                                                    disabled={actionLoading === room.id}
                                                    className="w-10 h-10 flex items-center justify-center text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all font-bold"
                                                    title="Reject Room"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                        {room.status === 'Available' && (
                                            <button
                                                onClick={() => handleModerateRoom(room.id, 'Disable')}
                                                disabled={actionLoading === room.id}
                                                className="w-10 h-10 flex items-center justify-center text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all font-bold"
                                                title="Disable Listing"
                                            >
                                                <Eye className="w-5 h-5 opacity-50" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => navigate(`/room/${room.id}`)}
                                            className="w-10 h-10 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all font-bold"
                                            title="View Details"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRoom(room.id)}
                                            disabled={actionLoading === room.id}
                                            className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all font-bold"
                                            title="Delete permanently"
                                        >
                                            {actionLoading === room.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        'Pending Verification': 'bg-amber-500 text-white shadow-amber-200',
        Available: 'bg-emerald-500 text-white shadow-emerald-200',
        Occupied: 'bg-blue-500 text-white shadow-blue-200',
        Disabled: 'bg-gray-400 text-white shadow-gray-200',
        Hidden: 'bg-gray-400 text-white shadow-gray-200'
    };
    return (
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${configs[status] || configs.Hidden}`}>
            {status}
        </span>
    );
}
