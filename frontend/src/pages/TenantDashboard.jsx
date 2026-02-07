import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TenantSidebar from '../components/TenantSidebar';
import { Calendar, MapPin, DollarSign, MessageCircle, Star, ChevronRight, MessageSquare } from 'lucide-react';
import { dashboardService } from '../services/tenantService';
import { roomService } from '../services/roomService';
import { chatService } from '../services/chatService';
import { getMediaUrl, ROUTES } from '../constants/api';
import { useNavigate } from 'react-router-dom';

export default function TenantDashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData();
      console.log('Dashboard Data:', data);
      setDashboardData(data);

      // Fetch real chats
      try {
        const chats = await chatService.getConversations();
        setRecentChats(chats.slice(0, 3));
      } catch (e) {
        console.error("Failed to load chats", e);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <TenantSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <TenantSidebar user={user} />

      {/* Main Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="col-span-2 space-y-6">
              {/* Upcoming Visit */}
              <UpcomingVisitCard visit={dashboardData?.upcoming_visit} />

              {/* Current Booking */}
              <CurrentBookingCard booking={dashboardData?.current_booking} />

              {/* Suggested Rooms */}
              <SuggestedRoomsSection rooms={dashboardData?.suggested_rooms || []} />
            </div>

            {/* Right Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* Payment Reminders */}
              <PaymentRemindersCard payments={dashboardData?.payment_reminders || []} />

              {/* Recent Chats */}
              <RecentChatsCard chats={recentChats} user={user} navigate={navigate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Upcoming Visit Card Component
function UpcomingVisitCard({ visit }) {
  if (!visit) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Upcoming Visit</h2>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No upcoming visits scheduled</p>
        </div>
      </div>
    );
  }

  const visitDate = new Date(visit.visit_date);
  const timeString = visit.visit_time || '3:50 PM';

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Upcoming Visit</h2>
        <Link to="/tenant/visits" className="text-sm text-blue-600 font-bold hover:underline">
          View All
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <img
          src={`https://ui-avatars.com/api/?name=${visit.owner?.full_name || 'Owner'}&background=4F46E5&color=fff`}
          className="w-12 h-12 rounded-full"
          alt={visit.owner?.full_name}
        />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">Meeting with {visit.owner?.full_name}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin className="w-4 h-4" />
            <span>Room viewing at {visit.room?.location}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                await chatService.startConversation(visit.owner.id);
                navigate(ROUTES.CHAT);
              } catch (err) {
                console.error("Failed to start chat:", err);
                alert("Could not start chat. Please try again.");
              }
            }}
            className="p-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
            title="Chat with Owner"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Current Booking Card Component
function CurrentBookingCard({ booking }) {
  if (!booking) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Current Booking</h2>
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No active booking</p>
        </div>
      </div>
    );
  }

  const startDate = new Date(booking.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endDate = new Date(booking.end_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Current Booking</h2>

      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">
            {booking.room?.title || 'Deluxe Room'}
          </h3>
          <p className="text-sm text-gray-500">
            Booked from {startDate} - {endDate}
          </p>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              Owner: {booking.room?.owner?.full_name || 'Unknown'}
            </p>
            {/* Show Chat button only if approved/active */}
            {(booking.status === 'Active' || booking.status === 'Approved') && booking.room?.owner?.id && (
              <button
                onClick={async () => {
                  try {
                    await chatService.startConversation(booking.room.owner.id);
                    navigate(ROUTES.CHAT);
                  } catch (err) {
                    console.error("Failed to start chat:", err);
                    alert("Could not start chat. Please try again.");
                  }
                }}
                className="flex items-center gap-2 text-sm text-blue-600 font-bold hover:underline"
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Owner
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              {booking.status}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              ₹{parseFloat(booking.monthly_rent).toLocaleString()}/month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment Reminders Card Component
function PaymentRemindersCard({ payments }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4">Payment Reminders</h3>

      {payments.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          No pending payments
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const isOverdue = payment.status === 'Overdue';
            const dueDate = new Date(payment.due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={payment.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">
                      {payment.payment_type === 'Rent' ? 'Rent Due' : payment.payment_type}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {payment.room_number ? `Room ${payment.room_number}` : payment.tenant_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                      ₹{parseFloat(payment.amount).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Due {dueDate}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Recent Chats Card Component
function RecentChatsCard({ chats, user, navigate }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4">Recent Chats</h3>

      {chats.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>No recent chats</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(ROUTES.CHAT)}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {chat.other_user.full_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm">{chat.other_user.full_name}</h4>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {chat.last_message ? chat.last_message.text : 'Start a conversation...'}
                </p>
                <p className="text-xs text-blue-500 mt-1">{new Date(chat.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}

          <button
            onClick={() => navigate(ROUTES.CHAT)}
            className="w-full text-center text-blue-600 text-sm font-bold hover:underline mt-2"
          >
            View All Chats
          </button>
        </div>
      )}
    </div>
  );
}

// Suggested Rooms Section Component
function SuggestedRoomsSection({ rooms }) {
  console.log('SuggestedRoomsSection received rooms:', rooms);
  console.log('Rooms length:', rooms?.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Suggested Rooms
        </h2>
        <Link to="/tenant/search" className="text-blue-600 text-sm font-bold hover:underline">
          See All
        </Link>
      </div>

      {!rooms || rooms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-gray-200 text-center">
          <p className="text-gray-500">
            No room suggestions available. Make sure there are available rooms in the database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}

// Room Card Component
function RoomCard({ room }) {
  const navigate = useNavigate();
  const imageUrl = room.images && room.images.length > 0
    ? getMediaUrl(room.images[0].image)
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop';

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          alt={room.title}
        />
        <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-blue-600 font-bold text-sm shadow-sm">
          ₹{parseFloat(room.price).toLocaleString()}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">
          {room.room_type}
        </div>
        <div className="flex flex-col mb-1">
          <h3 className="font-bold text-gray-900 line-clamp-1 leading-tight group-hover:text-blue-600 transition">
            {room.title}
          </h3>
          {room.status === 'Occupied' && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded w-fit mt-0.5">OCCUPIED</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-xs mb-1.5">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{room.location}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={10} fill={i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "none"} color={i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "#D1D5DB"} />
            ))}
          </div>
          <span className="text-[10px] text-gray-400 font-bold">
            {room.average_rating ? room.average_rating.toFixed(1) : '0.0'} ({room.review_count || 0})
          </span>
        </div>

        <button
          onClick={() => navigate(`/room/${room.id}`)}
          className="w-full py-2 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
        >
          See Details
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
        </button>
      </div>
    </div>
  );
}