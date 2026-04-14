import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  MapPin,
  Star,
  ChevronDown,
  RotateCcw,
  ChevronRight,
  SlidersHorizontal,
  Wifi,
  Car,
  Droplets,
  UtensilsCrossed,
  Sofa,
  PawPrint,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Autocomplete } from "@react-google-maps/api";
import { useMapContext } from "../context/MapContext";
import TenantSidebar from "../components/TenantSidebar";
import RoomMap from "../components/RoomMap";
import { roomService } from "../services/roomService";
import { getMediaUrl } from "../constants/api";

const SearchRooms = ({ user }) => {
  useMapContext();
  const mapRef = useRef(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchCoords, setSearchCoords] = useState(null);
  const [searchInputValue, setSearchInputValue] = useState("");

  const [filters, setFilters] = useState({
    location: "",
    min_price: 0,
    max_price: 100000,
    gender_preference: "Any",
    room_type: "",
    distance: "",
    facilities: {
      wifi: false,
      parking: false,
      water_supply: false,
      kitchen_access: false,
      furnished: false,
    },
  });

  const onAutocompleteLoad = (instance) => {
    instance.setFields(["geometry", "formatted_address", "name"]);
    setAutocomplete(instance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) {
        const manualValue = searchInputValue;
        setFilters((prev) => ({ ...prev, location: manualValue }));
        setSearchCoords(null);
        return;
      }
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setSearchCoords({ lat, lng });

      // Extract just the city/town name for better database matching
      let cityName = "";
      if (place.address_components) {
        const locality = place.address_components.find((c) =>
          c.types.includes("locality"),
        );
        const sublocality = place.address_components.find((c) =>
          c.types.includes("sublocality"),
        );
        const admin2 = place.address_components.find((c) =>
          c.types.includes("administrative_area_level_2"),
        );
        cityName = (locality || sublocality || admin2)?.long_name || place.name;
      } else {
        cityName = place.name;
      }

      // If cityName contains commas (e.g. "Itahari, Nepal"), take only the first part
      // to improve the chance of matching rooms in the database with short location names.
      if (cityName && cityName.includes(",")) {
        cityName = cityName.split(",")[0].trim();
      }

      const fullName = place.formatted_address || place.name;
      setSearchInputValue(fullName);
      // Use extracted city name for filtering
      setFilters((prev) => ({ ...prev, location: cityName }));

      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(14);
      }
    }
  };

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      // Use 15km as default radius so selecting a city (e.g. "Itahari")
      // returns all rooms across the city, not just a 5km pinpoint.
      let radius = 15;
      if (filters.distance) {
        radius = filters.distance.includes("km")
          ? parseFloat(filters.distance)
          : parseFloat(filters.distance) / 1000;
      }
      const apiFilters = {
        // Always send location text search to help backend match by name as well
        location: filters.location,
        min_price: filters.min_price,
        max_price: filters.max_price,
        gender_preference:
          filters.gender_preference !== "Any" ? filters.gender_preference : "",
        room_type: filters.room_type,
        lat: searchCoords?.lat || "",
        lng: searchCoords?.lng || "",
        radius: searchCoords ? radius : "",
        ...Object.fromEntries(
          Object.entries(filters.facilities).map(([k, v]) => [
            k,
            v ? "true" : "",
          ]),
        ),
      };
      const data = await roomService.getAllRooms(apiFilters);
      setRooms(data);
      setError(null);
      if (searchCoords && mapRef.current) mapRef.current.panTo(searchCoords);
    } catch (err) {
      setError("Failed to load rooms.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    filters.location,
    filters.min_price,
    filters.max_price,
    filters.gender_preference,
    filters.room_type,
    filters.distance,
    filters.facilities,
    searchCoords,
  ]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleLocationInputChange = (e) => {
    const val = e.target.value;
    setSearchInputValue(val);
    // Sync filter immediately and clear coords for manual entries
    setFilters((prev) => ({ ...prev, location: val }));
    if (searchCoords) setSearchCoords(null);
  };

  const handleGeocode = useCallback(async (address) => {
    if (!window.google || !address) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        const coords = { lat: lat(), lng: lng() };
        setSearchCoords(coords);
        if (mapRef.current) {
          mapRef.current.panTo(coords);
          mapRef.current.setZoom(14);
        }
      }
    });
  }, []);

  const handleLocationKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!searchCoords && searchInputValue) {
        handleGeocode(searchInputValue);
      }
    }
  };

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const handleFacilityChange = (f) =>
    setFilters((prev) => ({
      ...prev,
      facilities: { ...prev.facilities, [f]: !prev.facilities[f] },
    }));

  const handleApplyFilters = () => {
    if (!searchCoords && filters.location) {
      handleGeocode(filters.location);
    }
  };

  const resetFilters = () => {
    setFilters({
      location: "",
      min_price: 0,
      max_price: 100000,
      gender_preference: "Any",
      room_type: "",
      distance: "",
      facilities: {
        wifi: false,
        parking: false,
        water_supply: false,
        kitchen_access: false,
        furnished: false,
      },
    });
    setSearchCoords(null);
    setSearchInputValue("");
  };

  const facilityOptions = [
    { key: "wifi", label: "WiFi", icon: <Wifi className="w-3.5 h-3.5" /> },
    { key: "parking", label: "Parking", icon: <Car className="w-3.5 h-3.5" /> },
    {
      key: "water_supply",
      label: "Water Supply",
      icon: <Droplets className="w-3.5 h-3.5" />,
    },
    {
      key: "kitchen_access",
      label: "Kitchen",
      icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
    },
    {
      key: "furnished",
      label: "Furnished",
      icon: <Sofa className="w-3.5 h-3.5" />,
    },
  ];

  const roomTypes = [
    "Single Room",
    "Double Room",
    "Shared Room",
    "Family Room",
    "Apartment",
  ];
  const distances = ["500m", "1km", "2km"];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <TenantSidebar user={user} />

      <div className="flex-1 flex flex-col overflow-auto">
        <main className="p-8 lg:p-12 space-y-8 max-w-[1600px] mx-auto w-full">
          {/* ─── Page Header ───────────────────────────── */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Search Rooms</h2>
              <p className="text-[15px] font-medium text-slate-500 mt-1">
                Find your perfect place to stay
              </p>
            </div>
            {!loading && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-widest shadow-sm">
                {rooms.length} rooms found
              </div>
            )}
          </div>

          {/* ─── Filter Card ────────────────────────────── */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Search Filters
                </h3>
                <p className="text-[13px] font-medium text-slate-500">Refine your results</p>
              </div>
            </div>

            {/* Row 1: Location | Price | Gender */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Location */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Location
                </label>
                <Autocomplete
                  onLoad={onAutocompleteLoad}
                  onPlaceChanged={onPlaceChanged}
                >
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search location..."
                      value={searchInputValue}
                      onChange={handleLocationInputChange}
                      onKeyDown={handleLocationKeyDown}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </Autocomplete>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Rent Range (NPR)
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 tracking-wider">MIN</span>
                    <input
                      type="number"
                      min="0"
                      value={filters.min_price}
                      onChange={(e) =>
                        handleFilterChange("min_price", Number(e.target.value))
                      }
                      className="w-full pl-10 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                  <span className="text-slate-300 font-bold">-</span>
                  <div className="relative flex-1">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 tracking-wider">MAX</span>
                    <input
                      type="number"
                      min="0"
                      value={filters.max_price}
                      onChange={(e) =>
                        handleFilterChange("max_price", Number(e.target.value))
                      }
                      className="w-full pl-11 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Gender Preference */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Gender Preference
                </label>
                <div className="flex gap-2">
                  {["Any", "Male", "Female"].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleFilterChange("gender_preference", g)}
                      className={`flex-1 py-3.5 rounded-xl text-[13px] font-bold border transition-all ${
                        filters.gender_preference === g
                          ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 mb-8" />

            {/* Row 2: Facilities */}
            <div className="mb-8">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Facilities
              </label>
              <div className="flex flex-wrap gap-2.5">
                {facilityOptions.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => handleFacilityChange(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-all select-none ${
                      filters.facilities[key]
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Room Type + Distance + Actions */}
            <div className="flex flex-wrap items-end justify-between gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <div className="flex flex-wrap gap-10">
                {/* Room Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Room Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roomTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          handleFilterChange(
                            "room_type",
                            filters.room_type === type ? "" : type,
                          )
                        }
                        className={`px-4 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${
                          filters.room_type === type
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-slate-50"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Search Radius
                  </label>
                  <div className="flex gap-2">
                    {distances.map((d) => (
                      <button
                        key={d}
                        onClick={() =>
                          handleFilterChange(
                            "distance",
                            filters.distance === d ? "" : d,
                          )
                        }
                        className={`px-5 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${
                          filters.distance === d
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-slate-50"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-6 py-3 text-[13px] font-bold text-slate-500 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm shadow-slate-200/50"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl shadow-[0_4px_14px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] transition-all"
                >
                  <Search className="w-4 h-4" /> Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* ─── Results + Map ─────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-6">
            {/* Room List — col 5 */}
            <div className="md:col-span-5 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Search Results
                </h3>
                <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-3 py-1.5 rounded-lg tracking-widest uppercase">
                  {rooms.length} found
                </span>
              </div>

              <div className="space-y-4 overflow-auto max-h-[700px] pr-2 rooms-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
                    <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[13px] font-bold tracking-wide uppercase">Finding rooms...</p>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="bg-white rounded-[1.5rem] border border-dashed border-slate-300 p-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-[15px] font-black text-slate-600 mb-1">
                      No rooms match your criteria
                    </p>
                    <p className="text-[13px] text-slate-400 font-medium">
                      Try adjusting your filters
                    </p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      navigate={navigate}
                      isSelected={selectedRoom?.id === room.id}
                      onClick={() => setSelectedRoom(room)}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Interactive Map
                </h3>
                <span className="text-[12px] text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-md">
                  Click a pin to explore
                </span>
              </div>
              <div
                className="rounded-[1.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-1 overflow-hidden"
                style={{ minHeight: "700px" }}
              >
                <RoomMap
                  rooms={rooms}
                  externalSelectedRoom={selectedRoom}
                  onRoomClick={setSelectedRoom}
                  searchCoords={searchCoords}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
                .rooms-scrollbar::-webkit-scrollbar { width: 6px; }
                .rooms-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .rooms-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
                .rooms-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
    </div>
  );
};

/* ─── Room Card Component ───────────────────────────────────── */
function RoomCard({ room, navigate, isSelected, onClick }) {
  const imageUrl = room.images?.[0]?.image
    ? getMediaUrl(room.images[0].image)
    : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop";

  const isOccupied = room.status === "Rented" || room.status === "Occupied";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group ${
        isSelected
          ? "border-[2px] border-indigo-500 shadow-[0_8px_30px_rgba(79,70,229,0.15)] ring-4 ring-indigo-50"
          : "border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md"
      }`}
    >
      <div className="flex gap-0 flex-col sm:flex-row">
        {/* Image */}
        <div className="relative sm:w-48 flex-shrink-0 overflow-hidden">
          <img
            src={imageUrl}
            alt={room.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
            style={{ minHeight: "180px" }}
          />
          {/* Room type badge */}
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-black text-slate-800 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
              {room.room_type || "Room"}
            </span>
          </div>
          {/* Occupied overlay */}
          {isOccupied && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
              <span className="text-[11px] font-black text-white bg-red-500/90 px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">
                {room.status}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-5 flex flex-col justify-between">
          <div>
            {/* Title + Price */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition line-clamp-2">
                {room.title}
              </h3>
              <div className="text-right flex-shrink-0 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                <span className="text-[12px] font-black text-slate-400 mr-1">NPR</span>
                <span className="text-indigo-600 font-black text-[17px] tracking-tight">
                  {parseFloat(room.price).toLocaleString()}
                </span>
                <span className="text-slate-400 text-[11px] font-bold block -mt-1 tracking-widest uppercase">/mo</span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-[13px] text-slate-500 mb-4 font-medium">
              <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <span className="truncate">{room.location}</span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={
                      i <= Math.round(room.average_rating || 0)
                        ? "#F59E0B"
                        : "none"
                    }
                    color={
                      i <= Math.round(room.average_rating || 0)
                        ? "#F59E0B"
                        : "#E2E8F0"
                    }
                  />
                ))}
              </div>
              <span className="text-[12px] text-slate-400 font-bold">
                {room.average_rating ? room.average_rating.toFixed(1) : "0.0"}
                <span className="text-slate-300 ml-1 font-medium">
                  ({room.review_count || 0} reviews)
                </span>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
               <img 
                 src={`https://ui-avatars.com/api/?name=${room.owner?.full_name || "Owner"}&background=f1f5f9&color=64748b&bold=true`}
                 className="w-6 h-6 rounded-full"
                 alt="Owner Avatar" 
               />
              <p className="text-[12px] font-medium text-slate-400">
                by{" "}
                <span className="font-bold text-slate-700">
                  {room.owner?.full_name?.split(' ')[0] || "Unknown"}
                </span>
              </p>
            </div>
            <Link
              to={`/room/${room.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 rounded-xl text-[12px] font-bold transition-all"
            >
              Details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchRooms;
