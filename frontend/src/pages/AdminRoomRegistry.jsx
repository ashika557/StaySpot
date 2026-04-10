import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home, Search, Loader2, Building,
    MapPin, Eye, Trash2, BadgeCheck, Shield
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, getMediaUrl } from '../constants/api';
import { adminService } from '../services/adminService';

export default function AdminRoomRegistry({ user }) {
    const navigate = useNavigate();
    
    // Core State
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Action State
    const [actionLoading, setActionLoading] = useState(null);

    const fetchRooms = React.useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const handleModerateRoom = async (roomId, action) => {
        try {
            setActionLoading(roomId);
            await adminService.moderateRoom(roomId, action);
            fetchRooms();
        } catch (error) {
            alert(`Failed to ${action} room.`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm('Delete this listing permanently?')) return;
        try {
            setActionLoading(roomId);
            await apiRequest(`${API_ENDPOINTS.ROOMS}${roomId}/`, { method: 'DELETE' });
            setRooms(rooms.filter(r => r.id !== roomId));
        } catch (error) {
            alert('Deletion failed');
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
        <div className="max-w-[1200px] mx-auto text-left">
            
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Manage Rooms</h1>
                <p className="text-gray-500 font-medium">View and manage all property listings on the platform.</p>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col lg:flex-row gap-4 items-center">
                
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID, title, or owner..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-4 w-full lg:w-auto">
                    <select
                        className="w-full lg:w-48 px-4 py-3 bg-gray-50 border border-transparent rounded-lg text-sm outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="Pending Verification">Pending</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Disabled">Disabled</option>
                    </select>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Room ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                            ) : filteredRooms.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                                                <Home className="w-6 h-6 text-gray-300" />
                                            </div>
                                            <p className="text-sm text-gray-500">No rooms found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-blue-600 text-sm">#{room.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100 shadow-sm">
                                                    {room.images && room.images[0] ? (
                                                        <img src={getMediaUrl(room.images[0].image)} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><Building className="w-5 h-5 text-gray-300" /></div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 text-sm truncate">{room.title}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                                                        <MapPin className="w-3 h-3 text-rose-500" /> {room.location}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {room.owner?.profile_photo ? (
                                                        <img src={getMediaUrl(room.owner.profile_photo)} className="w-full h-full object-cover rounded-full" alt="" />
                                                    ) : (
                                                        room.owner?.full_name?.charAt(0) || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{room.owner?.full_name}</p>
                                                    <p className="text-[10px] text-emerald-600 font-semibold uppercase flex items-center gap-1">
                                                        <BadgeCheck className="w-3 h-3" /> Verified
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">Rs.{room.price?.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">Monthly</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={room.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {room.status === 'Pending Verification' && (
                                                    <button 
                                                        onClick={() => handleModerateRoom(room.id, 'Approve')}
                                                        disabled={actionLoading === room.id}
                                                        className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all shadow-sm"
                                                        title="Approve"
                                                    >
                                                        {actionLoading === room.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                                    </button>
                                                )}
                                                
                                                <button 
                                                    onClick={() => navigate(`/admin/rooms/${room.id}`)}
                                                    className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all shadow-sm"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                <button 
                                                    onClick={() => handleDeleteRoom(room.id)}
                                                    disabled={actionLoading === room.id}
                                                    className="p-2 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all shadow-sm"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        'Pending Verification': 'bg-amber-50 text-amber-700 border-amber-100',
        Available: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        Occupied: 'bg-blue-50 text-blue-700 border-blue-100',
        Disabled: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    
    const labelMapping = {
        'Pending Verification': 'Pending',
        Available: 'Available',
        Occupied: 'Occupied',
        Disabled: 'Disabled'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${configs[status] || configs.Disabled}`}>
            {labelMapping[status] || status}
        </span>
    );
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td colSpan="6" className="px-6 py-4">
                <div className="h-10 bg-gray-50 rounded-lg"></div>
            </td>
        </tr>
    );
}

