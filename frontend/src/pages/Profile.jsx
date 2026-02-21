import React, { useState, useEffect } from 'react';
import { apiRequest, getCsrfToken } from '../utils/api';
import { API_ENDPOINTS, getMediaUrl } from '../constants/api';
import OwnerSidebar from '../components/OwnerSidebar';
import TenantSidebar from '../components/TenantSidebar';

function Profile({ user, onUpdateUser, refreshUser }) {
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
    });
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [identityDocFile, setIdentityDocFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
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
            setProfilePhotoFile(file);
            setProfilePreview(URL.createObjectURL(file));
        }
    };

    const handleIdentityDocChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIdentityDocFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const data = new FormData();
        data.append('full_name', formData.full_name);
        data.append('phone', formData.phone);
        if (profilePhotoFile) {
            data.append('profile_photo', profilePhotoFile);
        }
        if (identityDocFile) {
            data.append('identity_document', identityDocFile);
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
        }
    };

    const isOwner = user?.role === 'Owner' || user?.role === 'owner';
    const SidebarComponent = isOwner ? OwnerSidebar : TenantSidebar;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <SidebarComponent user={user} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 p-8">
                    <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                    <p className="text-gray-500 mt-1">Update your profile and identity verification</p>
                </header>
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl mx-auto">

                        {message.text && (
                            <div className={`p-4 mb-6 rounded-xl border font-bold text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
                            {/* Profile Photo Section */}
                            <div className="flex flex-col items-center mb-10 pb-8 border-b border-gray-200">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
                                    <img
                                        src={profilePreview || (user?.profile_photo ? getMediaUrl(user.profile_photo) : `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}&background=3b82f6&color=fff&size=160&bold=true`)}
                                        alt="Profile"
                                        className="relative w-40 h-40 rounded-full border-4 border-white shadow-2xl object-cover"
                                    />
                                    <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-3 rounded-full cursor-pointer shadow-xl hover:bg-blue-700 transition-all duration-300 border-4 border-white hover:scale-110">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoChange} />
                                    </label>
                                </div>
                                <div className="mt-6 text-center">
                                    <h2 className="text-3xl font-bold text-gray-900">{user?.full_name || 'Your Name'}</h2>
                                    <p className="text-blue-600 font-bold uppercase tracking-widest text-sm mt-2 bg-blue-50 px-4 py-1 rounded-full inline-block">{user?.role}</p>
                                </div>
                            </div>

                            {/* Profile Form */}
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={user?.email}
                                        disabled
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                                    />
                                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Email cannot be changed for security reasons.
                                    </p>
                                </div>

                                {/* Identity Verification Section */}
                                <div className="pt-6 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Identity Verification</h3>
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-full ${user?.is_identity_verified ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900">
                                                    {user?.is_identity_verified ? 'Identity Verified' : 'Identity Verification Required'}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {user?.is_identity_verified
                                                        ? 'Your identity has been verified. You can now book rooms and schedule visits.'
                                                        : 'Please upload a valid government-issued ID (Citizenship, License, or Passport) to verify your identity.'}
                                                </p>

                                                {!user?.is_identity_verified && (
                                                    <div className="mt-4">
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Document</label>
                                                        <input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            onChange={handleIdentityDocChange}
                                                            className="block w-full text-sm text-gray-500
                                                                file:mr-4 file:py-2 file:px-4
                                                                file:rounded-full file:border-0
                                                                file:text-sm file:font-semibold
                                                                file:bg-blue-50 file:text-blue-700
                                                                hover:file:bg-blue-100
                                                                cursor-pointer"
                                                        />
                                                        {user?.identity_document && (
                                                            <p className="mt-2 text-xs text-orange-600 font-medium">
                                                                Update pending review. You can upload a new document to replace the current one.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {user?.is_identity_verified && (
                                                    <p className="mt-2 text-xs text-green-600 font-bold">
                                                        Verified on {new Date().toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-10 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;

