import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerSidebar from '../components/OwnerSidebar';
import { Home, Users, TrendingUp, Eye, Search, Filter, Grid, List, Edit, Trash2, X, Upload, Plus, Bell, MapPin, Star, Calendar, DollarSign, LayoutGrid } from 'lucide-react';
import { roomService } from '../services/roomService';
import MapPicker from '../components/MapPicker';
import { ROUTES, getMediaUrl } from '../constants/api';
import OwnerHeader from '../components/OwnerHeader';
import Footer from '../components/Footer';

export default function OwnerRooms({ user, refreshUser, onLogout }) {
  const navigate = useNavigate();
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
    title: '', location: '', price: '', deposit: '', roomType: 'Single Room',
    floor: '', size: '', status: 'Pending Verification',
    preferredTenant: 'Any', genderPreference: 'Any',
    toiletType: 'Shared', kitchenAccess: false, furnished: false,
    wifi: false, parking: false, waterSupply: false,
    electricityBackup: 'None', availableFrom: '',
    cookingAllowed: false, smokingAllowed: false, drinkingAllowed: false,
    petsAllowed: false, visitorAllowed: false,
    latitude: '', longitude: ''
  });

  // Fetch rooms on component mount
  React.useEffect(() => {
    fetchRooms();
    if (refreshUser) refreshUser();
  }, []);

  const fetchRooms = async () => {
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
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this room?')) {
      try {
        await roomService.deleteRoom(id);
        setRooms(rooms.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('Failed to delete room. Please try again.');
      }
    }
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setFormData({
      title: room.title,
      location: room.location,
      price: room.price,
      deposit: room.deposit || '',
      roomType: room.room_type,
      floor: room.floor || '',
      size: room.size || '',
      status: room.status,
      preferredTenant: room.preferred_tenant || 'Any',
      genderPreference: room.gender_preference || 'Any',
      toiletType: room.toilet_type || 'Shared',
      kitchenAccess: room.kitchen_access,
      furnished: room.furnished,
      wifi: room.wifi,
      parking: room.parking,
      waterSupply: room.water_supply,
      electricityBackup: room.electricity_backup || 'None',
      availableFrom: room.available_from || '',
      cookingAllowed: room.cooking_allowed,
      smokingAllowed: room.smoking_allowed,
      drinkingAllowed: room.drinking_allowed,
      petsAllowed: room.pets_allowed,
      visitorAllowed: room.visitor_allowed,
      latitude: room.latitude || '',
      longitude: room.longitude || ''
    });
    setShowModal('edit');
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  const handleMapClick = () => {
    setShowMapSelector(true);
  };

  const handleLocationSelect = (coords) => {
    setFormData({
      ...formData,
      latitude: coords.lat,
      longitude: coords.lng
    });
  };

  const handleSubmit = async () => {
    if (!user?.is_identity_verified && user?.role !== 'Admin') {
      if (user?.identity_document) {
        alert('Verification Pending: Your identity document is under review by an administrator. You cannot publish until approved.');
      } else {
        if (window.confirm('Identity Verification Required. You must upload a document before listing a room. Upload now?')) {
          setShowModal('verify');
        }
      }
      return;
    }

    if (!formData.title || !formData.location || !formData.price) {
      alert('Please fill required fields');
      return;
    }

    try {
      const roomDataToSend = {
        ...formData,
        images: selectedImages,
      };

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
        title: '', location: '', price: '', deposit: '', roomType: 'Single Room',
        floor: '', size: '', status: 'Pending Verification',
        preferredTenant: 'Any', genderPreference: 'Any',
        toiletType: 'Shared', kitchenAccess: false, furnished: false,
        wifi: false, parking: false, waterSupply: false,
        electricityBackup: 'None', availableFrom: '',
        cookingAllowed: false, smokingAllowed: false, drinkingAllowed: false,
        petsAllowed: false, visitorAllowed: false,
        latitude: '', longitude: ''
      });
    } catch (error) {
      console.error('Error saving room:', error);
      alert(error.message || 'Failed to save room. Please try again.');
    }
  }

  const filteredRooms = rooms
    .filter(r => filterStatus === 'all' || r.status.toLowerCase() === filterStatus)
    .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.location.toLowerCase().includes(searchTerm.toLowerCase()));

  const statusCounts = {
    all: rooms.length,
    available: rooms.filter(r => r.status === 'Available' || r.status === 'Pending Verification').length,
    occupied: rooms.filter(r => r.status === 'Occupied').length,
    disabled: rooms.filter(r => r.status === 'Disabled').length
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <OwnerSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rooms...</p>
          </div>
          <Footer user={user} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <OwnerSidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Quick Stats */}
        {rooms.length > 0 && (
          <div className="bg-white border-b px-8 py-4">
            <div className="grid grid-cols-4 gap-6">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Rooms</p>
                  <p className="text-2xl font-bold">{rooms.length}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.available}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Occupied</p>
                  <p className="text-2xl font-bold text-orange-600">{statusCounts.occupied}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Views</p>
                  <p className="text-2xl font-bold">{rooms.reduce((s, r) => s + r.views, 0)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {/* Search Bar */}
          <div className="flex justify-between mb-6">
            <div className="flex-1 max-w-md relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search rooms..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border rounded-lg flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</button>
              <div className="flex border rounded-lg">
                <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Grid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  if (!user?.identity_document && user?.role !== 'Admin') {
                    setShowModal('verify');
                  } else {
                    setShowModal('add');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Room
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          {rooms.length > 0 && (
            <div className="flex gap-3 mb-6">
              {['all', 'available', 'occupied', 'disabled'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-lg capitalize ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} `}>
                  {s} ({statusCounts[s]})
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {rooms.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No rooms listed yet</h3>
              <p className="text-gray-500 mb-8">Start by adding your first property listing</p>
              <button
                onClick={() => {
                  if (!user?.identity_document && user?.role !== 'Admin') {
                    setShowModal('verify');
                  } else {
                    setShowModal('add');
                  }
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg"
              >
                Add Your First Room
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20"><p className="text-gray-500">No rooms found</p></div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredRooms.map(room => (
                <div key={room.id} className="bg-white rounded-xl border hover:shadow-lg transition">
                  <div className="relative">
                    <img
                      src={room.images && room.images.length > 0 ? getMediaUrl(room.images[0].image) : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500'}
                      className="w-full h-52 object-cover rounded-t-xl"
                      alt={room.title}
                    />
                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${(room.status === 'Available' || room.status === 'Pending Verification') ? 'bg-green-500 text-white' :
                      room.status === 'Rented' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                      } `}>{(room.status === 'Available' || room.status === 'Pending Verification') ? 'Available' : (room.status === 'Rented' ? 'Rented' : room.status)}</span>
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-[10px] rounded font-bold">
                      <Eye className="w-3 h-3 inline mr-1" />{room.views}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 truncate">{room.title}</h3>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{room.location}</p>
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={10} fill={i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "none"} color={i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "#D1D5DB"} />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {room.average_rating ? room.average_rating.toFixed(1) : '0.0'} ({room.review_count || 0})
                      </span>
                    </div>
                    <div className="flex gap-2 mb-4 text-[10px] font-bold flex-wrap">
                      {room.wifi && <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">Wi-Fi</span>}
                      {room.kitchen_access && <span className="px-2 py-1 bg-green-50 text-green-600 rounded">Kitchen</span>}
                      {room.furnished && <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded">Furnished</span>}
                    </div>
                    <div className="mb-4">
                      <span className="text-xl font-bold text-blue-600">NPR {parseFloat(room.price).toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-1">/month</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(room)} className="flex-1 py-2 border-2 border-blue-600 text-blue-600 rounded-lg flex items-center justify-center gap-1">
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button onClick={() => { setSelectedRoom(room); setShowModal('view'); }} className="px-3 py-2 border-2 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(room.id)} className="px-3 py-2 border-2 border-red-200 text-red-600 rounded-lg">
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setShowModal(null)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Identity Verification Required</h3>
                <p className="text-sm text-gray-500 mt-2">
                  To ensure safety and trust on StaySpot, all owners must verify their identity before listing rooms.
                </p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const file = e.target.identity_document.files[0];
                if (!file) return alert('Please select a file');

                const formData = new FormData();
                formData.append('identity_document', file);

                try {
                  const { apiRequest } = await import('../utils/api');
                  const { API_ENDPOINTS } = await import('../constants/api');

                  // Get CSRF token first if needed, though apiRequest handles headers usually
                  // Just need to make sure we're using the right endpoint
                  const response = await apiRequest(API_ENDPOINTS.UPDATE_PROFILE, {
                    method: 'POST',
                    body: formData
                  });

                  if (response.ok) {
                    alert('Identity document uploaded successfully! Admin verification is pending.');
                    if (refreshUser) await refreshUser();
                    setShowModal(null);
                  } else {
                    const data = await response.json();
                    alert(data.error || 'Upload failed');
                  }
                } catch (err) {
                  console.error(err);
                  alert('Upload failed: ' + err.message);
                }
              }}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Citizenship or Valid ID Photo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition cursor-pointer text-center">
                    <input
                      type="file"
                      name="identity_document"
                      accept="image/*"
                      required
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-400 mt-2">Supported formats: JPG, PNG</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                  >
                    Upload & Verify
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && showModal !== 'view' && showModal !== 'verify' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{showModal === 'add' ? 'Add New Listing' : 'Edit Room Details'}</h2>
                  <p className="text-sm text-gray-500">Aligning with house-renting standards for better visibility.</p>
                </div>
                <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                <div className="grid grid-cols-2 gap-x-8 gap-y-10">

                  {/* Section 1: Basic Information */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-[10px]">1</div>
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property Title *</label>
                        <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 outline-none transition"
                          placeholder="e.g. Spacious 2 BHK Apartment" required />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exact Location *</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-100 outline-none transition"
                            placeholder="Street, City, Area" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Rent *</label>
                          <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 outline-none transition"
                            placeholder="NPR" required />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Security Deposit *</label>
                          <input type="number" value={formData.deposit} onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 outline-none transition"
                            placeholder="NPR" required />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Room Details */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-[10px]">2</div>
                      Room Specifications
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Room Type</label>
                        <select value={formData.roomType} onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white outline-none transition">
                          <option>Single Room</option>
                          <option>Double Room</option>
                          <option>Shared Room</option>
                          <option>Family Room</option>
                          <option>Apartment</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Toilet Type</label>
                        <select value={formData.toiletType} onChange={(e) => setFormData({ ...formData, toiletType: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white outline-none transition">
                          <option value="Attached">Attached</option>
                          <option value="Shared">Shared</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Floor Level</label>
                        <input type="text" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none transition" placeholder="e.g. 1st, 2nd" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Room Size</label>
                        <input type="text" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none transition" placeholder="e.g. Medium" />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Amenities & Preferences */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-[10px]">3</div>
                      Amenities & Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preferred Tenant</label>
                          <select value={formData.preferredTenant} onChange={(e) => setFormData({ ...formData, preferredTenant: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white outline-none transition">
                            <option>Any</option>
                            <option>Students</option>
                            <option>Working Professionals</option>
                            <option>Family</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                          <select value={formData.genderPreference} onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white outline-none transition">
                            <option>Any</option>
                            <option>Male</option>
                            <option>Female</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition ${formData.wifi ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-500'}`}>
                          <input type="checkbox" checked={formData.wifi} onChange={(e) => setFormData({ ...formData, wifi: e.target.checked })} className="hidden" />
                          <span className="text-[10px] font-bold uppercase">Wi-Fi</span>
                        </label>
                        <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition ${formData.kitchenAccess ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-500'}`}>
                          <input type="checkbox" checked={formData.kitchenAccess} onChange={(e) => setFormData({ ...formData, kitchenAccess: e.target.checked })} className="hidden" />
                          <span className="text-[10px] font-bold uppercase">Kitchen</span>
                        </label>
                        <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition ${formData.furnished ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-500'}`}>
                          <input type="checkbox" checked={formData.furnished} onChange={(e) => setFormData({ ...formData, furnished: e.target.checked })} className="hidden" />
                          <span className="text-[10px] font-bold uppercase">Furnished</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: House Rules */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-[10px]">4</div>
                      House Rules
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <RuleCheckbox label="Cooking" checked={formData.cookingAllowed} onChange={(val) => setFormData({ ...formData, cookingAllowed: val })} />
                      <RuleCheckbox label="Smoking" checked={formData.smokingAllowed} onChange={(val) => setFormData({ ...formData, smokingAllowed: val })} />
                      <RuleCheckbox label="Drinking" checked={formData.drinkingAllowed} onChange={(val) => setFormData({ ...formData, drinkingAllowed: val })} />
                      <RuleCheckbox label="Pets" checked={formData.petsAllowed} onChange={(val) => setFormData({ ...formData, petsAllowed: val })} />
                      <RuleCheckbox label="Visitors" checked={formData.visitorAllowed} onChange={(val) => setFormData({ ...formData, visitorAllowed: val })} />
                    </div>
                  </div>

                  {/* Section 5: Media & Location */}
                  <div className="col-span-2 grid grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Photos & Visuals</h3>
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-white transition cursor-pointer relative">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Pick clear photos of the room</p>
                        <input type="file" multiple accept="image/*" onChange={handleImageSelect}
                          className="absolute inset-0 opacity-0 cursor-pointer" />
                        {selectedImages.length > 0 && (
                          <p className="text-xs text-blue-600 mt-2 font-bold">{selectedImages.length} images selected</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Map Placement</h3>
                      <button type="button" onClick={handleMapClick}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-blue-400 transition group">
                        <div className="flex items-center gap-3">
                          <MapPin className="text-blue-500" size={20} />
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-700">Set Map Location</p>
                            <p className="text-[10px] text-gray-500">Current: {formData.latitude ? `${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(formData.longitude).toFixed(4)}` : 'Not Set'}</p>
                          </div>
                        </div>
                        <Plus size={16} className="text-gray-300 group-hover:text-blue-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-white flex gap-3 sticky bottom-0">
                <button onClick={() => setShowModal(null)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition">
                  Discard Changes
                </button>
                <button onClick={handleSubmit} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition">
                  {showModal === 'add' ? 'Publish Listing' : 'Update Room Info'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map Selector Modal */}
        {showMapSelector && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">Select Room Location</h3>
                <button
                  onClick={() => setShowMapSelector(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <MapPicker
                  onLocationSelect={handleLocationSelect}
                  initialLocation={formData.latitude ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) } : null}
                />
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowMapSelector(false)}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
                  >
                    Confirm Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showModal === 'view' && selectedRoom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full">
              <div className="p-6 border-b flex justify-between">
                <h2 className="text-xl font-bold">Room Details</h2>
                <button onClick={() => setShowModal(null)}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-8">
                  {/* Left: Images & Location */}
                  <div>
                    <div className="aspect-video rounded-xl overflow-hidden mb-4 border border-gray-100">
                      <img
                        src={selectedRoom.images && selectedRoom.images.length > 0
                          ? getMediaUrl(selectedRoom.images[0].image)
                          : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500'}
                        className="w-full h-full object-cover"
                        alt={selectedRoom.title}
                      />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600" /> Location Details
                      </h3>
                      <p className="text-xs text-gray-600 mb-4">{selectedRoom.location}</p>
                      {selectedRoom.latitude && (
                        <div className="h-32 rounded-lg overflow-hidden border">
                          <MapPicker
                            readOnly={true}
                            initialLocation={{ lat: parseFloat(selectedRoom.latitude), lng: parseFloat(selectedRoom.longitude) }}
                            onLocationSelect={() => { }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Info Sections */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-bold text-gray-900">{selectedRoom.title}</h2>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${selectedRoom.status === 'Available' ? 'bg-green-100 text-green-700' :
                          selectedRoom.status === 'Rented' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                          {selectedRoom.status === 'Rented' ? 'Rented' : selectedRoom.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase">Monthly Rent</p>
                          <p className="text-lg font-bold text-blue-600">NPR {parseFloat(selectedRoom.price).toLocaleString()}</p>
                        </div>
                        <div className="border-l pl-4">
                          <p className="text-xs text-gray-400 font-bold uppercase">Security Deposit</p>
                          <p className="text-lg font-bold text-gray-700">NPR {parseFloat(selectedRoom.deposit || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Room Specifications</p>
                        <div className="space-y-1 text-xs">
                          <p className="flex justify-between"><span>Type:</span> <span className="font-bold">{selectedRoom.room_type}</span></p>
                          <p className="flex justify-between"><span>Floor:</span> <span className="font-bold">{selectedRoom.floor || 'G'}</span></p>
                          <p className="flex justify-between"><span>Size:</span> <span className="font-bold">{selectedRoom.size || 'N/A'}</span></p>
                          <p className="flex justify-between"><span>Toilet:</span> <span className="font-bold text-blue-600">{selectedRoom.toilet_type}</span></p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tenant Preferences</p>
                        <div className="space-y-1 text-xs">
                          <p className="flex justify-between"><span>Preferred:</span> <span className="font-bold text-green-600">{selectedRoom.preferred_tenant}</span></p>
                          <p className="flex justify-between"><span>Gender:</span> <span className="font-bold">{selectedRoom.gender_preference}</span></p>
                          <p className="flex justify-between"><span>Available:</span> <span className="font-bold">{selectedRoom.available_from || 'Now'}</span></p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 text-sm">House Rules</h3>
                      <div className="grid grid-cols-2 gap-2">
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
        <Footer user={user} />
      </div>
    </div>
  );
}

const RuleStatus = ({ label, allowed }) => (
  <div className="flex items-center justify-between text-[10px] font-bold py-1 border-b border-gray-50 last:border-0 uppercase">
    <span className="text-gray-500">{label}</span>
    <span className={allowed ? 'text-green-600' : 'text-red-500'}>
      {allowed ? 'Allowed' : 'Not Allowed'}
    </span>
  </div>
);

const RuleCheckbox = ({ label, checked, onChange }) => (
  <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${checked ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
    <span className={`text-[10px] font-bold uppercase ${checked ? 'text-blue-700' : 'text-gray-500'}`}>{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
  </label>
);