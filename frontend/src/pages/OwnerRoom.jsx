import React from 'react';
import OwnerSidebar from '../components/OwnerSidebar';
import { Home, Users, TrendingUp, Eye, Search, Grid, List, Edit, Trash2, X, Upload, Plus, MapPin, Star, ArrowRight, Navigation, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { roomService } from '../services/roomService';
import MapPicker from '../components/MapPicker';
import { getMediaUrl } from '../constants/api';

export default function OwnerRooms({ user, refreshUser, onLogout }) {
  const [rooms, setRooms] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(null);
  const [selectedRoom, setSelectedRoom] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('grid');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedImages, setSelectedImages] = React.useState([]);
  const [showMapSelector, setShowMapSelector] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: '', location: '', price: '', roomType: 'Single Room',
    floor: '', size: '', status: 'Available',
    preferredTenant: 'Any', genderPreference: 'Any',
    toiletType: 'Shared', kitchenAccess: false, furnished: false,
    wifi: false, parking: false, waterSupply: false,
    electricityBackup: 'None', availableFrom: '',
    cookingAllowed: false, smokingAllowed: false, drinkingAllowed: false,
    petsAllowed: false, visitorAllowed: false,
    latitude: '', longitude: '',
    description: '', amenities: '',
    ac: false, tv: false, cctv: false
  });

  const [statusModal, setStatusModal] = React.useState(null);
  const [loadingModal, setLoadingModal] = React.useState(false);

  const fetchRooms = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await roomService.getAllRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      alert('Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRooms();
    if (refreshUser) refreshUser();
  }, [fetchRooms, refreshUser]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this room?')) {
      try {
        await roomService.deleteRoom(id);
        setRooms(rooms.filter(r => r.id !== id));
      } catch (error) {
        alert('Failed to delete room. Please try again.');
      }
    }
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setFormData({
      title: room.title, location: room.location, price: room.price,
      roomType: room.room_type, floor: room.floor || '', size: room.size || '',
      status: room.status, preferredTenant: room.preferred_tenant || 'Any',
      genderPreference: room.gender_preference || 'Any', toiletType: room.toilet_type || 'Shared',
      kitchenAccess: room.kitchen_access, furnished: room.furnished, wifi: room.wifi,
      parking: room.parking, waterSupply: room.water_supply,
      electricityBackup: room.electricity_backup || 'None', availableFrom: room.available_from || '',
      cookingAllowed: room.cooking_allowed, smokingAllowed: room.smoking_allowed,
      drinkingAllowed: room.drinking_allowed, petsAllowed: room.pets_allowed,
      visitorAllowed: room.visitor_allowed, latitude: room.latitude || '',
      longitude: room.longitude || '', description: room.description || '',
      amenities: room.amenities || '', ac: room.ac || false, tv: room.tv || false, cctv: room.cctv || false
    });
    setShowModal('edit');
  };

  const handleImageSelect = (e) => setSelectedImages(Array.from(e.target.files));
  const openMapSelector = () => setShowMapSelector(true);
  const handleLocationSelect = (coords) => setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
  const handleAddressSelect = (address) => setFormData(prev => ({ ...prev, location: address }));

  const handleApplyLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationSelect({ lat: latitude, lng: longitude });
          // Open map to show where they are and fetch address
          openMapSelector();
        },
        (error) => alert("Could not access location: " + error.message),
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation not supported");
    }
  };

  const handleSubmit = async () => {
    if (!user?.is_identity_verified && user?.role !== 'Admin') {
      if (user?.identity_document) {
        alert('Verification Pending: Your identity document is under review.');
      } else {
        if (window.confirm('Identity Verification Required. Upload now?')) setShowModal('verify');
      }
      return;
    }
    if (!formData.title || !formData.location || !formData.price) { alert('Please fill required fields'); return; }
    try {
      const roomDataToSend = { ...formData, images: selectedImages };
      if (showModal === 'edit') {
        const updatedRoom = await roomService.updateRoom(selectedRoom.id, roomDataToSend);
        setRooms(rooms.map(r => r.id === selectedRoom.id ? updatedRoom : r));
      } else {
        const newRoom = await roomService.createRoom(roomDataToSend);
        setRooms([newRoom, ...rooms]);
      }
      setShowModal(null);
      setSelectedImages([]);
      setFormData({
        title: '', location: '', price: '', roomType: 'Single Room', floor: '', size: '', status: 'Available',
        preferredTenant: 'Any', genderPreference: 'Any', toiletType: 'Shared', kitchenAccess: false,
        furnished: false, wifi: false, parking: false, waterSupply: false, electricityBackup: 'None',
        availableFrom: '', cookingAllowed: false, smokingAllowed: false, drinkingAllowed: false,
        petsAllowed: false, visitorAllowed: false, latitude: '', longitude: '', description: '', amenities: '',
        ac: false, tv: false, cctv: false
      });
    } catch (error) {
      alert(error.message || 'Failed to save room. Please try again.');
    }
  };

  const filteredRooms = rooms
    .filter(r => filterStatus === 'all' || r.status.toLowerCase() === filterStatus)
    .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.location.toLowerCase().includes(searchTerm.toLowerCase()));

  const statusCounts = {
    all: rooms.length,
    available: rooms.filter(r => r.status === 'Available' || r.status === 'Pending Verification').length,
    occupied: rooms.filter(r => r.status === 'Occupied').length,
    disabled: rooms.filter(r => r.status === 'Disabled').length
  };

  const statusTabConfig = [
    { key: 'all', label: 'All', color: '#2563eb', bg: '#eff6ff' },
    { key: 'available', label: 'Available', color: '#16a34a', bg: '#f0fdf4' },
    { key: 'occupied', label: 'Occupied', color: '#ea580c', bg: '#fff7ed' },
    { key: 'disabled', label: 'Disabled', color: '#6b7280', bg: '#f9fafb' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <OwnerSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 font-medium text-sm">Loading your rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <OwnerSidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Stats Bar */}
        {rooms.length > 0 && (
          <div className="bg-white border-b border-gray-100 px-8 py-4 flex-shrink-0">
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Total Rooms', value: rooms.length, icon: <Home className="w-5 h-5" />, iconBg: '#eff6ff', iconColor: '#2563eb', valColor: '#111827' },
                { label: 'Available', value: statusCounts.available, icon: <TrendingUp className="w-5 h-5" />, iconBg: '#f0fdf4', iconColor: '#16a34a', valColor: '#16a34a' },
                { label: 'Occupied', value: statusCounts.occupied, icon: <Users className="w-5 h-5" />, iconBg: '#fff7ed', iconColor: '#ea580c', valColor: '#ea580c' },
                { label: 'Total Views', value: rooms.reduce((s, r) => s + (r.views || 0), 0), icon: <Eye className="w-5 h-5" />, iconBg: '#faf5ff', iconColor: '#9333ea', valColor: '#111827' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: stat.iconBg, color: stat.iconColor }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">{stat.label}</p>
                    <p className="text-2xl font-extrabold leading-tight" style={{ color: stat.valColor }}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto px-8 py-6">

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text" placeholder="Search rooms by name or location..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
              />
            </div>
            <div className="flex items-center gap-3">

              <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button onClick={() => setViewMode('grid')}
                  className={`px-3 py-2.5 transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                  <Grid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`px-3 py-2.5 transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => { if (!user?.identity_document && user?.role !== 'Admin') { setShowModal('verify'); } else { setShowModal('add'); } }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-blue-200 transition"
              >
                <Plus className="w-4 h-4" /> Add Room
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          {rooms.length > 0 && (
            <div className="flex gap-2 mb-6">
              {statusTabConfig.map(tab => (
                <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 capitalize"
                  style={filterStatus === tab.key
                    ? { background: tab.bg, color: tab.color, border: `1.5px solid ${tab.color}30` }
                    : { background: 'white', color: '#6b7280', border: '1.5px solid #e5e7eb' }
                  }>
                  {tab.label} <span className="ml-1 opacity-70">({statusCounts[tab.key]})</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Home className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-800 mb-2">No rooms listed yet</h3>
              <p className="text-gray-400 text-sm mb-8 max-w-xs">Start by adding your first property listing to attract tenants.</p>
              <button
                onClick={() => { if (!user?.identity_document && user?.role !== 'Admin') { setShowModal('verify'); } else { setShowModal('add'); } }}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-sm shadow-blue-200 hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Your First Room
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium text-sm">No rooms match your search</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-5' : 'space-y-4'}>
              {filteredRooms.map(room => (
                <div key={room.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={room.images && room.images.length > 0 ? getMediaUrl(room.images[0].image) : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500'}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={room.title}
                    />
                    {/* Status badge */}
                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-sm
                      ${room.status === 'Available' ? 'bg-green-500 text-white' :
                        room.status === 'Pending Verification' ? 'bg-amber-500 text-white' :
                        room.status === 'Rented' || room.status === 'Occupied' ? 'bg-orange-500 text-white' :
                        'bg-blue-500 text-white'}`}>
                      {room.status === 'Pending Verification' ? 'Pending' :
                       room.status === 'Available' ? 'Visible & Available' : room.status}
                    </span>
                    {/* Views badge */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] rounded-lg font-bold">
                      <Eye className="w-3 h-3" />{room.views || 0}
                    </div>
                    {/* Room type badge */}
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] rounded-lg font-bold uppercase tracking-wide">
                      {room.room_type}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{room.title}</h3>
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />{room.location}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={10}
                            fill={i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "none"}
                            color={i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "#D1D5DB"} />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {room.average_rating ? room.average_rating.toFixed(1) : '0.0'} ({room.review_count || 0})
                      </span>
                    </div>

                    {/* Amenity tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {room.wifi && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold">Wi-Fi</span>}
                      {room.kitchen_access && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[10px] font-bold">Kitchen</span>}
                      {room.furnished && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold">Furnished</span>}
                      {room.ac && <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded-md text-[10px] font-bold">AC</span>}
                      {room.tv && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold">TV</span>}
                      {room.parking && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[10px] font-bold">Parking</span>}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-4 pb-4 border-b border-gray-50">
                      <span className="text-xl font-extrabold text-blue-600">NPR {parseFloat(room.price).toLocaleString()}</span>
                      <span className="text-xs text-gray-400 font-medium">/month</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(room)}
                        className="flex-1 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => { setSelectedRoom(room); setShowModal('view'); }}
                        className="w-10 h-9 border-2 border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600 rounded-xl flex items-center justify-center transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(room.id)}
                        className="w-10 h-9 border-2 border-red-100 text-red-400 hover:border-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Modal */}
        {showModal === 'verify' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
              <button onClick={() => setShowModal(null)} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
              {/* Verification Modal Info/Status */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Identity Verification Required</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  To ensure safety and trust on StaySpot, all owners must verify their identity before listing rooms.
                </p>
              </div>

              {/* Success/Error Banners */}
              {statusModal && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                  statusModal.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {statusModal.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="text-sm font-bold">{statusModal.message}</span>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                const file = e.target.identity_document.files[0];
                if (!file) return setStatusModal({ type: 'error', message: 'Please select a file' });
                
                const fd = new FormData();
                fd.append('identity_document', file);
                setLoadingModal(true);
                setStatusModal(null);

                try {
                  const { apiRequest } = await import('../utils/api');
                  const { API_ENDPOINTS } = await import('../constants/api');
                  const response = await apiRequest(API_ENDPOINTS.UPDATE_PROFILE, { method: 'POST', body: fd });
                  
                  if (response.ok) {
                    setStatusModal({ type: 'success', message: 'Identity document uploaded! Admin review pending.' });
                    if (refreshUser) await refreshUser();
                    setTimeout(() => setShowModal(null), 2500);
                  } else {
                    const data = await response.json();
                    setStatusModal({ type: 'error', message: data.error || data.detail || `Upload failed with status ${response.status}` });
                  }
                } catch (err) { 
                  setStatusModal({ type: 'error', message: 'Upload failed: ' + err.message }); 
                } finally {
                  setLoadingModal(false);
                }
              }}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Citizenship or Valid ID Photo</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition text-center relative">
                    <input type="file" name="identity_document" accept="image/*" required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center">
                       <Upload className="w-6 h-6 text-gray-300 mb-2" />
                       <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Tap to browse files</p>
                       <p className="text-[10px] text-gray-300 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(null)}
                    className="flex-1 py-3 bg-gray-50 text-gray-400 font-bold rounded-xl hover:bg-gray-100 transition text-xs uppercase tracking-wider">
                    Cancel
                  </button>
                  <button type="submit" disabled={loadingModal}
                    className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-100 text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2">
                    {loadingModal ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : 'Upload & Verify'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && showModal !== 'view' && showModal !== 'verify' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">{showModal === 'add' ? 'Add New Listing' : 'Edit Room Details'}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Fill in the details to publish your property listing.</p>
                </div>
                <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-gray-50/40">
                <div className="grid grid-cols-2 gap-x-8 gap-y-8">

                  {/* Section 1 */}
                  <div className="space-y-5">
                    <SectionHeader num="1" title="Basic Information" />
                    <div className="space-y-4">
                      <FieldGroup label="Property Title *">
                        <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
                          placeholder="e.g. Spacious 2 BHK Apartment" required />
                      </FieldGroup>
                      <FieldGroup label="Exact Location *">
                        <div className="relative group">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                          <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl pl-10 pr-32 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
                            placeholder="Street, City, Area" required />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <button 
                              type="button"
                              onClick={handleApplyLiveLocation}
                              className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-700 transition shadow-sm"
                              title="Set current location"
                            >
                              <Navigation className="w-3 h-3" />
                              Live
                            </button>
                            <button 
                              type="button"
                              onClick={openMapSelector}
                              className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-gray-100 transition shadow-sm"
                            >
                              Map
                            </button>
                          </div>
                        </div>
                      </FieldGroup>
                      <FieldGroup label="Monthly Rent (NPR) *">
                        <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
                          placeholder="e.g. 15000" required />
                      </FieldGroup>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-5">
                    <SectionHeader num="2" title="Room Specifications" />
                    <div className="grid grid-cols-2 gap-4">
                      <FieldGroup label="Room Type">
                        <select value={formData.roomType} onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition">
                          <option>Single Room</option><option>Double Room</option><option>Shared Room</option>
                          <option>Family Room</option><option>Apartment</option>
                        </select>
                      </FieldGroup>
                      <FieldGroup label="Toilet Type">
                        <select value={formData.toiletType} onChange={(e) => setFormData({ ...formData, toiletType: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition">
                          <option value="Attached">Attached</option><option value="Shared">Shared</option>
                        </select>
                      </FieldGroup>
                      <FieldGroup label="Floor Level">
                        <input type="text" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" placeholder="e.g. 1st" />
                      </FieldGroup>
                      <FieldGroup label="Room Size">
                        <input type="text" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" placeholder="e.g. Medium" />
                      </FieldGroup>
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="space-y-5">
                    <SectionHeader num="3" title="Amenities & Preferences" />
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FieldGroup label="Preferred Tenant">
                          <select value={formData.preferredTenant} onChange={(e) => setFormData({ ...formData, preferredTenant: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none transition">
                            <option>Any</option><option>Students</option><option>Working Professionals</option><option>Family</option>
                          </select>
                        </FieldGroup>
                        <FieldGroup label="Gender Preference">
                          <select value={formData.genderPreference} onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none transition">
                            <option>Any</option><option>Male</option><option>Female</option>
                          </select>
                        </FieldGroup>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'wifi', label: 'Wi-Fi' }, { key: 'kitchenAccess', label: 'Kitchen' },
                          { key: 'furnished', label: 'Furnished' }, { key: 'ac', label: 'AC' },
                          { key: 'tv', label: 'TV' }, { key: 'cctv', label: 'CCTV' },
                          { key: 'parking', label: 'Parking' }, { key: 'waterSupply', label: 'Water' },
                        ].map(item => (
                          <label key={item.key}
                            className={`flex items-center justify-center gap-2 p-2.5 border rounded-xl cursor-pointer transition text-[11px] font-bold uppercase ${formData[item.key] ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                            <input type="checkbox" checked={formData[item.key]} onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })} className="hidden" />
                            {item.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="space-y-5">
                    <SectionHeader num="4" title="House Rules" />
                    <div className="grid grid-cols-2 gap-3">
                      <RuleCheckbox label="Cooking" checked={formData.cookingAllowed} onChange={(val) => setFormData({ ...formData, cookingAllowed: val })} />
                      <RuleCheckbox label="Smoking" checked={formData.smokingAllowed} onChange={(val) => setFormData({ ...formData, smokingAllowed: val })} />
                      <RuleCheckbox label="Drinking" checked={formData.drinkingAllowed} onChange={(val) => setFormData({ ...formData, drinkingAllowed: val })} />
                      <RuleCheckbox label="Pets" checked={formData.petsAllowed} onChange={(val) => setFormData({ ...formData, petsAllowed: val })} />
                      <RuleCheckbox label="Visitors" checked={formData.visitorAllowed} onChange={(val) => setFormData({ ...formData, visitorAllowed: val })} />
                    </div>
                  </div>

                  {/* Section 5 */}
                  <div className="col-span-2 pt-4 border-t border-gray-100 space-y-3">
                    <SectionHeader num="5" title="Detailed Description" />
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 min-h-[110px] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition text-sm resize-none"
                      placeholder="Describe your room, special conditions, or unique features..." required />
                  </div>

                  {/* Section 6 */}
                  <div className="col-span-2 grid grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Photos & Visuals</p>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                        <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-medium">Click to upload room photos</p>
                        <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                        {selectedImages.length > 0 && (
                          <p className="text-xs text-blue-600 mt-2 font-bold">{selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Map Placement</p>
                        <button 
                          type="button"
                          onClick={handleApplyLiveLocation}
                          className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition uppercase"
                        >
                          <Navigation className="w-3 h-3" /> Use Current Location
                        </button>
                      </div>
                      <button type="button" onClick={openMapSelector}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-white transition group bg-gray-50/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center group-hover:border-blue-100">
                             <MapPin className="text-blue-500" size={18} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-700">Set Map Location</p>
                            <p className="text-[10px] text-gray-400">
                              {formData.latitude ? `${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(formData.longitude).toFixed(4)}` : 'Click to pin on map'}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500 transition" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              <div className="px-8 py-4 border-t border-gray-100 bg-white flex gap-3">
                <button onClick={() => setShowModal(null)}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition border border-gray-100">
                  Discard
                </button>
                <button onClick={handleSubmit}
                  className="flex-[3] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-sm shadow-blue-200 hover:bg-blue-700 transition text-sm">
                  {showModal === 'add' ? '🚀 Publish Listing' : '✓ Update Room Info'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map Selector Modal */}
        {showMapSelector && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
              <div className="px-5 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Select Room Location</h3>
                <button onClick={() => setShowMapSelector(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <MapPicker 
                  onLocationSelect={handleLocationSelect}
                  onAddressSelect={handleAddressSelect}
                  initialLocation={formData.latitude ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) } : null} 
                />
                <div className="mt-5 flex justify-end">
                  <button onClick={() => setShowMapSelector(false)}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition text-sm">
                    Confirm Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showModal === 'view' && selectedRoom && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-extrabold text-gray-900">Room Details</h2>
                <button onClick={() => setShowModal(null)} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="aspect-video rounded-xl overflow-hidden mb-4 border border-gray-100">
                      <img
                        src={selectedRoom.images?.length > 0 ? getMediaUrl(selectedRoom.images[0].image) : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500'}
                        className="w-full h-full object-cover" alt={selectedRoom.title} />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2">
                        <MapPin size={14} className="text-blue-500" /> Location
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">{selectedRoom.location}</p>
                      {selectedRoom.latitude && (
                        <div className="h-28 rounded-lg overflow-hidden border">
                          <MapPicker readOnly={true}
                            initialLocation={{ lat: parseFloat(selectedRoom.latitude), lng: parseFloat(selectedRoom.longitude) }}
                            onLocationSelect={() => {}} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-lg font-extrabold text-gray-900">{selectedRoom.title}</h2>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase
                          ${selectedRoom.status === 'Available' ? 'bg-green-100 text-green-700' :
                            selectedRoom.status === 'Rented' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {selectedRoom.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Monthly Rent</p>
                          <p className="text-lg font-extrabold text-blue-600">NPR {parseFloat(selectedRoom.price).toLocaleString()}</p>
                        </div>
                        <div className="border-l pl-4">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Deposit</p>
                          <p className="text-lg font-extrabold text-gray-700">NPR {parseFloat(selectedRoom.deposit || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1.5">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Specifications</p>
                        {[['Type', selectedRoom.room_type], ['Floor', selectedRoom.floor || 'G'], ['Size', selectedRoom.size || 'N/A'], ['Toilet', selectedRoom.toilet_type]].map(([k, v]) => (
                          <p key={k} className="flex justify-between"><span className="text-gray-400">{k}</span><span className="font-bold text-gray-700">{v}</span></p>
                        ))}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1.5">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Preferences</p>
                        {[['Preferred', selectedRoom.preferred_tenant], ['Gender', selectedRoom.gender_preference], ['Available', selectedRoom.available_from || 'Now']].map(([k, v]) => (
                          <p key={k} className="flex justify-between"><span className="text-gray-400">{k}</span><span className="font-bold text-gray-700">{v}</span></p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700 mb-2">House Rules</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <RuleStatus label="Cooking" allowed={selectedRoom.cooking_allowed} />
                        <RuleStatus label="Smoking" allowed={selectedRoom.smoking_allowed} />
                        <RuleStatus label="Drinking" allowed={selectedRoom.drinking_allowed} />
                        <RuleStatus label="Pets" allowed={selectedRoom.pets_allowed} />
                        <RuleStatus label="Visitors" allowed={selectedRoom.visitor_allowed} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const SectionHeader = ({ num, title }) => (
  <div className="flex items-center gap-2.5 mb-1">
    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-[11px] font-extrabold flex-shrink-0">{num}</div>
    <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">{title}</h3>
  </div>
);

const FieldGroup = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);

const RuleStatus = ({ label, allowed }) => (
  <div className="flex items-center justify-between text-[10px] font-bold py-1.5 px-3 rounded-lg bg-gray-50 border border-gray-100 uppercase">
    <span className="text-gray-400">{label}</span>
    <span className={allowed ? 'text-green-600' : 'text-red-400'}>{allowed ? '✓ Yes' : '✗ No'}</span>
  </div>
);

const RuleCheckbox = ({ label, checked, onChange }) => (
  <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${checked ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
    <span className={`text-[11px] font-bold uppercase ${checked ? 'text-blue-700' : 'text-gray-500'}`}>{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
  </label>
);