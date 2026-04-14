import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  ArrowRight,
  XCircle,
  MessageSquare,
  ExternalLink,
  BadgeCheck,
  Star,
  ChevronLeft,
  ChevronRight,
  Search,
  Home,
} from "lucide-react";
import TenantSidebar from "../components/TenantSidebar";
import { bookingService } from "../services/bookingService";
import { chatService } from "../services/chatService";
import { getMediaUrl, ROUTES } from "../constants/api";
import { useNavigate } from "react-router-dom";

const TenantBookings = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 8;

  const navigate = useNavigate();

  const fetchBookings = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error("Failed to grab bookings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;
    try {
      await bookingService.updateBookingStatus(id, "Cancelled");
      fetchBookings();
    } catch (err) {
      alert("Cancellation failed.");
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "All") return true;
    if (activeTab === "Upcoming")
      return ["Pending", "Confirmed", "Active"].includes(booking.status);
    if (activeTab === "Completed") return booking.status === "Completed";
    if (activeTab === "Cancelled")
      return ["Cancelled", "Rejected"].includes(booking.status);
    return true;
  });

  const stats = {
    all: bookings.length,
    upcoming: bookings.filter((b) =>
      ["Pending", "Confirmed", "Active"].includes(b.status),
    ).length,
    completed: bookings.filter((b) => b.status === "Completed").length,
    cancelled: bookings.filter((b) =>
      ["Cancelled", "Rejected"].includes(b.status),
    ).length,
  };

  const totalBookings = filteredBookings.length;
  const indexOfLast = currentPage * bookingsPerPage;
  const indexOfFirst = indexOfLast - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(totalBookings / bookingsPerPage);

  const getStatusStyles = (status) => {
    switch (status) {
      case "Confirmed":
      case "Active":
        return "bg-emerald-50 text-emerald-600 border-emerald-200/60";
      case "Pending":
        return "bg-amber-50 text-amber-600 border-amber-200/60";
      case "Cancelled":
      case "Rejected":
        return "bg-rose-50 text-rose-600 border-rose-200/60";
      case "Completed":
        return "bg-indigo-50 text-indigo-600 border-indigo-200/60";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200/60";
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <TenantSidebar user={user} />

      <div className="flex-1 flex flex-col overflow-auto">
        <div className="p-8 lg:p-12 max-w-[1600px] mx-auto w-full">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Bookings</h1>
              <p className="text-[15px] font-medium text-slate-500 mt-1">
                Manage your current and past room bookings
              </p>
            </div>
            {bookings.length > 0 && (
               <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-2">
                 <Home className="w-4 h-4" />
                 {bookings.length} TOTAL
               </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            {[
              {
                label: "TOTAL BOOKINGS",
                value: stats.all,
                icon: <Calendar />,
                iconBg: "bg-indigo-50 border-indigo-100",
                iconColor: "text-indigo-600",
              },
              {
                label: "UPCOMING",
                value: stats.upcoming,
                icon: <ArrowRight />,
                iconBg: "bg-amber-50 border-amber-100",
                iconColor: "text-amber-600",
              },
              {
                label: "COMPLETED",
                value: stats.completed,
                icon: <BadgeCheck />,
                iconBg: "bg-emerald-50 border-emerald-100",
                iconColor: "text-emerald-600",
              },
              {
                label: "CANCELLED",
                value: stats.cancelled,
                icon: <XCircle />,
                iconBg: "bg-slate-100 border-slate-200",
                iconColor: "text-slate-500",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm ${card.iconBg}`}
                  >
                    {React.cloneElement(card.icon, {
                      className: `w-5 h-5 ${card.iconColor}`,
                    })}
                  </div>
                  <div className="text-right">
                    <p className={`text-[32px] font-black leading-none tracking-tighter ${["TOTAL BOOKINGS", "CANCELLED"].includes(card.label) ? "text-slate-900" : card.iconColor}`}>
                      {card.value}
                    </p>
                  </div>
                </div>
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mt-auto border-t border-slate-100 pt-4">
                  {card.label}
                </p>
              </div>
            ))}
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Booking History
                </h2>
                <p className="text-[13px] font-medium text-slate-500 mt-1">
                  All your room bookings in one place
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/50 border border-slate-200 rounded-2xl p-1.5">
                {["All", "Upcoming", "Completed", "Cancelled"].map((t) => (
                   <button
                     key={t}
                     onClick={() => {
                        setActiveTab(t);
                        setCurrentPage(1);
                     }}
                     className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all whitespace-nowrap ${
                       activeTab === t
                         ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                         : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                     }`}
                   >
                     {t}
                   </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Room
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Location
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Owner
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Start Date
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      Price
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Status
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-24 text-center bg-slate-50/50">
                        <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                          <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-[13px] font-bold tracking-wide uppercase">
                            Loading bookings...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : currentBookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-24 text-center bg-slate-50/30">
                        <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-1">
                            <Search className="w-7 h-7 text-slate-300" />
                          </div>
                          <div className="text-center">
                            <p className="text-[15px] font-black text-slate-600 mb-1">
                              No bookings found
                            </p>
                            <p className="text-[13px] text-slate-400 font-medium">
                              Try a different filter or find a room
                            </p>
                          </div>
                          <button
                            onClick={() => navigate(ROUTES.TENANT_SEARCH)}
                            className="mt-2 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.3)] hover:-translate-y-0.5"
                          >
                            <Home className="w-4 h-4" /> Find a Room
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentBookings.map((booking) => {
                      const imageUrl =
                        booking.room.images?.length > 0
                          ? getMediaUrl(booking.room.images[0].image)
                          : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80";

                      const handleMessageOwner = async () => {
                        try {
                          await chatService.startConversation(
                            booking.room.owner.id,
                          );
                          navigate(ROUTES.CHAT);
                        } catch (error) {
                          console.error(error);
                        }
                      };

                      return (
                        <tr
                          key={booking.id}
                          className="hover:bg-slate-50/60 transition-colors group"
                        >
                          {/* Room */}
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <img
                                src={imageUrl}
                                alt={booking.room.title}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 group-hover:scale-105 transition-transform flex-shrink-0 shadow-sm"
                              />
                              <div>
                                <p className="text-[14px] font-bold text-slate-900 truncate max-w-[160px] group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate(`/room/${booking.room.id}`)}>
                                  {booking.room.title}
                                </p>
                                <p className="text-[11px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">
                                  #BK-{booking.id.toString().padStart(4, "0")}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-[13px] font-medium text-slate-600 truncate max-w-[130px]">
                                {booking.room.location}
                              </span>
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  booking.room.owner.profile_photo
                                    ? getMediaUrl(
                                        booking.room.owner.profile_photo,
                                      )
                                    : `https://ui-avatars.com/api/?name=${booking.room.owner.full_name}&background=f8fafc&color=64748b&bold=true`
                                }
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0 shadow-sm"
                                alt=""
                              />
                              <span className="text-[13px] font-bold text-slate-700 truncate max-w-[110px]">
                                {booking.room.owner.full_name?.split(' ')[0]}
                              </span>
                            </div>
                          </td>

                          {/* Start Date */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg w-fit">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-[12px] font-bold text-slate-600">
                                {new Date(booking.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-baseline justify-end gap-1">
                              <span className="text-[10px] font-bold text-slate-400">NPR</span>
                              <p className="text-[15px] font-black text-slate-900 tracking-tight">
                                {(
                                  booking.total_price || booking.room.price
                                ).toLocaleString()}
                              </p>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-5 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(booking.status)}`}
                            >
                              {booking.status === "Active"
                                ? "Confirmed"
                                : booking.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={handleMessageOwner}
                                className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-slate-200 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 transition-all shadow-sm"
                                title="Message Owner"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/room/${booking.room.id}`)
                                }
                                className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-slate-200 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 transition-all shadow-sm"
                                title="View Room"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>

                              {["Pending", "Confirmed", "Active"].includes(
                                booking.status,
                              ) && (
                                <button
                                  onClick={() =>
                                    handleCancelBooking(booking.id)
                                  }
                                  className="px-4 py-2 bg-white border border-rose-200 text-rose-500 rounded-[10px] text-[11px] font-bold tracking-wide uppercase hover:bg-rose-50 hover:shadow-sm transition-all"
                                >
                                  Cancel
                                </button>
                              )}

                              {booking.status === "Completed" && (
                                <button className="px-4 py-2 bg-slate-900 border border-slate-900 text-white rounded-[10px] text-[11px] font-bold tracking-wide uppercase shadow-[0_4px_14px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,23,42,0.4)] transition-all flex items-center gap-1.5">
                                  <Star className="w-3.5 h-3.5" /> Review
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                Showing{" "}
                <span className="text-slate-700">
                  {indexOfFirst + 1}
                </span>
                –
                <span className="text-slate-700">
                  {Math.min(indexOfLast, totalBookings)}
                </span>{" "}
                of{" "}
                <span className="text-slate-700">
                  {totalBookings}
                </span>{" "}
                records
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                     key={i}
                     onClick={() => setCurrentPage(i + 1)}
                     className={`w-9 h-9 rounded-xl text-[13px] font-bold transition-all shadow-sm ${
                       currentPage === i + 1
                         ? "bg-slate-900 text-white border-slate-900"
                         : "bg-white text-slate-500 border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
                     }`}
                   >
                     {i + 1}
                   </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantBookings;
