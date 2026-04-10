import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';
import { 
  ShieldCheck, Upload, ArrowLeft, 
  Clock, AlertCircle, FileText, 
  ShieldAlert, BadgeCheck, Loader, Sparkles, UserCheck
} from 'lucide-react';

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
                if (refreshUser) refreshUser();
                setTimeout(() => navigate(ROUTES.PROFILE), 3000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const renderStatusBanner = () => {
        if (verificationStatus === 'Approved') {
            return (
                <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 mb-8 text-center animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-200">
                        <BadgeCheck className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-emerald-900 font-outfit tracking-tight">Verified</h3>
                    <p className="text-emerald-700 font-medium mt-2">Your account is verified. You have full access to all features.</p>
                </div>
            );
        }

        if (verificationStatus === 'Pending') {
            return (
                <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 mb-8 text-center animate-pulse">
                    <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-200">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-amber-900 font-outfit tracking-tight">Pending Review</h3>
                    <p className="text-amber-700 text-sm font-medium mt-2">We are reviewing your document. This usually takes about 24 hours.</p>
                </div>
            );
        }

        if (verificationStatus === 'Rejected') {
            return (
                <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 mb-8">
                    <div className="flex items-start gap-6">
                        <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-200">
                            <ShieldAlert className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black text-rose-900 font-outfit tracking-tight uppercase">Verification Rejected</h3>
                            <p className="text-rose-700 text-sm font-bold mt-2 uppercase tracking-widest bg-rose-100/50 inline-block px-3 py-1 rounded-lg">
                                Reason: <span className="text-rose-600">{rejectionReason || 'Invalid document'}</span>
                            </p>
                            <p className="text-rose-600 text-xs font-medium mt-4">Please upload a clear photo of your ID to try again.</p>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const canUpload = verificationStatus === 'Not Submitted' || verificationStatus === 'Rejected';

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden font-inter text-slate-900">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px]"></div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)] max-w-lg w-full overflow-hidden border border-slate-100 relative z-10 fade-in text-slate-900">
                {/* Visual Header */}
                <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-950/20"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-2xl">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black font-outfit tracking-tighter uppercase">Identity Verification</h1>
                        <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Verify your account for more features</p>
                    </div>
                </div>

                <div className="p-10 text-slate-900">
                    {renderStatusBanner()}

                    {status === 'success' ? (
                        <div className="text-center py-10 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-100">
                                <Sparkles className="w-12 h-12" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 font-outfit tracking-tighter mb-3">Thank You</h3>
                            <p className="text-slate-500 font-medium mb-10 leading-relaxed px-4">Your document has been submitted successfully and is currently under review by our team.</p>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-8">
                                <div className="h-full bg-indigo-500 animate-[shimmer_3s_infinite]"></div>
                            </div>
                            <button onClick={() => navigate(ROUTES.PROFILE)} className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-indigo-700 transition-colors flex items-center justify-center gap-2 mx-auto">
                                Go to Profile <ArrowLeft className="w-4 h-4" />
                            </button>
                        </div>
                    ) : canUpload ? (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account</label>
                                <div className="relative group opacity-60">
                                   <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                   <input type="email" value={user?.email || ''} disabled className="w-full py-4 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload National ID or Passport</label>
                                <div
                                    className={`group relative border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer overflow-hidden ${
                                        file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        required
                                    />

                                    {preview ? (
                                        <div className="relative group/preview animate-in fade-in duration-500">
                                            <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center rounded-2xl z-10 backdrop-blur-sm">
                                               <p className="text-white text-[10px] font-black uppercase tracking-widest">Change File</p>
                                            </div>
                                            <img src={preview} alt="ID Preview" className="h-48 w-full object-cover rounded-2xl shadow-xl brightness-95" />
                                        </div>
                                    ) : (
                                        <div className="py-6 space-y-4">
                                            <div className="w-14 h-14 bg-white border border-slate-100 shadow-xl rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                                <Upload className="w-7 h-7 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 font-outfit">Select File</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">PNG or JPG (Max 5MB)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl text-center">
                                    Error: Please try again.
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="w-16 h-16 flex items-center justify-center border border-slate-200 text-slate-400 rounded-2xl hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={!file || loading}
                                    className="flex-1 bg-indigo-600 border border-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100/50 hover:bg-indigo-700 transition-all disabled:opacity-30 flex items-center justify-center gap-3 group active:scale-95"
                                >
                                    {loading ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Submit for Verification <FileText className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-10 h-10 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-medium px-8 leading-relaxed mb-10">
                                {verificationStatus === 'Pending'
                                    ? 'Your verification is being processed. We will notify you once it is complete.'
                                    : 'Your account is already verified. No further action is needed.'}
                            </p>
                            <button
                                onClick={() => navigate(ROUTES.PROFILE)}
                                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                            >
                                Go to Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
