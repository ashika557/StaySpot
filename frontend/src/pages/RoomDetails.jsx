import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Wifi,
  Wind,
  Tv,
  Star,
  User,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  Loader,
  Utensils,
  Hospital,
  ShoppingBag,
  School,
  Navigation,
  Info,
  Cigarette,
  Dog,
  Users,
  Beer,
  UtensilsCrossed,
  Zap,
  Droplets,
  Car,
  Layout,
  ChefHat,
  MessageCircle,
  Route,
  Timer,
  AlertTriangle,
  Upload,
  X,
  CheckCircle,
  Clock,
  AlertCircle as AlertIcon
} from "lucide-react";
import {
  GoogleMap,
  Marker,
  Circle,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useMapContext } from "../context/MapContext";
import OwnerSidebar from "../components/OwnerSidebar";
import TenantSidebar from "../components/TenantSidebar";
import TenantHeader from "../components/TenantHeader";
import { roomService } from "../services/roomService";
import { bookingService } from "../services/bookingService";
import { visitService } from "../services/tenantService";
import { getMediaUrl, ROUTES } from "../constants/api";

const RoomDetails = ({ user }) => {
  const { id } = useParams(); // room ID from URL e.g. /rooms/42
  const navigate = useNavigate();
  const { isLoaded } = useMapContext(); // checks if Google Maps script is ready

  // room data
  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0); // which thumbnail is selected
  const [nearbyPlaces, setNearbyPlaces] = useState([]); // fetched from OpenStreetMap
  const [nearbyLoading, setNearbyLoading] = useState(false); // loading status for nearby places

  // directions data
  const [userLocation, setUserLocation] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: "", duration: "" });

  // booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");

  // visit modal
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitNote, setVisitNote] = useState("");
  const [canMessageOrReport, setCanMessageOrReport] = useState(false);

  // verification modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // allows the map instance to be panned programmatically
  const mapRef = useRef(null);

  const checkUserRelationship = React.useCallback(async () => {
    if (!user || user.role !== "Tenant" || !id) return;
    try {
      const [visits, bookings] = await Promise.all([
        visitService.getMyVisits(),
        bookingService.getAllBookings(),
      ]);

      const hasAcceptedVisit = visits.some(
        (v) => v.room?.id === parseInt(id) && v.status === "Scheduled",
      );
      const hasConfirmedBooking = bookings.some(
        (b) =>
          b.room?.id === parseInt(id) &&
          ["Confirmed", "Active", "Completed"].includes(b.status),
      );

      setCanMessageOrReport(hasAcceptedVisit || hasConfirmedBooking);
    } catch (error) {
      console.error("Error checking user relationship:", error);
    }
  }, [id, user]);

  // prevents double view-count in React 18 StrictMode (runs effects twice in dev)
  const viewTracked = useRef(false);

  // Get user's current location for directions
  useEffect(() => {
    if (navigator.geolocation && isLoaded) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => console.log("Current location not available for directions"),
        { enableHighAccuracy: true },
      );
    }
  }, [isLoaded]);

  // Calculate directions when room and user location are both available
  useEffect(() => {
    if (room?.latitude && userLocation && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: userLocation,
          destination: {
            lat: parseFloat(room.latitude),
            lng: parseFloat(room.longitude),
          },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
            setRouteInfo({
              distance: result.routes[0].legs[0].distance.text,
              duration: result.routes[0].legs[0].duration.text,
            });
          }
        },
      );
    }
  }, [room, userLocation]);

  // ask OpenStreetMap what's within 2km of the room's coordinates
  const fetchCurrentlyNearbyPlaces = React.useCallback(async (lat, lng) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      setNearbyLoading(true);
      const query = `[out:json][timeout:15];(node["amenity"~"restaurant|cafe|hospital|school|university|pharmacy"](around:2000, ${lat}, ${lng});node["shop"~"supermarket|mall|bakery"](around:2000, ${lat}, ${lng}););out body 15;`;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Overpass API failed");

      const data = await response.json();
      clearTimeout(timeoutId);

      const places = (data.elements || [])
        .map((element) => ({
          id: element.id,
          name:
            element.tags.name || element.tags.description || "Nearby Amenity",
          lat: element.lat,
          lon: element.lon,
          type: element.tags.amenity || element.tags.shop || "unknown",
          address: element.tags["addr:street"]
            ? `${element.tags["addr:street"]}, ${element.tags["addr:city"] || ""}`
            : "Nearby Area",
          rating: (Math.random() * 2 + 3).toFixed(1),
        }))
        .filter((place) => place.name !== "Nearby Amenity");

      if (places.length === 0) {
        // Fallback to high-quality mock data if OSM is sparse in this area
        throw new Error("No places found in OSM, using fallback");
      }

      setNearbyPlaces(places);
    } catch (error) {
      console.warn("Falling back to local generated placemarks:", error);
      // Construct fallback places around the exact room coordinates
      const fallbackLat = parseFloat(lat);
      const fallbackLng = parseFloat(lng);
      setNearbyPlaces([
        {
          id: "fb-1",
          name: "City Center Cafe",
          address: "10 mins walking distance",
          type: "cafe",
          lat: fallbackLat + 0.004,
          lon: fallbackLng + 0.003,
          rating: "4.5",
        },
        {
          id: "fb-2",
          name: "General Health Clinic",
          address: "Main Healthcare Ave",
          type: "hospital",
          lat: fallbackLat - 0.005,
          lon: fallbackLng + 0.002,
          rating: "4.8",
        },
        {
          id: "fb-3",
          name: "FreshMart Supermarket",
          address: "Local Market Area",
          type: "supermarket",
          lat: fallbackLat + 0.002,
          lon: fallbackLng - 0.006,
          rating: "4.2",
        },
      ]);
    } finally {
      setNearbyLoading(false);
      clearTimeout(timeoutId);
    }
  }, []);

  const fetchRoomDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await roomService.getRoomById(id);
      setRoom(data);
      try {
        const reviewsData = await roomService.getRoomReviews(id);
        setReviews(reviewsData);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }

      // once we have coords, fetch what's nearby
      if (data.latitude && data.longitude) {
        fetchCurrentlyNearbyPlaces(data.latitude, data.longitude);
      }

      // only count a view if it hasn't been counted yet and the viewer isn't the owner
      if (!viewTracked.current && (!user || user.id !== data.owner?.id)) {
        viewTracked.current = true;
        roomService.incrementViews(id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load room details.");
    } finally {
      setLoading(false);
    }
  }, [id, user, fetchCurrentlyNearbyPlaces]);

  // re-fetch if user navigates to a different room without leaving the page
  useEffect(() => {
    viewTracked.current = false;
    fetchRoomDetails();
    if (id && user) {
      checkUserRelationship();
    }
  }, [id, user, fetchRoomDetails, checkUserRelationship]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user?.is_identity_verified && user?.role !== "Admin") {
      setShowBookingModal(false);
      setShowVerifyModal(true);
      return;
    }
    
    try {
      await bookingService.createBooking({
        room_id: room.id,
        start_date: bookingDate,
        end_date: bookingEndDate,
        monthly_rent: room.price,
      });
      alert("Booking request sent successfully!");
      setShowBookingModal(false);
    } catch (err) {
      console.error(err);
      const errorMessage = err.message || "Failed to book room";

      if (
        errorMessage.toLowerCase().includes("verification") ||
        errorMessage.toLowerCase().includes("identity")
      ) {
        setShowVerifyModal(true);
      } else {
        alert(errorMessage);
      }
    }
  };

  const handleVisitRequest = async (e) => {
    e.preventDefault();
    if (!user?.is_identity_verified && user?.role !== "Admin") {
      setShowVisitModal(false);
      setShowVerifyModal(true);
      return;
    }

    try {
      await visitService.createVisit({
        room_id: room.id,
        owner_id: room.owner.id,
        visit_date: visitDate,
        visit_time: visitTime,
        purpose: "Room Viewing",
        notes: visitNote,
      });
      alert("Visit request scheduled successfully!");
      setShowVisitModal(false);
      setVisitDate("");
      setVisitTime("");
      setVisitNote("");
    } catch (err) {
      console.error(err);
      const errorMessage = err.message || "Failed to schedule visit";

      if (
        errorMessage.toLowerCase().includes("verification") ||
        errorMessage.toLowerCase().includes("identity")
      ) {
        setShowVerifyModal(true);
      } else {
        alert(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500 font-bold">{error || "Room not found"}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // DB stores amenities as "wifi, tv, ac" — split into array for rendering
  const amenitiesList = room.amenities
    ? room.amenities
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a)
    : [];

  // boolean DB columns pushed into the same array so we only loop once
  if (room.wifi) amenitiesList.push("Free Wi-Fi");
  if (room.parking) amenitiesList.push("Parking");
  if (room.water_supply) amenitiesList.push("24/7 Water Supply");
  if (room.electricity_backup && room.electricity_backup !== "None")
    amenitiesList.push(`Backup: ${room.electricity_backup}`);
  if (room.furnished) amenitiesList.push("Furnished");
  if (room.kitchen_access) amenitiesList.push("Kitchen Access");

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* tenants get header + sidebar, owners just get sidebar */}
      {user?.role === "Tenant" ? (
        <>
          <TenantHeader user={user} />
          <div className="flex">
            <TenantSidebar user={user} />
            <main className="flex-1 p-8 ml-64 mt-16">{renderContent()}</main>
          </div>
        </>
      ) : (
        <div className="flex">
          <OwnerSidebar user={user} />
          <main className="flex-1 p-8 ml-64">{renderContent()}</main>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md m-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              Book {room.title}
            </h3>
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Move-in Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Move-out Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={bookingEndDate}
                  onChange={(e) => setBookingEndDate(e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md m-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              Schedule a Visit
            </h3>
            <form onSubmit={handleVisitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  required
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  value={visitNote}
                  onChange={(e) => setVisitNote(e.target.value)}
                  placeholder="Any specific questions or preferences..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Schedule Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            {user?.verification_status === "Pending" ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  Verification Pending
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  We are currently reviewing your identity document. Once approved, you will be able to book rooms or schedule visits.
                </p>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="mt-6 w-full py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    Identity Verification Required
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    To ensure safety and trust on StaySpot, you must verify
                    your identity before booking or visiting rooms.
                  </p>
                </div>

                {user?.verification_status === "Rejected" && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                    <AlertIcon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-bold text-rose-900 block">Verification Rejected</span>
                      <span className="text-xs text-rose-700 mt-1 block">Please upload a clearer image of your ID.</span>
                    </div>
                  </div>
                )}

                {statusModal && (
                  <div
                    className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                      statusModal.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-rose-50 text-rose-700 border border-rose-100"
                    }`}
                  >
                    {statusModal.type === "success" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertIcon className="w-5 h-5" />
                    )}
                    <span className="text-sm font-bold">
                      {statusModal.message}
                    </span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const file = e.target.identity_document.files[0];
                    if (!file)
                      return setStatusModal({
                        type: "error",
                        message: "Please select a file",
                      });

                    const fd = new FormData();
                    fd.append("identity_document", file);
                    setLoadingModal(true);
                    setStatusModal(null);

                    try {
                      const { apiRequest } = await import("../utils/api");
                      const { API_ENDPOINTS } = await import("../constants/api");
                      const response = await apiRequest(
                        API_ENDPOINTS.UPDATE_PROFILE,
                        { method: "POST", body: fd },
                      );

                      if (response.ok) {
                        setStatusModal({
                          type: "success",
                          message: "Identity document uploaded! Admin review pending.",
                        });
                        setTimeout(() => setShowVerifyModal(false), 2500);
                        // Refresh user data globally if possible, or trigger it via app context. 
                        // In RoomDetails we might need to rely on a reload or page refresh if no global refreshUser applies.
                      } else {
                        const data = await response.json();
                        setStatusModal({
                          type: "error",
                          message: data.error || data.detail || `Upload failed with status ${response.status}`,
                        });
                      }
                    } catch (err) {
                      setStatusModal({
                        type: "error",
                        message: "Upload failed: " + err.message,
                      });
                    } finally {
                      setLoadingModal(false);
                    }
                  }}
                >
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Citizenship or Valid ID Photo
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition text-center relative">
                      <input
                        type="file"
                        name="identity_document"
                        accept="image/*"
                        required
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-gray-300 mb-2" />
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                          Tap to browse files
                        </p>
                        <p className="text-[10px] text-gray-300 mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowVerifyModal(false)}
                      className="flex-1 py-3 bg-gray-50 text-gray-400 font-bold rounded-xl hover:bg-gray-100 transition text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loadingModal}
                      className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-100 text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loadingModal ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload & Verify"
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // extracted so both Owner and Tenant layouts can reuse the same content
  function renderContent() {
    return (
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors w-fit px-4 py-2 hover:bg-white rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - images, details, rules */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-gray-800">
              {/* big main image — changes when a thumbnail is clicked */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 relative group">
                <img
                  src={getMediaUrl(room.images[activeImageIndex]?.image)}
                  alt={room.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/800x600?text=Room+Image";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* thumbnails */}
              {room.images && room.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mt-2 px-2 pb-2">
                  {room.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === index ? "border-blue-600 ring-2 ring-blue-100" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img
                        src={getMediaUrl(img.image)}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title, Price & Specs */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${room.status === "Available" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}`}
                    >
                      {room.status}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-bold text-gray-900">
                        {room.average_rating > 0
                          ? Number(room.average_rating).toFixed(1)
                          : "New"}
                      </span>
                      <span className="text-gray-400 text-xs">
                        ({room.review_count || 0} reviews)
                      </span>
                    </div>
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                    {room.title}
                  </h1>
                  <p className="flex items-center gap-2 text-gray-500 font-medium">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {room.location}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-blue-600">
                    NPR {parseFloat(room.price).toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-sm font-medium">per month</p>
                </div>
              </div>

              <hr className="my-8 border-gray-100" />

              {/* quick spec cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">
                    Floor
                  </p>
                  <p className="font-bold text-gray-900">
                    {room.floor || "Not Specified"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">
                    Room Size
                  </p>
                  <p className="font-bold text-gray-900">
                    {room.size || "Medium"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">
                    Toilet Type
                  </p>
                  <p className="font-bold text-gray-900">
                    {room.toilet_type || "Shared"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">
                    Deposit
                  </p>
                  <p className="font-bold text-blue-600">
                    NPR {parseFloat(room.deposit || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Amenities — icons shown if keyword matches */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4 px-2">Amenities</h3>
                <div className="flex flex-wrap gap-3">
                  {amenitiesList.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl text-gray-700 font-bold text-sm border border-gray-100"
                    >
                      {amenity.toLowerCase().includes("wifi") && (
                        <Wifi className="w-4 h-4 text-blue-500" />
                      )}
                      {amenity.toLowerCase().includes("tv") && (
                        <Tv className="w-4 h-4 text-blue-500" />
                      )}
                      {amenity.toLowerCase().includes("ac") && (
                        <Wind className="w-4 h-4 text-blue-500" />
                      )}
                      {amenity.toLowerCase().includes("parking") && (
                        <Car className="w-4 h-4 text-blue-500" />
                      )}
                      {amenity.toLowerCase().includes("water") && (
                        <Droplets className="w-4 h-4 text-blue-500" />
                      )}
                      {(amenity.toLowerCase().includes("backup") ||
                        amenity.toLowerCase().includes("electricity")) && (
                        <Zap className="w-4 h-4 text-blue-500" />
                      )}
                      {amenity.toLowerCase().includes("furnished") && (
                        <Layout className="w-4 h-4 text-blue-500" />
                      )}
                      {amenity.toLowerCase().includes("kitchen") && (
                        <ChefHat className="w-4 h-4 text-blue-500" />
                      )}
                      <span>{amenity.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Description</h3>
              {/* whitespace-pre-line keeps the landlord's line breaks intact */}
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {room.description}
              </p>
            </div>

            {/* House Rules — green if allowed, red if not */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                House Rules & Policies
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    label: "Cooking",
                    key: "cooking_allowed",
                    Icon: UtensilsCrossed,
                  },
                  { label: "Smoking", key: "smoking_allowed", Icon: Cigarette },
                  { label: "Pets", key: "pets_allowed", Icon: Dog },
                  { label: "Visitors", key: "visitor_allowed", Icon: Users },
                  { label: "Drinking", key: "drinking_allowed", Icon: Beer },
                ].map(({ label, key, Icon }) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-4 rounded-2xl border ${room[key] ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 ${room[key] ? "text-green-600" : "text-red-600"}`}
                      />
                      <span
                        className={`font-bold text-sm ${room[key] ? "text-green-800" : "text-red-800"}`}
                      >
                        {label}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-black uppercase ${room[key] ? "text-green-600" : "text-red-600"}`}
                    >
                      {room[key] ? "Allowed" : "Not Allowed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  Real Tenant Reviews
                </h3>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="pb-6 border-b border-gray-50 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold overflow-hidden border border-gray-100">
                          {review.tenant?.profile_photo ? (
                            <img
                              src={getMediaUrl(review.tenant.profile_photo)}
                              alt="Reviewer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">
                            {review.tenant?.full_name || "Anonymous Tenant"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < review.rating ? "fill-current" : "text-gray-200"}`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed pl-14">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - action buttons + map */}
          <div className="space-y-6">
            {/* sticky action card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-xl">
                  {room.owner?.profile_photo ? (
                    <img
                      src={getMediaUrl(room.owner.profile_photo)}
                      alt={room.owner.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : room.owner?.full_name ? (
                    room.owner.full_name[0]
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                    Listed by
                  </p>
                  <p
                    className="font-bold text-gray-900 truncate"
                    title={room.owner?.full_name}
                  >
                    {room.owner?.full_name || "Room Owner"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* disabled if room is not available */}
                <button
                  onClick={() => {
                    if (!user?.is_identity_verified && user?.role !== "Admin") {
                      setShowVerifyModal(true);
                    } else {
                      setShowBookingModal(true);
                    }
                  }}
                  disabled={room.status !== "Available"}
                  className={`w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${room.status === "Available" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 active:scale-[0.98]" : "bg-gray-400 cursor-not-allowed shadow-gray-400/20"}`}
                >
                  <Calendar className="w-5 h-5" />
                  {room.status === "Available"
                    ? "Request to Book"
                    : `Currently ${room.status}`}
                </button>
                <button
                  onClick={() => {
                    if (!user?.is_identity_verified && user?.role !== "Admin") {
                      setShowVerifyModal(true);
                    } else {
                      setShowVisitModal(true);
                    }
                  }}
                  className="w-full py-4 bg-white text-gray-900 border-2 border-gray-100 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                  Schedule Visit
                </button>
                {canMessageOrReport && (
                  <>
                    {/* passes owner ID so chat opens with the right person */}
                    <button
                      onClick={() =>
                        room.owner?.id &&
                        navigate(`/chat?userId=${room.owner.id}`)
                      }
                      className="w-full py-4 bg-blue-50 text-blue-700 border-2 border-blue-100 font-bold rounded-2xl hover:bg-blue-100 hover:border-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Message Owner
                    </button>
                    <button
                      onClick={() =>
                        room.id &&
                        navigate("/complaints-reviews?roomId=" + room.id)
                      }
                      className="w-full py-4 bg-orange-50 text-orange-700 border-2 border-orange-100 font-bold rounded-2xl hover:bg-orange-100 Transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      Report Room Issue
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Map + nearby places list */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 px-2 tracking-tight">
                Location & Surroundings
              </h3>
              {room.latitude && isLoaded ? (
                <div className="space-y-4">
                  <div className="h-80 rounded-xl overflow-hidden border border-gray-100 relative z-0">
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      center={{
                        lat: parseFloat(room.latitude),
                        lng: parseFloat(room.longitude),
                      }}
                      zoom={14}
                      onLoad={(map) => {
                        mapRef.current = map; // Store map instance
                        setTimeout(() => {
                          map.panTo({
                            lat: parseFloat(room.latitude),
                            lng: parseFloat(room.longitude),
                          });
                          map.setZoom(14);
                        }, 100);
                      }}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        scrollwheel: false,
                        styles: [
                          {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }],
                          },
                        ],
                      }}
                    >
                      {/* 2km search radius ring */}
                      <Circle
                        center={{
                          lat: parseFloat(room.latitude),
                          lng: parseFloat(room.longitude),
                        }}
                        radius={2000}
                        options={{
                          fillColor: "#3B82F6",
                          fillOpacity: 0.15,
                          strokeColor: "#2563EB",
                          strokeOpacity: 0.5,
                          strokeWeight: 2,
                          clickable: false,
                        }}
                      />

                      {/* main room pin (default red) */}
                      <Marker
                        position={{
                          lat: parseFloat(room.latitude),
                          lng: parseFloat(room.longitude),
                        }}
                        title="Room Location"
                      />

                      {/* user position pin */}
                      {userLocation &&
                        (Math.abs(
                          userLocation.lat - parseFloat(room.latitude),
                        ) > 0.0001 ||
                          Math.abs(
                            userLocation.lng - parseFloat(room.longitude),
                          ) > 0.0001) && (
                          <Marker
                            position={userLocation}
                            icon={{
                              url: "https://maps.google.com/mapfiles/ms/icons/blue-pushpin.png",
                            }}
                          />
                        )}

                      {/* road route renderer */}
                      {directionsResponse && (
                        <DirectionsRenderer
                          directions={directionsResponse}
                          options={{
                            preserveViewport: true,
                            polylineOptions: {
                              strokeColor: "#2563eb",
                              strokeOpacity: 0.8,
                              strokeWeight: 6,
                            },
                            markerOptions: { visible: false },
                          }}
                        />
                      )}

                      {/* nearby place pins */}
                      {nearbyPlaces.map((place) => (
                        <Marker
                          key={place.id}
                          position={{ lat: place.lat, lng: place.lon }}
                          icon={{
                            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                          }}
                          title={place.name}
                        />
                      ))}
                    </GoogleMap>

                    {/* Floating Route Summary Overlay */}
                    {routeInfo.distance && (
                      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center justify-between animate-in slide-in-from-bottom duration-500 z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Route className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              Road Route
                            </p>
                            <h4 className="font-bold text-gray-900 text-xs">
                              From Current Location
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <Navigation className="w-3 h-3 text-blue-500" />
                              <span className="text-sm font-black text-blue-600">
                                {routeInfo.distance}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end mt-0.5">
                              <Timer className="w-3 h-3 text-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-600">
                                {routeInfo.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* list version of the map pins */}
                  <div className="mt-6 pt-6 border-t border-gray-50">
                    <h4 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-blue-500" />
                      Surroundings (Within 2KM)
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {nearbyPlaces.length > 0 ? (
                        nearbyPlaces.map((place) => (
                          <div
                            key={place.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300 group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:border-blue-100 transition-colors">
                              {place.type.includes("restaurant") ||
                              place.type.includes("food") ? (
                                <Utensils className="w-4 h-4 text-orange-500" />
                              ) : place.type.includes("hospital") ||
                                place.type.includes("health") ? (
                                <Hospital className="w-4 h-4 text-red-500" />
                              ) : place.type.includes("shopping") ? (
                                <ShoppingBag className="w-4 h-4 text-blue-500" />
                              ) : place.type.includes("school") ||
                                place.type.includes("university") ? (
                                <School className="w-4 h-4 text-indigo-500" />
                              ) : (
                                <MapPin className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h5 className="font-bold text-gray-900 text-xs truncate">
                                  {place.name}
                                </h5>
                                {place.rating && (
                                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    {place.rating}
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                {place.address}
                              </p>
                              <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter mt-1 block">
                                {place.type.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : nearbyLoading ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic animate-pulse">
                            Scanning surrounding hubs...
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                            No nearby places detected
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // shown if coords are missing or Google Maps hasn't loaded
                <div className="h-40 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200">
                  <MapPin className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Map data unavailable
                  </p>
                  <p className="text-[10px] opacity-60 mt-1">
                    Address: {room.location}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default RoomDetails;
