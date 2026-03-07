import React, { useState, useEffect, useRef } from 'react';
import { apiRequest, getCsrfToken } from '../utils/api';
import { API_ENDPOINTS, getMediaUrl } from '../constants/api';
import OwnerSidebar from '../components/OwnerSidebar';
import TenantSidebar from '../components/TenantSidebar';
import { User, Bell, Upload, Trash2, Calendar, MapPin, Map, Building2, Phone, Mail } from 'lucide-react';

function Profile({ user, onUpdateUser, refreshUser }) {
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        date_of_birth: user?.date_of_birth || '',
        address: user?.address || '',
        city: user?.city || '',
        province: user?.province || '',
        postal_code: user?.postal_code || ''
    });
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [csrfToken, setCsrfToken] = useState('');

    useEffect(() => {
        getCsrfToken().then(setCsrfToken);
        if (refreshUser) refreshUser();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfilePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image size must be less than 2MB' });
                return;
            }
            setProfilePhotoFile(file);
            setProfilePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const data = new FormData();
        data.append('full_name', formData.full_name);
        if (formData.phone) data.append('phone', formData.phone);
        if (formData.date_of_birth) data.append('date_of_birth', formData.date_of_birth);
        if (formData.address) data.append('address', formData.address);
        if (formData.city) data.append('city', formData.city);
        if (formData.province) data.append('province', formData.province);
        if (formData.postal_code) data.append('postal_code', formData.postal_code);

        if (profilePhotoFile) {
            data.append('profile_photo', profilePhotoFile);
        }

        try {
            const response = await apiRequest(
                API_ENDPOINTS.UPDATE_PROFILE,
                {
                    method: 'POST',
                    body: data,
                },
                csrfToken
            );

            const result = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                onUpdateUser(result.user);
                setProfilePhotoFile(null);
                setProfilePreview(null);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    const isOwner = user?.role === 'Owner' || user?.role === 'owner';
    const SidebarComponent = isOwner ? OwnerSidebar : TenantSidebar;

    const navTabs = [
        { id: 'personal', label: 'Personal Info', icon: User, active: true },
    ];

    const provinces = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <SidebarComponent user={user} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{isOwner ? 'Owner Profile' : 'Tenant Profile'}</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your account information and settings</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <img
                                src={user?.profile_photo ? getMediaUrl(user.profile_photo) : `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}&background=3b82f6&color=fff&bold=true`}
                                alt="User"
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                            <div className="hidden md:block text-sm">
                                <p className="font-semibold text-gray-900 leading-tight">{user?.full_name || 'User'}</p>
                                <p className="text-gray-500 text-xs">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {message.text && (
                            <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 transition-opacity ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {message.type === 'success' ? (
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                )}
                                <span className="font-medium">{message.text}</span>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            {/* Tabs */}
                            <div className="border-b border-gray-200 px-6 flex items-center gap-8">
                                {navTabs.map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${tab.active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    )
                                })}
                            </div>

                            <form onSubmit={handleSubmit} className="p-8">
                                {/* Profile Photo Upload */}
                                <div className="mb-10">
                                    <h3 className="text-base font-semibold text-gray-900 mb-6">Profile Photo</h3>
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <img
                                                src={profilePreview || (user?.profile_photo ? getMediaUrl(user.profile_photo) : `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}&background=f3f4f6&color=9ca3af&size=120`)}
                                                alt="Profile"
                                                className="w-24 h-24 rounded-full object-cover border border-gray-200/50 bg-gray-50"
                                            />
                                        </div>
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Upload New Photo
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/jpeg, image/png, image/gif"
                                                onChange={handleProfilePhotoChange}
                                            />
                                            <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Details */}
                                <div className="mb-10">
                                    <h3 className="text-base font-semibold text-gray-900 mb-6">Personal Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                disabled
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Phone Number</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none"
                                                placeholder="+977"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Date of Birth</label>
                                            <input
                                                type="date"
                                                name="date_of_birth"
                                                value={formData.date_of_birth}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none text-gray-700 uppercase"
                                                style={{ textTransform: 'uppercase' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="mb-10">
                                    <h3 className="text-base font-semibold text-gray-900 mb-6">Address</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-3">
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Address</label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Province</label>
                                            <select
                                                name="province"
                                                value={formData.province}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none bg-white text-gray-700"
                                            >
                                                <option value="">Select Province</option>
                                                {provinces.map(prov => (
                                                    <option key={prov} value={prov}>{prov}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Postal Code</label>
                                            <input
                                                type="text"
                                                name="postal_code"
                                                value={formData.postal_code}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-100 mt-8">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Delete Account Section */}
                        <div className="bg-red-50/50 rounded-xl border border-red-100 p-8">
                            <h3 className="text-lg font-bold text-red-600 mb-2">Delete your Account</h3>
                            <p className="text-sm text-gray-600 mb-5">Once you delete your account, there is no going back. Please be certain.</p>

                            <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-red-600/20">
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
