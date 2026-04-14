import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TenantSidebar from "../components/TenantSidebar";
import {
  Calendar,
  MapPin,
  DollarSign,
  Star,
  ChevronRight,
  MessageSquare,
  Home,
  CheckCircle,
  Bell,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { dashboardService, paymentService } from "../services/tenantService";
import { chatService } from "../services/chatService";
import { getMediaUrl, ROUTES } from "../constants/api";
import { useNavigate } from "react-router-dom";

export default function TenantDashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
      try {
        const chats = await chatService.getConversations();
        setRecentChats(chats.slice(0, 3));
      } catch (e) {
        console.error("Failed to load chats", e);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Nuclear Failsafe: If we land on dashboard (even for a second) with tokens, instantly move away
    const search = window.location.search;
    if (
      search.includes("pidx=") ||
      search.includes("data=") ||
      search.includes("oid=")
    ) {
      navigate(`${ROUTES.TENANT_PAYMENTS}${search}`, { replace: true });
      return;
    }
    fetchDashboardData();
  }, [navigate, fetchDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <TenantSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">
              Loading dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pendingPayments = dashboardData?.payment_reminders || [];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <TenantSidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full">
        <main className="p-8 lg:p-12 max-w-7xl mx-auto w-full">
          {/* Page Header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-indigo-600 font-bold uppercase tracking-widest mb-1">
                {getGreeting()}
              </p>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {user?.full_name || "Welcome back"}
              </h2>
              <p className="text-[15px] text-slate-500 mt-1 font-medium">
                Here's what's happening with your stay today.
              </p>
            </div>
            {pendingPayments.length > 0 && (
              <div className="flex items-center self-start gap-2.5 bg-red-50 border border-red-100/50 text-red-600 px-5 py-3.5 rounded-[1rem] text-[13px] font-bold shadow-sm tracking-widest uppercase">
                <Bell className="w-4 h-4 animate-bounce" />
                {pendingPayments.length} rent payment{pendingPayments.length > 1 ? "s" : ""} due
              </div>
            )}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column — 2/3 */}
            <div className="xl:col-span-2 space-y-8">
              <UpcomingVisitCard visit={dashboardData?.upcoming_visit} />
              <CurrentBookingCard booking={dashboardData?.current_booking} />
              <SuggestedRoomsSection rooms={dashboardData?.suggested_rooms || []} />
            </div>

            {/* Right Sidebar — 1/3 */}
            <div className="space-y-8">
              <PaymentRemindersCard payments={pendingPayments} />
              <RecentChatsCard chats={recentChats} user={user} navigate={navigate} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Upcoming Visit ─────────────────────────────────────── */
function UpcomingVisitCard({ visit }) {
  const navigate = useNavigate();

  const CardShell = ({ children }) => (
    <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      {children}
    </div>
  );

  if (!visit) {
    return (
      <CardShell>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Upcoming Visit</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-1">
            <Calendar className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-[15px] font-bold text-slate-500">No upcoming visits scheduled</p>
          <p className="text-[13px] text-slate-400 font-medium tracking-wide">Book a visit to view a room</p>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Upcoming Visit</h2>
        </div>
        <Link to="/tenant/visits" className="text-[13px] text-indigo-600 font-bold hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
        {/* Date pill */}
        <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3 text-center min-w-[76px] flex-shrink-0">
          <div className="text-2xl font-bold text-indigo-600 leading-none mb-1">
            {new Date(visit.visit_date).getDate()}
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {new Date(visit.visit_date).toLocaleDateString("en-US", { month: "short" })}
          </div>
          <div className="text-[11px] text-indigo-500 font-bold tracking-widest mt-1.5 bg-indigo-50/80 border border-indigo-100/50 rounded-md py-0.5">
            {visit.visit_time?.slice(0, 5)}
          </div>
        </div>

        <div className="flex-1 w-full text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={`https://ui-avatars.com/api/?name=${visit.owner?.full_name || "Owner"}&background=e0e7ff&color=4f46e5&bold=true`}
              className="w-12 h-12 rounded-full ring-4 ring-white shadow-sm"
              alt={visit.owner?.full_name}
            />
            <div>
              <p className="text-[15px] font-bold text-slate-900 mb-1">
                Meeting with {visit.owner?.full_name}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[13px] font-medium text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[200px] sm:max-w-none">Viewing at {visit.room?.location}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={async () => {
            try {
              await chatService.startConversation(visit.owner.id);
              navigate(ROUTES.CHAT);
            } catch (err) {
              alert("Could not start chat. Please try again.");
            }
          }}
          className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 shadow-sm text-slate-700 rounded-xl hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 transition-all text-[13px] font-bold flex-shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          Message
        </button>
      </div>
    </CardShell>
  );
}

/* ─── Current Booking ────────────────────────────────────── */
function CurrentBookingCard({ booking }) {
  const navigate = useNavigate();

  const CardShell = ({ children }) => (
    <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      {children}
    </div>
  );

  if (!booking) {
    return (
      <CardShell>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Home className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Current Booking</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-1">
            <Home className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-[15px] font-bold text-slate-500">No active booking</p>
          <p className="text-[13px] text-slate-400 font-medium tracking-wide">Search rooms to find your next stay</p>
        </div>
      </CardShell>
    );
  }

  const startDate = new Date(booking.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const endDate = new Date(booking.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const statusStyles = {
    Active: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    Confirmed: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    Approved: "bg-blue-50 text-blue-600 border-blue-200/60",
    Pending: "bg-amber-50 text-amber-600 border-amber-200/60",
  };

  return (
    <CardShell>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Home className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Current Booking</h2>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${statusStyles[booking.status] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
          {booking.status}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
        <div className="flex-1 w-full text-center sm:text-left">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
            {booking.room?.title || "Room"}
          </h3>
          <div className="inline-flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-[13px] font-medium text-slate-600 mb-5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{startDate} — {endDate}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={`https://ui-avatars.com/api/?name=${booking.room?.owner?.full_name || "Unknown"}&background=f1f5f9&color=64748b&bold=true`}
                className="w-8 h-8 rounded-full border border-slate-200"
                alt="Owner Avatar" 
              />
              <p className="text-[13px] text-slate-500 font-medium">
                Owner: <span className="font-bold text-slate-800 ml-0.5">{booking.room?.owner?.full_name || "Unknown"}</span>
              </p>
            </div>

            {(booking.status === "Active" || booking.status === "Approved" || booking.status === "Confirmed") && booking.room?.owner?.id && (
              <button
                onClick={async () => {
                  try {
                    await chatService.startConversation(booking.room.owner.id);
                    navigate(ROUTES.CHAT);
                  } catch (err) {
                    alert("Could not start chat. Please try again.");
                  }
                }}
                className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100/50"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Contact
              </button>
            )}
          </div>
        </div>

        <div className="sm:text-right flex-shrink-0 w-full sm:w-auto p-5 sm:p-0 bg-white sm:bg-transparent rounded-xl border border-slate-100 sm:border-transparent mt-4 sm:mt-0 text-center sm:text-right">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Rent</p>
          <div className="flex items-baseline justify-center sm:justify-end gap-1">
             <span className="text-[15px] font-bold text-slate-400">NPR</span>
             <p className="text-[34px] font-bold text-slate-900 tracking-tighter leading-none">
               {parseFloat(booking.monthly_rent).toLocaleString()}
             </p>
          </div>
          <p className="text-[11px] font-bold text-emerald-600/70 mt-1 uppercase tracking-wider">Due every month</p>
        </div>
      </div>
    </CardShell>
  );
}

/* ─── Helper ─────────────────────────────────────────────── */
function getDaysLeft(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

/* ─── Payment Reminders ──────────────────────────────────── */
function PaymentRemindersCard({ payments }) {
  const handleEsewaPayment = async (payment) => {
    try {
      const params = await paymentService.getEsewaParams(payment.id);

      // Force the redirect to the current domain + path to prevent environment mismatches
      params.success_url = `${window.location.origin}/tenant/payments`;
      params.failure_url = `${window.location.origin}/tenant/payments`;

      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", params.esewa_url);
      const fields = [
        "amount",
        "tax_amount",
        "total_amount",
        "transaction_uuid",
        "product_code",
        "product_service_charge",
        "product_delivery_charge",
        "success_url",
        "failure_url",
        "signed_field_names",
        "signature",
      ];
      fields.forEach((key) => {
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("name", key);
        input.setAttribute("value", params[key]);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      alert("Failed to initiate payment. Please try again.");
    }
  };

  const handleKhaltiPayment = async (payment) => {
    try {
      const { paymentService: ps } = await import("../services/tenantService");
      const returnUrl = `${window.location.origin}/tenant/payments`;
      const response = await ps.initiateKhaltiPayment(payment.id, returnUrl);
      if (response.payment_url) window.location.href = response.payment_url;
      else throw new Error("Payment URL not received");
    } catch (error) {
      alert("Failed to initiate Khalti payment. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Rent Due Soon</h3>
        </div>
        {payments.length > 0 && (
          <span className="text-[11px] bg-red-50 text-red-600 border border-red-200/60 font-bold px-2.5 py-1 rounded-lg tracking-wider uppercase">
            {payments.length} pending
          </span>
        )}
      </div>

      <div className="p-6">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2 text-gray-400">
            <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-500">All caught up!</p>
            <p className="text-xs">No rent due this week</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => {
              const daysLeft = getDaysLeft(payment.due_date);
              const isOverdue = payment.status === "Overdue" || daysLeft < 0;
              let badgeClass, labelText;
              if (isOverdue) {
                badgeClass = "bg-red-50 text-red-500 border border-red-100";
                labelText = `${Math.abs(daysLeft)}d overdue`;
              } else if (daysLeft === 0) {
                badgeClass = "bg-red-50 text-red-500 border border-red-100";
                labelText = "Due today!";
              } else if (daysLeft === 1) {
                badgeClass =
                  "bg-orange-50 text-orange-500 border border-orange-100";
                labelText = "Due tomorrow";
              } else if (daysLeft <= 3) {
                badgeClass =
                  "bg-orange-50 text-orange-400 border border-orange-100";
                labelText = `${daysLeft}d left`;
              } else {
                badgeClass =
                  "bg-yellow-50 text-yellow-600 border border-yellow-100";
                labelText = `${daysLeft}d left`;
              }

              const amountColor =
                isOverdue || daysLeft <= 0 ? "text-red-500" : "text-gray-900";
              const dueDate = new Date(payment.due_date).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" },
              );

              return (
                <div
                  key={payment.id}
                  className="pb-4 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-gray-900">
                          {payment.payment_type === "Rent"
                            ? "Monthly Rent"
                            : payment.payment_type}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}
                        >
                          {labelText}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Due {dueDate}</p>
                    </div>
                    <p
                      className={`text-base font-bold ${amountColor} flex-shrink-0`}
                    >
                      NPR {parseFloat(payment.amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEsewaPayment(payment)}
                      className="flex-1 py-1.5 text-[11px] font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      Pay via eSewa
                    </button>
                    <button
                      onClick={() => handleKhaltiPayment(payment)}
                      className="flex-1 py-1.5 text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                    >
                      Pay via Khalti
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Recent Chats ───────────────────────────────────────── */
function RecentChatsCard({ chats, user, navigate }) {
  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
          <MessageCircle className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Recent Chats</h3>
      </div>

      <div className="p-6">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 gap-3">
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-1">
              <MessageCircle className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-[14px] font-bold text-slate-500">No recent chats</p>
            <p className="text-[12px] text-slate-400 font-medium tracking-wide">Messages will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="flex gap-4 p-3 rounded-[1rem] hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all"
                onClick={() => navigate(ROUTES.CHAT)}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                  {chat.other_user.full_name[0]}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-[14px] font-bold text-slate-900 truncate">
                    {chat.other_user.full_name}
                  </p>
                  <p className="text-[13px] text-slate-500 truncate mt-0.5 font-medium">
                    {chat.last_message
                      ? chat.last_message.text
                      : "Start a conversation..."}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right flex flex-col justify-center">
                   <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                     {new Date(chat.updated_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                   </p>
                </div>
              </div>
            ))}
            <button
              onClick={() => navigate(ROUTES.CHAT)}
              className="w-full text-center text-indigo-600 border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 py-2.5 rounded-xl text-[13px] font-bold mt-3 transition-colors flex items-center justify-center gap-1.5"
            >
              View All Chats <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Suggested Rooms ────────────────────────────────────── */
function SuggestedRoomsSection({ rooms }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Suggested Rooms</h2>
        </div>
        <Link
          to="/tenant/search"
          className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
        >
          See All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {!rooms || rooms.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          <p className="text-sm">No room suggestions available right now.</p>
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

/*Room Card */
function RoomCard({ room }) {
  const navigate = useNavigate();
  const imageUrl =
    room.images?.length > 0
      ? getMediaUrl(room.images[0].image)
      : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop";

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          alt={room.title}
        />
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-bold text-blue-600 bg-white/90 backdrop-blur px-2 py-1 rounded-lg uppercase tracking-wide shadow-sm">
            {room.room_type}
          </span>
        </div>
        <div className="absolute bottom-2 right-2">
          <span className="text-xs font-bold text-white bg-blue-600/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-sm">
            NPR {parseFloat(room.price).toLocaleString()}
          </span>
        </div>
        {room.status === "Occupied" && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-lg uppercase tracking-wider">
              Occupied
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1 group-hover:text-blue-600 transition">
          {room.title}
        </h3>
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{room.location}</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={10}
                fill={
                  i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "none"
                }
                color={
                  i <= Math.round(room.average_rating || 0)
                    ? "#FBBF24"
                    : "#D1D5DB"
                }
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-400 font-bold">
            {room.average_rating ? room.average_rating.toFixed(1) : "0.0"} (
            {room.review_count || 0})
          </span>
        </div>
        <button
          onClick={() => navigate(`/room/${room.id}`)}
          className="w-full py-2 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all flex items-center justify-center gap-1.5"
        >
          See Details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
