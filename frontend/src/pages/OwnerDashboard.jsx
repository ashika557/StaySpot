import React, { useState, useEffect } from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import { Home, Calendar, DollarSign, Bell, MessageSquare } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { chatService } from '../services/chatService';
import { visitService } from '../services/tenantService';
import { useNavigate } from 'react-router-dom';
import { ROUTES, getMediaUrl } from '../constants/api';
import OwnerHeader from '../components/OwnerHeader';
import TenantDetailsModal from '../components/TenantDetailsModal';
import Footer from '../components/Footer';

export default function OwnerDashboard({ user, onLogout }) {
  const [totalRooms, setTotalRooms] = useState(0);
  const [availableRooms, setAvailableRooms] = useState(0);
  const [occupiedRooms, setOccupiedRooms] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [recentChats, setRecentChats] = useState([]);
  const [visitRequests, setVisitRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  // Fetch data when component loads
  useEffect(() => {
    getRoomData();
    getRecentChats();
    getVisitRequests();
  }, []);

  async function getRecentChats() {
    try {
      const chats = await chatService.getConversations();
      setRecentChats(chats.slice(0, 3));
    } catch (error) {
      console.error("Failed to load recent chats", error);
    }
  }

  async function getVisitRequests() {
    try {
      const visits = await visitService.getAllVisits();
      const pending = visits.filter(v => v.status === 'Pending').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setVisitRequests(pending);
    } catch (error) {
      console.error("Failed to load visit requests", error);
    }
  }

  async function getRoomData() {
    try {
      const response = await apiRequest('/rooms/');
      if (response.ok) {
        const rooms = await response.json();
        setTotalRooms(rooms.length);
        const available = rooms.filter(room => room.status === 'Available').length;
        setAvailableRooms(available);
        const occupied = rooms.filter(room => room.status === 'Occupied').length;
        setOccupiedRooms(occupied);
        setTotalIncome(0);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (tenant) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTenant(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <OwnerSidebar user={user} />

      <div className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1 p-8">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading dashboard...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-6 mb-8">
                {/* Card 1: Total Rooms */}
                <div className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Rooms Listed</p>
                      <p className="text-3xl font-bold">{totalRooms}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
                      <Home className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-blue-600 font-medium">Active listings</p>
                </div>

                {/* Card 2: Available Rooms */}
                <div className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Available Rooms</p>
                      <p className="text-3xl font-bold">{availableRooms}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-green-600 font-medium">Ready for booking</p>
                </div>

                {/* Card 3: Occupied Rooms */}
                <div className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Occupied Rooms</p>
                      <p className="text-3xl font-bold">{occupiedRooms}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-orange-100">
                      <Home className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-sm text-orange-600 font-medium">Currently rented</p>
                </div>

                {/* Card 4: Total Income */}
                <div className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Income</p>
                      <p className="text-3xl font-bold">Rs {totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Tracking enabled</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Left Column: Visit Requests */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b flex items-center justify-between bg-white">
                    <h3 className="text-lg font-bold text-gray-800">New Visit Requests</h3>
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                      {visitRequests.length} New
                    </span>
                  </div>
                  <div className="p-6">
                    {visitRequests.length > 0 ? (
                      <div className="space-y-4">
                        {visitRequests.slice(0, 3).map((visit) => (
                          <div key={visit.id} className="flex items-center justify-between p-3 border border-gray-50 rounded-xl hover:bg-gray-50 transition cursor-pointer" onClick={() => handleOpenModal(visit.tenant)}>
                            <div className="flex items-center gap-3">
                              <img
                                src={visit.tenant.profile_photo ? getMediaUrl(visit.tenant.profile_photo) : `https://ui-avatars.com/api/?name=${visit.tenant.full_name}&background=random`}
                                className="w-10 h-10 rounded-full object-cover shadow-sm"
                                alt=""
                              />
                              <div>
                                <p className="font-bold text-gray-900 leading-tight">{visit.tenant.full_name}</p>
                                <p className="text-xs text-gray-500 mt-0.5 mt-1 truncate max-w-[150px]">{visit.room.title}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-blue-600">{new Date(visit.visit_date).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{visit.visit_time.slice(0, 5)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No new visit requests.</p>
                      </div>
                    )}
                    <button
                      onClick={() => navigate('/owner/visits')}
                      className="w-full mt-6 py-2.5 text-blue-600 text-sm font-bold bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                    >
                      View All Requests
                    </button>
                  </div>
                </div>

                {/* Right Column: Tenant Chats */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b flex justify-between items-center bg-white">
                    <h3 className="text-lg font-bold text-gray-800">Recent Tenant Chats</h3>
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="p-6">
                    {recentChats.length > 0 ? (
                      <div className="space-y-4">
                        {recentChats.map((chat) => (
                          <div key={chat.id} className="p-3 border border-gray-50 rounded-xl cursor-pointer hover:bg-gray-50 transition" onClick={() => navigate(ROUTES.CHAT)}>
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden shadow-sm">
                                {chat.other_user.profile_photo ? (
                                  <img src={getMediaUrl(chat.other_user.profile_photo)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  chat.other_user.full_name[0]
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-bold text-gray-900">{chat.other_user.full_name}</p>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    {new Date(chat.updated_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 truncate leading-relaxed">
                                  {chat.last_message ? chat.last_message.text : 'Start a conversation...'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No recent messages.</p>
                      </div>
                    )}
                    <button
                      onClick={() => navigate(ROUTES.CHAT)}
                      className="w-full mt-6 py-2.5 text-blue-600 text-sm font-bold bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                    >
                      View All Messages
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <Footer />
      </div>

      <TenantDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tenant={selectedTenant}
      />
    </div>
  );
}
