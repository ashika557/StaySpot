import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS } from '../constants/api';
import { Home, Search, Loader2 } from 'lucide-react';

export default function ManageRooms() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 max-w-[1200px] mx-auto">
            <h1 className="text-2xl font-bold mb-6">Manage Rooms</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                    <div key={room.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold">{room.title}</h3>
                        <p className="text-gray-500 text-sm">{room.location}</p>
                        <p className="text-blue-600 font-bold mt-2">Rs.{room.price}</p>
                        <div className="mt-4 flex gap-2">
                           <span className="px-3 py-1 bg-gray-100 text-[10px] rounded-full uppercase font-bold text-gray-500">{room.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}