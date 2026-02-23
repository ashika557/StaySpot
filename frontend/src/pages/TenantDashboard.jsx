import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import TenantSidebar from '../components/TenantSidebar';
import { Calendar, MapPin, DollarSign, MessageCircle, Star, ChevronRight, MessageSquare, Clock } from 'lucide-react';
import { dashboardService, paymentService } from '../services/tenantService';
import { roomService } from '../services/roomService';
import { chatService } from '../services/chatService';
import { getMediaUrl, ROUTES } from '../constants/api';
import { useNavigate } from 'react-router-dom';

export default function TenantDashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const navigate = useNavigate();

  // Safety guards to prevent infinite loops
  const isVerifyingRef = useRef(false);
  const hasProcessedCallbackRef = useRef(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePaymentCallback = useCallback(async () => {
    // Prevent multiple simultaneous verification attempts
    if (isVerifyingRef.current || hasProcessedCallbackRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const pidx = urlParams.get('pidx'); // Khalti
    const purchaseOrderId = urlParams.get('purchase_order_id'); // Khalti/eSewa v2
    const encodedData = urlParams.get('data'); // eSewa v2 callback data

    // Legacy/Mixed params
    const status = urlParams.get('status');
    const paymentIdLegacy = urlParams.get('payment_id');
    const method = urlParams.get('method');

    if (!pidx && !encodedData && !(status === 'success' && paymentIdLegacy)) return;

    // Mark as processing and CLEAN URL IMMEDIATELY to stop the loop
    hasProcessedCallbackRef.current = true;
    window.history.replaceState({}, document.title, window.location.pathname);

    // 1. Khalti Callback
    if (pidx) {
      try {
        isVerifyingRef.current = true;
        setVerificationMessage("Verifying your Khalti payment...");
        let paymentId = purchaseOrderId?.split('-')[1] || paymentIdLegacy;

        if (paymentId) {
          const verifyResult = await paymentService.verifyKhaltiPayment(paymentId, pidx);
          if (verifyResult.status === 'Payment verified successfully') {
            alert("Success! Your Khalti payment has been verified.");
            // Auto-generate next month's rent record
            await paymentService.generateMonthlyRents();
            fetchDashboardData();
          }
        }
      } catch (err) {
        console.error('Khalti callback error:', err);
      } finally {
        isVerifyingRef.current = false;
        setVerificationMessage(null);
      }
    }

    // 2. eSewa v2 Callback (data param)
    if (encodedData) {
      try {
        isVerifyingRef.current = true;
        setVerificationMessage("Verifying your eSewa payment...");

        const decodedString = atob(encodedData);
        const responseData = JSON.parse(decodedString);
        const transactionUuid = responseData.transaction_uuid;
        const paymentId = transactionUuid.split('-')[1];
        const esewaStatus = responseData.status?.toUpperCase();

        if (esewaStatus === 'COMPLETE' || esewaStatus === 'SUCCESS') {
          const verifyResult = await paymentService.verifyEsewaPayment(paymentId, encodedData);
          if (verifyResult.status === 'Payment verified successfully') {
            alert("Success! Your eSewa payment has been verified.");
            // Auto-generate next month's rent record
            await paymentService.generateMonthlyRents();
            fetchDashboardData();
          }
        } else {
          alert(`eSewa status: ${responseData.status || 'Unknown'}`);
        }
      } catch (err) {
        console.error('eSewa callback error:', err);
        alert("eSewa verification failed.");
      } finally {
        isVerifyingRef.current = false;
        setVerificationMessage(null);
      }
    }

    // 3. Legacy/Simple Callback (if applicable)
    if (status === 'success' && paymentIdLegacy && method === 'esewa' && !encodedData) {
      try {
        isVerifyingRef.current = true;
        setVerificationMessage("Verifying payment...");
        const refId = urlParams.get('refId') || urlParams.get('oid');
        await paymentService.verifyEsewaPayment(paymentIdLegacy, refId);
        alert("eSewa payment verified successfully!");
        fetchDashboardData();
      } catch (err) {
        console.error(err);
      } finally {
        isVerifyingRef.current = false;
        setVerificationMessage(null);
      }
    } else if (status === 'failure') {
      alert("Payment failed.");
    }
  }, []);

  // Handle callbacks when URL changes
  useEffect(() => {
    handlePaymentCallback();
  }, [handlePaymentCallback]);

  // Background auto-verify for pending payments
  useEffect(() => {
    const autoVerify = async () => {
      if (dashboardData?.payment_reminders?.length > 0 && !isVerifyingRef.current) {
        const pending = dashboardData.payment_reminders.filter(
          p => (p.status === 'Pending' || p.status === 'Overdue') && p.transaction_id
        );

        if (pending.length > 0) {
          isVerifyingRef.current = true;
          let changed = false;
          for (const p of pending) {
            try {
              let res;
              if (p.payment_method === 'Khalti') {
                res = await paymentService.verifyKhaltiPayment(p.id, p.transaction_id);
              } else if (p.payment_method === 'eSewa') {
                res = await paymentService.checkEsewaStatus(p.id, p.transaction_id);
              }
              if (res?.status === 'Payment verified successfully') changed = true;
            } catch (e) { }
          }
          isVerifyingRef.current = false;
          if (changed) fetchDashboardData();
        }
      }
    };

    const interval = setInterval(autoVerify, 30000);
    if (dashboardData) autoVerify();
    return () => clearInterval(interval);
  }, [dashboardData?.payment_reminders]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData();
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
        <TenantSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-auto">
      <TenantSidebar user={user} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Main Content */}
        <div className="flex-1 p-8">
          {verificationMessage && (
            <div className="max-w-4xl mx-auto mb-6 bg-blue-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <Clock className="animate-spin w-5 h-5 text-blue-100" />
                <span className="font-bold">{verificationMessage}</span>
              </div>
            </div>
          )}
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
  const navigate = useNavigate();
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
  const navigate = useNavigate();
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
              NPR {parseFloat(booking.monthly_rent).toLocaleString()}/month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: compute days left from today to due_date string
function getDaysLeft(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

// Payment Reminders Card Component
function PaymentRemindersCard({ payments, onPaymentSuccess }) {
  const handleEsewaPayment = async (payment) => {
    try {
      const params = await paymentService.getEsewaParams(payment.id);
      const esewaUrl = params.esewa_url;

      const formFields = {
        amount: params.amount,
        tax_amount: params.tax_amount,
        total_amount: params.total_amount,
        transaction_uuid: params.transaction_uuid,
        product_code: params.product_code,
        product_service_charge: params.product_service_charge,
        product_delivery_charge: params.product_delivery_charge,
        success_url: params.success_url,
        failure_url: params.failure_url,
        signed_field_names: params.signed_field_names,
        signature: params.signature
      };

      const form = document.createElement('form');
      form.setAttribute('method', 'POST');
      form.setAttribute('action', esewaUrl);

      for (const key in formFields) {
        const hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden');
        hiddenField.setAttribute('name', key);
        hiddenField.setAttribute('value', formFields[key]);
        form.appendChild(hiddenField);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Error initiating eSewa payment:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const handleKhaltiPayment = async (payment) => {
    try {
      const { paymentService } = await import('../services/tenantService');
      const response = await paymentService.initiateKhaltiPayment(payment.id, window.location.href);
      if (response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (error) {
      console.error('Error initiating Khalti payment:', error);
      alert('Failed to initiate Khalti payment. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">Rent Due Soon</h3>
        {payments.length > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded-full">
            {payments.length} pending
          </span>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No rent due this week</p>
          <p className="text-gray-400 text-xs mt-1">You\'re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const daysLeft = getDaysLeft(payment.due_date);
            const isOverdue = payment.status === 'Overdue' || daysLeft < 0;

            // Color scheme based on urgency
            let urgencyColor, urgencyBg, urgencyLabel;
            if (isOverdue) {
              urgencyColor = 'text-red-600';
              urgencyBg = 'bg-red-100';
              urgencyLabel = `${Math.abs(daysLeft)}d overdue`;
            } else if (daysLeft === 0) {
              urgencyColor = 'text-red-600';
              urgencyBg = 'bg-red-100';
              urgencyLabel = 'Due today!';
            } else if (daysLeft === 1) {
              urgencyColor = 'text-orange-600';
              urgencyBg = 'bg-orange-100';
              urgencyLabel = 'Due tomorrow';
            } else if (daysLeft <= 3) {
              urgencyColor = 'text-orange-500';
              urgencyBg = 'bg-orange-50';
              urgencyLabel = `${daysLeft}d left`;
            } else {
              urgencyColor = 'text-yellow-600';
              urgencyBg = 'bg-yellow-50';
              urgencyLabel = `${daysLeft}d left`;
            }

            const dueDate = new Date(payment.due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={payment.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-sm">
                        {payment.payment_type === 'Rent' ? 'Monthly Rent' : payment.payment_type}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgencyBg} ${urgencyColor}`}>
                        {urgencyLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Due {dueDate}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEsewaPayment(payment)}
                        className="text-[10px] bg-green-600 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-green-700 transition"
                      >
                        Pay via eSewa
                      </button>
                      <button
                        onClick={() => handleKhaltiPayment(payment)}
                        className="text-[10px] bg-purple-600 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-purple-700 transition"
                      >
                        Pay via Khalti
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-base ${urgencyColor}`}>
                      NPR {parseFloat(payment.amount).toLocaleString()}
                    </div>
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
          NPR {parseFloat(room.price).toLocaleString()}
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