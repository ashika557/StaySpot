import React, { useState, useEffect } from 'react';
import {
    Home,
    Search,
    Filter,
    CheckCircle,
    AlertCircle,
    MoreVertical,
    MapPin,
    Users,
    Eye,
    Trash2,
    Loader2,
    Tag,
    Building,
    DollarSign,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

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
                setRooms(data);
            }
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        } finally {
            setLoading(false);
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
            (r.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const styles = {
            Available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            Occupied: 'bg-blue-100 text-blue-700 border-blue-200',
            Hidden: 'bg-gray-100 text-gray-700 border-gray-200'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.Hidden}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <AdminSidebar user={user} />

            <main className="flex-1 lg:ml-64 p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Home className="w-7 h-7 text-indigo-600" />
                            Manage Rooms
                        </h1>
                        <p className="text-gray-500 mt-1">Oversee all property listings and moderate content.</p>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title, location, or owner..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-48">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Available">Available</option>
                                <option value="Occupied">Occupied</option>
                                <option value="Hidden">Hidden</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Rooms Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse h-64"></div>
                        ))}
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-500 font-medium">
                        No listings found matching the criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                            <div key={room.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                <div className="h-48 relative overflow-hidden bg-gray-100">
                                    {room.images && room.images[0] ? (
                                        <img src={room.images[0].image} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Building className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        {getStatusBadge(room.status)}
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{room.title}</h3>
                                        <div className="text-indigo-600 font-bold">Rs. {room.price}</div>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 gap-1.5 mb-4">
                                        <MapPin className="w-4 h-4" />
                                        <span className="line-clamp-1">{room.location}</span>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {room.owner?.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div className="text-xs">
                                                <div className="text-gray-900 font-medium">{room.owner?.full_name}</div>
                                                <div className="text-gray-500">Owner</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => navigate(`/rooms/${room.id}`)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRoom(room.id)}
                                                disabled={actionLoading === room.id}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Remove Listing"
                                            >
                                                {actionLoading === room.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
