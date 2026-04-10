import React, { useState, useEffect } from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import {
  Home, Calendar, DollarSign, MessageSquare, Wrench,
  Users, ArrowRight, Activity, Plus,
  ArrowUpRight, ChevronRight, MapPin, Bell
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { chatService } from '../services/chatService';
import { visitService } from '../services/tenantService';
import { useNavigate } from 'react-router-dom';
import { ROUTES, getMediaUrl, API_ENDPOINTS } from '../constants/api';
import TenantDetailsModal from '../components/TenantDetailsModal';

export default function OwnerDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [totalRooms, setTotalRooms] = useState(0);
  const [availableRooms, setAvailableRooms] = useState(0);
  const [occupiedRooms, setOccupiedRooms] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [recentChats, setRecentChats] = useState([]);
  const [visitRequests, setVisitRequests] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchMainData();
  }, []);

  const fetchMainData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        getRoomData(),
        getRecentChats(),
        getVisitRequests(),
        getFinancialData()
      ]);
    } catch (error) {
      console.error("Dashboard error", error);
    } finally {
      setLoading(false);
    }
  };

  async function getFinancialData() {
    try {
      const response = await apiRequest(API_ENDPOINTS.OWNER_FINANCIALS);
      if (response.ok) {
        const data = await response.json();
        setTotalIncome(data.stats.all_time.earnings);
        const pending = data.logs.filter(log => log.status === 'Pending' || log.status === 'Overdue');
        setPendingPayments(pending.slice(0, 5));
      }
    } catch (error) { console.error(error); }
  }

  async function getRecentChats() {
    try {
      const chats = await chatService.getConversations();
      setRecentChats(chats.slice(0, 3));
    } catch (error) { console.error(error); }
  }

  async function getVisitRequests() {
    try {
      const visits = await visitService.getAllVisits();
      const pending = visits.filter(v => v.status === 'Pending').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setVisitRequests(pending);
    } catch (error) { console.error(error); }
  }

  async function getRoomData() {
    try {
      const response = await apiRequest('/rooms/');
      if (response.ok) {
        const rooms = await response.json();
        setTotalRooms(rooms.length);
        setAvailableRooms(rooms.filter(r => r.status === 'Available').length);
        setOccupiedRooms(rooms.filter(r => r.status === 'Occupied' || r.status === 'Rented').length);
      }
    } catch (error) { console.error(error); }
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSendReminder = async (bookingId) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.TRIGGER_REMINDERS, {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId })
      });
      if (response.ok) {
        alert("Reminder sent successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to send reminder");
      }
    } catch (err) {
      console.error("Reminder failed", err);
      alert("Failed to send reminder");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <OwnerSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter text-slate-900">
      <OwnerSidebar user={user} />

      <div className="flex-1 flex flex-col overflow-auto">
        <main className="p-8">

          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 font-medium mb-0.5">{getGreeting()},</p>
              <h2 className="text-2xl font-bold text-gray-900">{user?.full_name || 'Welcome back'}</h2>
              <p className="text-sm text-gray-400 mt-0.5">Here's an overview of your properties today.</p>
            </div>
            <button
              onClick={() => navigate('/owner/rooms')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Room
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Rooms', value: totalRooms, icon: <Home />, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
              { label: 'Available', value: availableRooms, icon: <Activity />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
              { label: 'Occupied', value: occupiedRooms, icon: <Users />, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
              { label: 'Total Earnings', value: `Rs. ${totalIncome.toLocaleString()}`, icon: <DollarSign />, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${stat.iconBg}`}>
                  {React.cloneElement(stat.icon, { className: `w-4 h-4 ${stat.iconColor}` })}
                </div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">{stat.label}</p>
                <h3 className="text-xl font-bold text-gray-900">{stat.value}</h3>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                  <ArrowUpRight size={11} />
                  <span>Live</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-6">

            {/* Left — 2/3 */}
            <div className="col-span-2 space-y-6">

              {/* Visit Requests */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">Visit Requests</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    {visitRequests.length > 0 && (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-1 rounded-full">
                        {visitRequests.length} pending
                      </span>
                    )}
                    <button onClick={() => navigate('/owner/visits')} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {visitRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-1">
                        <Calendar className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No pending visit requests</p>
                      <p className="text-xs">Requests from tenants will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {visitRequests.slice(0, 3).map((visit) => (
                        <div
                          key={visit.id}
                          onClick={() => navigate('/owner/visits')}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={visit.tenant.profile_photo ? getMediaUrl(visit.tenant.profile_photo) : `https://ui-avatars.com/api/?name=${visit.tenant.full_name}&background=f3f4f6&color=94a3b8&bold=true`}
                              className="w-10 h-10 rounded-full object-cover border border-gray-100"
                              alt=""
                            />
                            <div>
                              <p className="text-sm font-bold text-gray-900">{visit.tenant.full_name}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} className="text-indigo-400" />
                                {visit.room.title}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-gray-700">
                              {new Date(visit.visit_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">{visit.visit_time.slice(0, 5)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>


              {/* Rent Reminders Section */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Rent Reminders</h2>
                      <p className="text-[10px] text-gray-400">Outstanding payments</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(ROUTES.OWNER_PAYMENTS)} className="text-xs text-indigo-600 font-bold hover:underline">
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tenant</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pendingPayments.length > 0 ? (
                        pendingPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.tenant.profile_photo || `https://ui-avatars.com/api/?name=${p.tenant.full_name}&background=eff6ff&color=2563eb&bold=true`}
                                  className="w-8 h-8 rounded-full"
                                  alt=""
                                />
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{p.tenant.full_name}</p>
                                  <p className="text-[10px] text-gray-400">Rs {p.amount.toLocaleString()} • {p.status}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleSendReminder(p.booking_id || p.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              >
                                <Bell className="w-3 h-3" /> Remind
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="px-6 py-8 text-center text-[10px] text-gray-400 italic">
                            No pending rent payments.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Sidebar — 1/3 */}
            <div className="space-y-6">

              {/* Messages */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Messages</h3>
                  </div>
                </div>

                <div className="p-5">
                  {recentChats.length === 0 ? (
                    <div className="flex flex-col items-center py-6 gap-2 text-gray-400">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No messages yet</p>
                      <p className="text-xs">Messages from tenants will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentChats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => navigate(ROUTES.CHAT)}
                          className="flex gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition"
                        >
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                            {chat.other_user.full_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">{chat.other_user.full_name}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {chat.last_message?.text || 'Message received'}
                            </p>
                          </div>
                          <p className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                            {new Date(chat.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      ))}
                      <button
                        onClick={() => navigate(ROUTES.CHAT)}
                        className="w-full text-center text-indigo-600 text-xs font-bold hover:underline mt-1 flex items-center justify-center gap-1"
                      >
                        View All Chats <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance */}
              <div
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
                onClick={() => navigate(ROUTES.OWNER_MAINTENANCE)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <Wrench className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Maintenance</h4>
                    <p className="text-xs text-gray-400 mt-0.5">View repair requests</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
              </div>

            </div>
          </div>
        </main>
      </div>

      <TenantDetailsModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedTenant(null); }} tenant={selectedTenant} />
    </div>
  );
}