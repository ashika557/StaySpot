import React, { useState, useEffect } from 'react';
import { apiRequest, getCsrfToken } from '../utils/api';
import { API_ENDPOINTS, getMediaUrl } from '../constants/api';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

function Profile({ user, onUpdateUser, refreshUser }) {
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
    });
    const [identityFile, setIdentityFile] = useState(null);
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

    const handleFileChange = (e) => {
        setIdentityFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const data = new FormData();
        data.append('full_name', formData.full_name);
        data.append('phone', formData.phone);
        if (identityFile) {
            data.append('identity_document', identityFile);
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
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">My Profile</h2>

                {/* Verification Status Badge */}
                <div className="mb-8 p-4 rounded-lg flex items-center justify-between bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${user?.is_identity_verified ? 'bg-green-100 text-green-600' :
                            user?.identity_document ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                            {user?.is_identity_verified ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Identity Status</p>
                            <p className={`text-lg font-bold ${user?.is_identity_verified ? 'text-green-700' :
                                user?.identity_document ? 'text-blue-700' : 'text-yellow-700'
                                }`}>
                                {user?.is_identity_verified ? 'Verified Account' :
                                    user?.identity_document ? 'Pending Admin Approval' : 'Unverified (ID Missing)'}
                            </p>
                        </div>
                    </div>
                    {!user?.is_identity_verified && user?.identity_document && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold animate-pulse">
                            Processing
                        </span>
                    )}
                </div>

                {message.text && (
                    <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={user?.email}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Identity Verification</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {user?.role === 'Owner'
                                ? 'Owners must upload an identity document (Citizenship/ID) before adding rooms.'
                                : 'Tenants must upload an identity document before booking a room.'}
                        </p>

                        <div className="flex items-center space-x-4 mb-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${user?.identity_document ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {user?.identity_document ? 'Document Provided' : 'Missing Document'}
                            </div>
                            {user?.is_identity_verified && (
                                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                    Verified by Admin
                                </div>
                            )}
                        </div>

                        {user?.identity_document && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Current Document:</p>
                                <div className="relative w-48 h-32 border rounded-lg overflow-hidden group">
                                    <img
                                        src={getMediaUrl(user.identity_document)}
                                        alt="Identity Document"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <a
                                            href={getMediaUrl(user.identity_document)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white text-xs underline"
                                        >
                                            View Full Image
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {user?.identity_document ? 'Update Identity Document' : 'Upload Identity Document'}
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="mt-1 text-xs text-gray-500">Supported formats: JPG, PNG. Max size: 5MB.</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition duration-200 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Profile;
