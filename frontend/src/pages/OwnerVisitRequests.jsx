import React, { useState, useEffect } from "react";
import OwnerSidebar from "../components/OwnerSidebar";
import {
  Calendar,
  MapPin,
  CheckCircle,
  Search,
  CalendarDays,
  AlertCircle,
  Eye,
  Filter,
  BadgeCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { visitService } from "../services/tenantService";
import { getMediaUrl } from "../constants/api";
import TenantDetailsModal from "../components/TenantDetailsModal";

export default function OwnerVisitRequests({ user, onLogout }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All Requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const visitsPerPage = 8;

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchVisits = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await visitService.getAllVisits();
      const sorted = data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      setVisits(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleStatusUpdate = async (visitId, newStatus) => {
    try {
      if (!window.confirm(`Confirm status as ${newStatus}?`)) return;
      await visitService.updateVisitStatus(visitId, newStatus);
      setVisits(
        visits.map((v) => (v.id === visitId ? { ...v, status: newStatus } : v)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const filteredVisits = visits.filter((visit) => {
    const matchesFilter = filter === "All Requests" || visit.status === filter;
    const matchesSearch =
      visit.tenant.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      visit.room.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: visits.length,
    pending: visits.filter((v) => v.status === "Pending").length,
    scheduled: visits.filter(
      (v) => v.status === "Scheduled" || v.status === "Approved",
    ).length,
    completed: visits.filter((v) => v.status === "Completed").length,
  };

  const totalVisits = filteredVisits.length;
  const indexOfLastVisit = currentPage * visitsPerPage;
  const indexOfFirstVisit = indexOfLastVisit - visitsPerPage;
  const currentVisits = filteredVisits.slice(
    indexOfFirstVisit,
    indexOfLastVisit,
  );
  const totalPages = Math.ceil(totalVisits / visitsPerPage);

  const getStatusStyles = (status) => {
    switch (status) {
      case "Scheduled":
      case "Approved":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Pending":
        return "bg-amber-50 text-amber-500 border-amber-100";
      case "Completed":
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "Rejected":
        return "bg-rose-50 text-rose-500 border-rose-100";
      default:
        return "bg-gray-50 text-gray-400 border-gray-100";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <OwnerSidebar user={user} />

      <div className="flex-1 flex flex-col overflow-auto">
        <div className="p-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Visit Requests</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage room viewing requests from tenants
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Requests",
                value: stats.total,
                icon: <CalendarDays />,
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-600",
              },
              {
                label: "Pending",
                value: stats.pending,
                icon: <AlertCircle />,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
              },
              {
                label: "Scheduled",
                value: stats.scheduled,
                icon: <Calendar />,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
              },
              {
                label: "Completed",
                value: stats.completed,
                icon: <CheckCircle />,
                iconBg: "bg-gray-100",
                iconColor: "text-gray-500",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${card.iconBg}`}
                >
                  {React.cloneElement(card.icon, {
                    className: `w-4 h-4 ${card.iconColor}`,
                  })}
                </div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">
                  {card.label}
                </p>
                <h2 className="text-xl font-bold text-gray-900">
                  {card.value}
                </h2>
              </div>
            ))}
          </div>

          {/* Visit Requests Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  All Requests
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Review and manage tenant visit requests
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search visits..."
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all w-44"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Filter</span>
                </div>

                <select
                  className="appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {[
                    "All Requests",
                    "Pending",
                    "Scheduled",
                    "Completed",
                    "Rejected",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-50">
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Purpose & Notes
                    </th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs font-medium">
                            Loading requests...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : currentVisits.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <Search className="w-5 h-5 text-gray-300" />
                          </div>
                          <p className="text-sm font-medium text-gray-500">
                            No requests found
                          </p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentVisits.map((visit) => (
                      <tr
                        key={visit.id}
                        className="hover:bg-gray-50/60 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-gray-600">
                            {new Date(visit.visit_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {visit.visit_time?.slice(0, 5)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={
                                  visit.tenant.profile_photo
                                    ? getMediaUrl(visit.tenant.profile_photo)
                                    : `https://ui-avatars.com/api/?name=${visit.tenant.full_name}&background=f3f4f6&color=94a3b8&bold=true`
                                }
                                className="w-9 h-9 rounded-full object-cover border border-gray-100 group-hover:scale-105 transition-transform"
                                alt=""
                              />
                              {visit.tenant.is_identity_verified && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white border border-white">
                                  <BadgeCheck size={9} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {visit.tenant.full_name}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[140px] mt-0.5">
                                {visit.tenant.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                              {visit.room.title}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {visit.purpose || visit.notes ? (
                            <div className="flex flex-col gap-1.5">
                              {visit.purpose && (
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                  <span className="text-xs text-gray-500 font-medium truncate max-w-[160px]">
                                    {visit.purpose}
                                  </span>
                                </div>
                              )}
                              {visit.notes && (
                                <div
                                  className="text-[10px] text-gray-400 bg-gray-50 p-1.5 rounded-lg border border-gray-100 max-w-[180px] line-clamp-2"
                                  title={visit.notes}
                                >
                                  <span className="font-semibold text-gray-500">
                                    Note:
                                  </span>{" "}
                                  {visit.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getStatusStyles(visit.status)}`}
                          >
                            {visit.status === "Approved"
                              ? "Scheduled"
                              : visit.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {visit.status === "Pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(visit.id, "Scheduled")
                                  }
                                  className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-gray-700 transition-all flex items-center gap-1.5"
                                >
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />{" "}
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(visit.id, "Rejected")
                                  }
                                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-400 rounded-lg text-[10px] font-bold hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {(visit.status === "Scheduled" ||
                              visit.status === "Approved") && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(visit.id, "Completed")
                                }
                                className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-gray-700 transition-all flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3 h-3" /> Complete
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedTenant(visit.tenant);
                                setIsModalOpen(true);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
              <p className="text-xs text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {indexOfFirstVisit + 1}
                </span>
                –
                <span className="font-semibold text-gray-700">
                  {Math.min(indexOfLastVisit, totalVisits)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {totalVisits}
                </span>{" "}
                records
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                      currentPage === i + 1
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-400 border border-gray-100 hover:text-gray-700"
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
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TenantDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTenant(null);
        }}
        tenant={selectedTenant}
      />
    </div>
  );
}
