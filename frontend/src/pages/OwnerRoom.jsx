import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './sidebar';
import { Home, Users, TrendingUp, Eye, Search, Filter, Grid, List, Edit, Trash2, X, Upload, Plus, Bell, MapPin, Star, Calendar, DollarSign, LayoutGrid } from 'lucide-react';
import { roomService } from '../services/roomService';
import MapPicker from '../components/MapPicker';
import { ROUTES, getMediaUrl } from '../constants/api';
import OwnerHeader from '../components/OwnerHeader';

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
    title: '', location: '', price: '', roomNumber: '', roomType: 'Single Room',
    floor: '', size: '', status: 'Available', wifi: false, ac: false, tv: false,
    parking: false, waterSupply: false, attachedBathroom: false, cctv: false,
    kitchen: false, furniture: false,
    genderPreference: 'Any', latitude: '', longitude: ''
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
      roomNumber: room.room_number || '',
      roomType: room.room_type,
      floor: room.floor || '',
      size: room.size || '',
      status: room.status,
      wifi: room.wifi,
      ac: room.ac,
      tv: room.tv,
      parking: room.parking,
      waterSupply: room.water_supply,
      attachedBathroom: room.attached_bathroom,
      cctv: room.cctv,
      kitchen: room.kitchen,
      furniture: room.furniture,
      genderPreference: room.gender_preference || 'Any',
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
      const errorMsg = user?.identity_document
        ? 'Your identity document is pending verification by an administrator.'
        : 'You must provide an identity document (Citizenship/ID) in your Profile before adding a room.';
      alert(errorMsg);
      setShowModal(null);
      navigate(ROUTES.PROFILE);
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
        title: '', location: '', price: '', roomNumber: '', roomType: 'Single Room',
        floor: '', size: '', status: 'Available',
        wifi: false, ac: false, tv: false,
        parking: false, waterSupply: false, attachedBathroom: false,
        cctv: false, kitchen: false, furniture: false,
        genderPreference: 'Any', latitude: '', longitude: ''
      });
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Failed to save room. Please try again.');
    }
  };

  const filteredRooms = rooms
    .filter(r => filterStatus === 'all' || r.status.toLowerCase() === filterStatus)
    .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.location.toLowerCase().includes(searchTerm.toLowerCase()));

  const statusCounts = {
    all: rooms.length,
    available: rooms.filter(r => r.status === 'Available').length,
    occupied: rooms.filter(r => r.status === 'Occupied').length,
    disabled: rooms.filter(r => r.status === 'Disabled').length
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

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
                  if (!user?.is_identity_verified && user?.role !== 'Admin') {
                    alert(user?.identity_document ? 'Verification Pending: You will be redirected to your profile.' : 'Unverified: You must upload your ID in your profile first.');
                    navigate(ROUTES.PROFILE);
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
                  className={`px - 4 py - 2 rounded - lg capitalize ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} `}>
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
                  if (!user?.is_identity_verified && user?.role !== 'Admin') {
                    alert(user?.identity_document ? 'Verification Pending: You will be redirected to your profile.' : 'Unverified: You must upload your ID in your profile first.');
                    navigate(ROUTES.PROFILE);
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
                    <span className={`absolute top - 3 left - 3 px - 3 py - 1 rounded - full text - xs font - semibold ${room.status === 'Available' ? 'bg-green-500 text-white' :
                      room.status === 'Occupied' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                      } `}>{room.status === 'Occupied' ? 'Rented' : room.status}</span>
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      <Eye className="w-3 h-3 inline mr-1" />{room.views}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2">{room.title}</h3>
                    <p className="text-sm text-gray-500 mb-1"><MapPin className="w-4 h-4 inline mr-1" />{room.location}</p>
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
                    <div className="flex gap-2 mb-4 text-xs flex-wrap">
                      {room.wifi && <span className="px-2 py-1 bg-gray-100 rounded">Wi-Fi</span>}
                      {room.ac && <span className="px-2 py-1 bg-gray-100 rounded">AC</span>}
                      {room.tv && <span className="px-2 py-1 bg-gray-100 rounded">TV</span>}
                      {room.gender_preference && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">{room.gender_preference}</span>}
                    </div>
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-blue-600">₹{parseFloat(room.price).toLocaleString()}</span>
                      <span className="text-sm text-gray-500">/month</span>
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

        {/* Add/Edit Modal */}
        {showModal && showModal !== 'view' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold">{showModal === 'add' ? 'Add New Room' : 'Edit Room'}</h2>
                <button onClick={() => setShowModal(null)}><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Room Number</label>
                    <input type="text" value={formData.roomNumber} onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2.5" placeholder="101" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Room Type</label>
                    <select value={formData.roomType} onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2.5">
                      <option>Single Room</option>
                      <option>Double Room</option>
                      <option>Suite</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2.5" placeholder="Luxury Apartment" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Location *</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2.5" placeholder="Itahari, Tarahara" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Floor</label>
                    <input type="text" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2.5" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Size (sq ft)</label>
                    <input type="text" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2.5" placeholder="280" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price/month *</label>
                    <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2.5" placeholder="12000" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2.5">
                      <option>Available</option>
                      <option>Occupied</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Gender Preference</label>
                    <select value={formData.genderPreference} onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2.5">
                      <option>Any</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-4">Location on Map</h3>
                <div className="mb-6">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
                    <MapPin className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-4">Select the exact location of your room on map</p>
                    <button
                      type="button"
                      onClick={handleMapClick}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Open Map Selector
                    </button>
                    {(formData.latitude && formData.longitude) && (
                      <div className="mt-4">
                        <MapPicker
                          readOnly={true}
                          initialLocation={{ lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }}
                          onLocationSelect={() => { }}
                        />
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Location set: {formData.latitude}, {formData.longitude}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This helps tenants find your room easily and see nearby amenities
                  </p>
                </div>

                <h3 className="font-semibold text-lg mb-4">Photo Upload</h3>
                <div className="border-2 border-dashed rounded-lg p-8 text-center mb-6">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Click to upload photos</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full"
                  />
                  {selectedImages.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">{selectedImages.length} image(s) selected</p>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-4">Amenities</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={formData.wifi} onChange={(e) => setFormData({ ...formData, wifi: e.target.checked })} className="w-5 h-5" />
                    <span className="text-sm">Wi-Fi</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={formData.ac} onChange={(e) => setFormData({ ...formData, ac: e.target.checked })} className="w-5 h-5" />
                    <span className="text-sm">AC</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={formData.tv} onChange={(e) => setFormData({ ...formData, tv: e.target.checked })} className="w-5 h-5" />
                    <span className="text-sm">TV</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={formData.parking} onChange={(e) => setFormData({ ...formData, parking: e.target.checked })} className="w-5 h-5" />
                    <span className="text-sm">Parking</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={formData.waterSupply} onChange={(e) => setFormData({ ...formData, waterSupply: e.target.checked })} className="w-5 h-5" />
                    <span className="text-sm">Water Supply</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={formData.attachedBathroom} onChange={(e) => setFormData({ ...formData, attachedBathroom: e.target.checked })} className="w-5 h-5" />
                    <span className="text-sm">Attached Bath</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={formData.cctv} onChange={(e) => setFormData({ ...formData, cctv: e.target.checked })} className="w-5 h-5" />
                    <span className="text-sm">CCTV</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={formData.kitchen} onChange={(e) => setFormData({ ...formData, kitchen: e.target.checked })} className="w-5 h-5" />
                    <span className="text-sm">Kitchen</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={formData.furniture} onChange={(e) => setFormData({ ...formData, furniture: e.target.checked })} className="w-5 h-5" />
                    <span className="text-sm">Furniture</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleSubmit} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium">
                    {showModal === 'add' ? 'Add Room' : 'Save Changes'}
                  </button>
                  <button onClick={() => setShowModal(null)} className="px-6 py-3 border rounded-lg">Cancel</button>
                </div>
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
                {selectedRoom.images && selectedRoom.images.length > 0 ? (
                  <img src={getMediaUrl(selectedRoom.images[0].image)} className="w-full h-64 object-cover rounded-lg mb-6" alt={selectedRoom.title} />
                ) : (
                  <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500" className="w-full h-64 object-cover rounded-lg mb-6" alt="Room" />
                )}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Title:</span> <span className="font-medium">{selectedRoom.title}</span></p>
                      <p><span className="text-gray-500">Location:</span> <span className="font-medium">{selectedRoom.location}</span></p>
                      <p><span className="text-gray-500">Price:</span> <span className="font-medium">₹{parseFloat(selectedRoom.price).toLocaleString()}/month</span></p>
                      <p><span className="text-gray-500">Room Type:</span> <span className="font-medium">{selectedRoom.room_type}</span></p>
                      {selectedRoom.gender_preference && (
                        <p><span className="text-gray-500">Gender Preference:</span> <span className="font-medium">{selectedRoom.gender_preference}</span></p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Status</h3>
                    <span className={`px - 3 py - 1 rounded - full text - sm font - semibold ${selectedRoom.status === 'Available' ? 'bg-green-100 text-green-700' :
                      selectedRoom.status === 'Occupied' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      } `}>{selectedRoom.status === 'Occupied' ? 'Rented' : selectedRoom.status}</span>
                    {(selectedRoom.latitude && selectedRoom.longitude) && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2 text-sm">Map Location</h3>
                        <MapPicker
                          readOnly={true}
                          initialLocation={{ lat: parseFloat(selectedRoom.latitude), lng: parseFloat(selectedRoom.longitude) }}
                          onLocationSelect={() => { }}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Lat: {selectedRoom.latitude}, Lng: {selectedRoom.longitude}
                        </p>
                      </div>
                    )}
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