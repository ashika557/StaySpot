import React, { useState, useEffect } from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import { Home, Calendar, DollarSign, Bell, MessageSquare, Wrench, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { chatService } from '../services/chatService';
import { visitService } from '../services/tenantService';
import { useNavigate } from 'react-router-dom';
import { ROUTES, getMediaUrl, API_ENDPOINTS } from '../constants/api';
import TenantDetailsModal from '../components/TenantDetailsModal';

export default function OwnerDashboard({ user, onLogout }) {
  const [totalRooms, setTotalRooms] = useState(0);
  const [availableRooms, setAvailableRooms] = useState(0);
  const [occupiedRooms, setOccupiedRooms] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [recentChats, setRecentChats] = useState([]);
  const [visitRequests, setVisitRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    getRoomData();
    getRecentChats();
    getVisitRequests();
    getFinancialData();
  }, []);

  async function getFinancialData() {
    try {
      const response = await apiRequest(API_ENDPOINTS.OWNER_FINANCIALS);
      if (response.ok) {
        const data = await response.json();
        setTotalIncome(data.stats.all_time.earnings);
      }
    } catch (error) {
      console.error("Failed to fetch financial data", error);
    }
  }

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
        const occupied = rooms.filter(room => room.status === 'Occupied' || room.status === 'Rented').length;
        setOccupiedRooms(occupied);
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

  const statCards = [
    {
      label: 'Total Rooms Listed',
      value: totalRooms,
      sub: 'Active listings',
      icon: <Home className="w-5 h-5" />,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      subColor: '#2563eb',
      accent: '#2563eb',
    },
    {
      label: 'Available Rooms',
      value: availableRooms,
      sub: 'Ready for booking',
      icon: <Calendar className="w-5 h-5" />,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      subColor: '#16a34a',
      accent: '#16a34a',
    },
    {
      label: 'Occupied Rooms',
      value: occupiedRooms,
      sub: 'Currently rented',
      icon: <Users className="w-5 h-5" />,
      iconBg: '#fff7ed',
      iconColor: '#ea580c',
      subColor: '#ea580c',
      accent: '#ea580c',
    },
    {
      label: 'Total Income',
      value: `Rs ${totalIncome.toLocaleString()}`,
      sub: 'All time earnings',
      icon: <DollarSign className="w-5 h-5" />,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      subColor: '#16a34a',
      accent: '#16a34a',
    },
    {
      label: 'Maintenance',
      value: 'Manage',
      sub: 'Fix issues',
      icon: <Wrench className="w-5 h-5" />,
      iconBg: '#fff7ed',
      iconColor: '#ea580c',
      subColor: '#ea580c',
      accent: '#ea580c',
      onClick: () => navigate(ROUTES.OWNER_MAINTENANCE),
      clickable: true,
    },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <OwnerSidebar user={user} />

      <div className="flex-1 flex flex-col overflow-auto">
        <div className="flex-1 p-8">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-5"></div>
              <p className="text-gray-400 font-medium text-sm">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  Welcome back, {user?.full_name?.split(' ')[0] || 'Owner'} 
                </h1>
                <p className="text-sm text-gray-400 mt-1">Here's what's happening with your properties today.</p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-5 gap-5 mb-8">
                {statCards.map((card, i) => (
                  <div
                    key={i}
                    onClick={card.onClick}
                    className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-200 ${card.clickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : 'hover:shadow-md'}`}
                    style={{ borderTop: `3px solid ${card.accent}` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: card.iconBg, color: card.iconColor }}
                      >
                        {card.icon}
                      </div>
                      {card.clickable && (
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{card.label}</p>
                    <p className="text-2xl font-extrabold text-gray-900 leading-tight">{card.value}</p>
                    <p className="text-xs font-semibold mt-2" style={{ color: card.subColor }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-2 gap-6">

                {/* Visit Requests */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">New Visit Requests</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Pending approvals</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold rounded-full text-white"
                      style={{ background: visitRequests.length > 0 ? '#2563eb' : '#9ca3af' }}>
                      {visitRequests.length} New
                    </span>
                  </div>

                  <div className="p-6">
                    {visitRequests.length > 0 ? (
                      <div className="space-y-3">
                        {visitRequests.slice(0, 3).map((visit) => (
                          <div
                            key={visit.id}
                            onClick={() => handleOpenModal(visit.tenant)}
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-blue-50 hover:border-blue-100 transition-all duration-150 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={visit.tenant.profile_photo
                                  ? getMediaUrl(visit.tenant.profile_photo)
                                  : `https://ui-avatars.com/api/?name=${visit.tenant.full_name}&background=EFF6FF&color=2563EB&bold=true`}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow"
                                alt=""
                              />
                              <div>
                                <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{visit.tenant.full_name}</p>
                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">{visit.room.title}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-blue-600">{new Date(visit.visit_date).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{visit.visit_time.slice(0, 5)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                          <Calendar className="w-7 h-7" />
                        </div>
                        <p className="text-sm font-semibold text-gray-400">No new visit requests</p>
                        <p className="text-xs text-gray-300 mt-1">Check back later</p>
                      </div>
                    )}

                    <button
                      onClick={() => navigate('/owner/visits')}
                      className="w-full mt-5 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-150 flex items-center justify-center gap-2"
                    >
                      View All Requests <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Recent Chats */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Recent Tenant Chats</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Latest conversations</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>

                  <div className="p-6">
                    {recentChats.length > 0 ? (
                      <div className="space-y-3">
                        {recentChats.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => navigate(ROUTES.CHAT)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 hover:bg-blue-50 hover:border-blue-100 transition-all duration-150 cursor-pointer group"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden ring-2 ring-white shadow flex-shrink-0">
                              {chat.other_user.profile_photo ? (
                                <img src={getMediaUrl(chat.other_user.profile_photo)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm">{chat.other_user.full_name[0]}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{chat.other_user.full_name}</p>
                                <span className="text-[10px] text-gray-400 font-semibold">
                                  {new Date(chat.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 truncate">
                                {chat.last_message ? chat.last_message.text : 'Start a conversation...'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                          <MessageSquare className="w-7 h-7" />
                        </div>
                        <p className="text-sm font-semibold text-gray-400">No recent messages</p>
                        <p className="text-xs text-gray-300 mt-1">Your chats will appear here</p>
                      </div>
                    )}

                    <button
                      onClick={() => navigate(ROUTES.CHAT)}
                      className="w-full mt-5 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-150 flex items-center justify-center gap-2"
                    >
                      View All Messages <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>

      <TenantDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tenant={selectedTenant}
      />
    </div>
  );
}