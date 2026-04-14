import React, { useState, useEffect } from "react";
import TenantSidebar from "../components/TenantSidebar";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  CalendarDays,
  Eye,
  ArrowRight,
  Home,
} from "lucide-react";
import { visitService } from "../services/tenantService";
import { Link } from "react-router-dom";
import { getMediaUrl } from "../constants/api";

export default function TenantVisits({ user }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const fetchVisits = React.useCallback(async () => {
    try {
      const data = await visitService.getAllVisits();
      const sorted = data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      setVisits(sorted);
    } catch (error) {
      console.error("Failed to fetch visits", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleCancel = async (visitId) => {
    if (!window.confirm("Are you sure you want to cancel this visit request?"))
      return;
    try {
      await visitService.updateVisitStatus(visitId, "Cancelled");
      setVisits(
        visits.map((v) =>
          v.id === visitId ? { ...v, status: "Cancelled" } : v,
        ),
      );
    } catch (error) {
      console.error("Failed to cancel visit", error);
      alert("Failed to cancel visit.");
    }
  };

  const filterTabs = [
    { label: "All", key: "All" },
    { label: "Pending", key: "Pending" },
    { label: "Scheduled", key: "Scheduled" },
    { label: "Completed", key: "Completed" },
    { label: "Cancelled", key: "Cancelled" },
    { label: "Rejected", key: "Rejected" },
  ];

  const getCount = (key) => {
    if (key === "All") return visits.length;
    return visits.filter(
      (v) =>
        v.status === key || (key === "Scheduled" && v.status === "Approved"),
    ).length;
  };

  const filteredVisits = visits.filter((v) => {
    if (filter === "All") return true;
    if (filter === "Scheduled")
      return v.status === "Scheduled" || v.status === "Approved";
    return v.status === filter;
  });

  const getStatusConfig = (status) => {
    switch (status) {
      case "Pending":
        return {
          pill: "bg-amber-50 text-amber-600 border border-amber-200/60",
          dot: "bg-amber-500",
          label: "Pending",
        };
      case "Approved":
      case "Scheduled":
        return {
          pill: "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
          dot: "bg-emerald-500",
          label: "Scheduled",
        };
      case "Rejected":
        return {
          pill: "bg-rose-50 text-rose-600 border border-rose-200/60",
          dot: "bg-rose-500",
          label: "Rejected",
        };
      case "Cancelled":
        return {
          pill: "bg-slate-100 text-slate-500 border border-slate-200",
          dot: "bg-slate-400",
          label: "Cancelled",
        };
      case "Completed":
        return {
          pill: "bg-indigo-50 text-indigo-600 border border-indigo-200/60",
          dot: "bg-indigo-500",
          label: "Completed",
        };
      default:
        return {
          pill: "bg-slate-100 text-slate-500 border border-slate-200",
          dot: "bg-slate-400",
          label: status,
        };
    }
  };

  const getDateBoxStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 border-amber-100 text-amber-700";
      case "Approved":
      case "Scheduled":
        return "bg-emerald-50 border-emerald-100 text-emerald-700";
      case "Completed":
        return "bg-indigo-50 border-indigo-100 text-indigo-700";
      case "Rejected":
        return "bg-rose-50 border-rose-100 text-rose-700";
      default:
        return "bg-slate-50 border-slate-200 text-slate-500";
    }
  };

  // Stat counts
  const pendingCount = visits.filter((v) => v.status === "Pending").length;
  const scheduledCount = visits.filter(
    (v) => v.status === "Scheduled" || v.status === "Approved",
  ).length;
  const completedCount = visits.filter((v) => v.status === "Completed").length;

  const statCards = [
    {
      label: "TOTAL VISITS",
      value: visits.length,
      icon: <CalendarDays className="w-5 h-5 text-indigo-600" />,
      iconBg: "bg-indigo-50 border-indigo-100",
      color: "text-slate-900",
    },
    {
      label: "PENDING",
      value: pendingCount,
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      iconBg: "bg-amber-50 border-amber-100",
      color: pendingCount > 0 ? "text-amber-600" : "text-slate-900",
    },
    {
      label: "SCHEDULED",
      value: scheduledCount,
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      iconBg: "bg-emerald-50 border-emerald-100",
      color: scheduledCount > 0 ? "text-emerald-600" : "text-slate-900",
    },
    {
      label: "COMPLETED",
      value: completedCount,
      icon: <Eye className="w-5 h-5 text-slate-500" />,
      iconBg: "bg-slate-100 border-slate-200",
      color: "text-slate-900",
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-auto font-sans">
      <TenantSidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <main className="p-8 lg:p-12 max-w-[1600px] mx-auto w-full">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">My Visits</h2>
              <p className="text-[15px] font-medium text-slate-500 mt-1">
                Track and manage your room visit requests
              </p>
            </div>
            {visits.length > 0 && (
               <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-2">
                 <Calendar className="w-4 h-4" />
                 {visits.length} TOTAL
               </div>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            {statCards.map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
              >
                <div className="flex items-center justify-between mb-4">
                   <div
                     className={`w-12 h-12 rounded-2xl border ${card.iconBg} flex items-center justify-center shadow-sm`}
                   >
                     {card.icon}
                   </div>
                   <div className="text-right">
                     <p className={`text-[32px] font-black leading-none tracking-tighter ${card.color}`}>
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

          {/* Visit Directory Panel */}
          <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden">
            {/* Panel Header with filter tabs */}
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Visit Directory
                </h3>
                <p className="text-[13px] font-medium text-slate-500 mt-1">
                  {filteredVisits.length} visit
                  {filteredVisits.length !== 1 ? "s" : ""} found
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/50 border border-slate-200 rounded-2xl p-1.5">
                {filterTabs.map((tab) => {
                  const count = getCount(tab.key);
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        filter === tab.key
                          ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                      }`}
                    >
                      {tab.label}
                      {count > 0 && tab.key !== "All" && (
                        <span
                          className={`flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] ${
                            filter === tab.key
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-300/50 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
                  <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[13px] font-bold tracking-wide uppercase">
                    Loading visits...
                  </p>
                </div>
              ) : filteredVisits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400 bg-slate-50/30">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-1">
                    <CalendarDays className="w-7 h-7 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-black text-slate-600 mb-1">
                      No visits found
                    </p>
                    <p className="text-[13px] text-slate-400 font-medium">
                      You haven't requested any room viewings yet
                    </p>
                  </div>
                  <Link
                    to="/tenant/search"
                    className="flex items-center gap-2 mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.3)] hover:-translate-y-0.5"
                  >
                    <Home className="w-4 h-4" /> Browse Rooms
                  </Link>
                </div>
              ) : (
                filteredVisits.map((visit) => {
                  const statusConfig = getStatusConfig(visit.status);
                  const roomImage =
                    visit.room.images?.length > 0
                      ? getMediaUrl(visit.room.images[0].image)
                      : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop";

                  return (
                    <div
                      key={visit.id}
                      className="px-8 py-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Room Image */}
                      <div className="w-full md:w-32 h-40 md:h-24 rounded-[1rem] overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
                        <img
                          src={roomImage}
                          alt={visit.room.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Room Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-black text-slate-900 text-lg leading-tight hover:text-indigo-600 transition-colors cursor-pointer">
                              {visit.room.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium mt-1">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span>{visit.room.location}</span>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest flex-shrink-0 ${statusConfig.pill}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                            />
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Date + Time */}
                        <div className="flex flex-wrap items-center gap-4">
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-bold ${getDateBoxStyle(visit.status)}`}
                          >
                            <Calendar className="w-4 h-4" />
                            {new Date(visit.visit_date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              },
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-bold border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {visit.visit_time?.slice(0, 5) || "TBD"}
                          </div>
                          {visit.purpose && (
                            <span className="text-[13px] text-slate-400 font-medium italic border-l border-slate-200 pl-4 py-1">
                              "{visit.purpose}"
                            </span>
                          )}
                        </div>

                        {/* Confirmed banner */}
                        {(visit.status === "Scheduled" ||
                          visit.status === "Approved") && (
                          <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[12px] font-bold px-4 py-2.5 rounded-xl w-fit shadow-sm">
                            <CheckCircle className="w-4 h-4" />
                            Visit confirmed! Please arrive on time.
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col md:flex-row md:items-center gap-3 flex-shrink-0 mt-4 md:mt-0">
                        <Link
                          to={`/room/${visit.room.id}`}
                          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 rounded-xl text-[13px] font-bold transition shadow-sm"
                        >
                          View Room <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        {(visit.status === "Pending" ||
                          visit.status === "Scheduled" ||
                          visit.status === "Approved") && (
                          <button
                            onClick={() => handleCancel(visit.id)}
                            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-[13px] font-bold transition shadow-sm"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {!loading && filteredVisits.length > 0 && (
              <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest text-center md:text-left">
                  Showing{" "}
                  <span className="text-slate-700">
                    {filteredVisits.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-slate-700">
                    {visits.length}
                  </span>{" "}
                  total visits
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
