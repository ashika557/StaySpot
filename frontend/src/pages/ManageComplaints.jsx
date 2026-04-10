import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { MessageSquare, Loader2 } from 'lucide-react';

export default function ManageComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await adminService.getComplaints();
            setComplaints(data || []);
        } catch (error) {
            console.error('Failed to load complaints');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 max-w-[1200px] mx-auto">
            <h1 className="text-2xl font-bold mb-6">Manage Complaints</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {complaints.map(complaint => (
                    <div key={complaint.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
                                {complaint.user_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{complaint.subject}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{complaint.status}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-3">{complaint.description}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{complaint.priority}</span>
                            <span className="text-blue-500 font-bold text-xs">{complaint.id}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
