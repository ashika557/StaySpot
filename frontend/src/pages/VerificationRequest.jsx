import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';
import { Shield, Upload, CheckCircle, ArrowLeft, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function VerificationRequest({ user, refreshUser }) {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState(null); // 'success', 'error'

    const verificationStatus = user?.verification_status || 'Not Submitted';
    const rejectionReason = user?.rejection_reason;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setStatus(null);

        try {
            const formData = new FormData();
            formData.append('identity_document', file);

            const response = await apiRequest(API_ENDPOINTS.UPDATE_PROFILE, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                setStatus('success');
                if (refreshUser) refreshUser(); // Update user context
                setTimeout(() => {
                    navigate(ROUTES.PROFILE);
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    // Render status-specific UI
    const renderStatusBanner = () => {
        if (verificationStatus === 'Approved') {
            return (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                            <h3 className="text-lg font-bold text-green-900">Verification Approved</h3>
                            <p className="text-sm text-green-700 mt-1">Your identity has been verified. You can now access all features.</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (verificationStatus === 'Pending') {
            return (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8 text-blue-600" />
                        <div>
                            <h3 className="text-lg font-bold text-blue-900">Verification Pending</h3>
                            <p className="text-sm text-blue-700 mt-1">Your document is under review by our admin team. This usually takes 24-48 hours.</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (verificationStatus === 'Rejected') {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-3">
                        <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-900">Verification Rejected</h3>
                            <p className="text-sm text-red-700 mt-1">
                                <strong>Reason:</strong> {rejectionReason || 'Document does not meet verification requirements.'}
                            </p>
                            <p className="text-sm text-red-600 mt-2">Please upload a new document below to resubmit your verification.</p>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const canUpload = verificationStatus === 'Not Submitted' || verificationStatus === 'Rejected';

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Identity Verification</h1>
                    <p className="text-blue-100 text-sm mt-1">Required to book rooms or list properties</p>
                </div>

                <div className="p-8">
                    {renderStatusBanner()}

                    {status === 'success' ? (
                        <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Document Submitted!</h3>
                            <p className="text-gray-500 mb-6">Your document has been sent for administrative review. You will be notified once verified.</p>
                            <button onClick={() => navigate(ROUTES.PROFILE)} className="text-blue-600 font-bold hover:underline">
                                Go to Profile
                            </button>
                        </div>
                    ) : canUpload ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* User Email (Read Only) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed"
                                />
                            </div>

                            {/* Upload Area */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Upload ID / Citizenship</label>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer relative ${file ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        required
                                    />

                                    {preview ? (
                                        <div className="relative">
                                            <img src={preview} alt="ID Preview" className="w-full h-40 object-cover rounded-lg shadow-sm" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg text-white font-bold">
                                                Change Photo
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-700">Click to upload photo</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Status Message */}
                            {status === 'error' && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                    Failed to upload document. Please try again.
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 flex items-center justify-center"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={!file || loading}
                                    className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Uploading...
                                        </>
                                    ) : verificationStatus === 'Rejected' ? 'Resubmit Verification' : 'Submit Verification'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center py-8">
                            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">
                                {verificationStatus === 'Pending'
                                    ? 'Your verification is currently under review. Please wait for admin approval.'
                                    : 'Your verification is already approved.'}
                            </p>
                            <button
                                onClick={() => navigate(ROUTES.PROFILE)}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                            >
                                Back to Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
