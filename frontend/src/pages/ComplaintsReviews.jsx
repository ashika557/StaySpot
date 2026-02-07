import React, { useState, useEffect } from 'react';
import { AlertTriangle, Star, CheckCircle, Clock, Upload, Send, MessageSquare, ChevronRight, MapPin, Edit2, Trash2, X } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, getMediaUrl } from '../constants/api';
import complaintService from '../services/complaintService';
import { roomService } from '../services/roomService';
import { bookingService } from '../services/bookingService';
import TenantSidebar from '../components/TenantSidebar';

export default function ComplaintsReviews({ user }) {
    const [complaints, setComplaints] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [complaintForm, setComplaintForm] = useState({
        type: '',
        ownerId: '',
        roomId: '',
        description: '',
        image: null
    });

    const [reviewForm, setReviewForm] = useState({
        roomId: '',
        rating: 5,
        comment: ''
    });

    const [editingComplaintId, setEditingComplaintId] = useState(null);
    const [editingReviewId, setEditingReviewId] = useState(null);

    const [submittingComplaint, setSubmittingComplaint] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [complaintsData, bookingsData] = await Promise.all([
                complaintService.getComplaints(),
                bookingService.getAllBookings()
            ]);

            setComplaints(complaintsData);
            setBookings(bookingsData.filter(b => ['Confirmed', 'Active', 'Completed'].includes(b.status)));

            // Get all reviews for current user
            // We can filter by tenant id in the reviews list if backend supports it 
            // otherwise fetch all and filter or add an endpoint
            const response = await apiRequest(API_ENDPOINTS.REVIEWS);
            if (response.ok) {
                const allReviews = await response.json();
                setReviews(allReviews.filter(r => r.tenant.id === user.id));
            }
        } catch (err) {
            console.error("Failed to fetch page data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleComplaintSubmit = async (e) => {
        e.preventDefault();
        if (!complaintForm.type || !complaintForm.ownerId || !complaintForm.description) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            setSubmittingComplaint(true);
            const formData = new FormData();
            formData.append('complaint_type', complaintForm.type);
            formData.append('owner_id', complaintForm.ownerId);
            if (complaintForm.roomId) formData.append('room_id', complaintForm.roomId);
            formData.append('description', complaintForm.description);
            if (complaintForm.image && typeof complaintForm.image !== 'string') {
                formData.append('image', complaintForm.image);
            }

            if (editingComplaintId) {
                await complaintService.updateComplaint(editingComplaintId, formData);
                alert("Complaint updated successfully!");
            } else {
                await complaintService.submitComplaint(formData);
                alert("Complaint submitted successfully!");
            }

            setComplaintForm({ type: '', ownerId: '', roomId: '', description: '', image: null });
            setEditingComplaintId(null);
            fetchData();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmittingComplaint(false);
        }
    };

    const handleEditComplaint = (complaint) => {
        setEditingComplaintId(complaint.id);
        setComplaintForm({
            type: complaint.complaint_type,
            ownerId: complaint.owner.id,
            roomId: complaint.room?.id || '',
            description: complaint.description,
            image: complaint.image
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteComplaint = async (id) => {
        if (!window.confirm("Are you sure you want to delete this complaint?")) return;
        try {
            await complaintService.deleteComplaint(id);
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewForm.roomId || !reviewForm.comment) {
            alert("Please select a room and write a comment");
            return;
        }

        try {
            setSubmittingReview(true);
            const reviewData = {
                room: parseInt(reviewForm.roomId),
                rating: reviewForm.rating,
                comment: reviewForm.comment
            };

            if (editingReviewId) {
                await roomService.updateRoomReview(editingReviewId, reviewData);
                alert("Review updated successfully!");
            } else {
                await roomService.addRoomReview(reviewData);
                alert("Review submitted successfully!");
            }

            setReviewForm({ roomId: '', rating: 5, comment: '' });
            setEditingReviewId(null);
            fetchData();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleEditReview = (review) => {
        setEditingReviewId(review.id);
        setReviewForm({
            roomId: review.room.id,
            rating: review.rating,
            comment: review.comment
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteReview = async (id) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        try {
            await roomService.deleteRoomReview(id);
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <TenantSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <TenantSidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Complaints & Reviews</h1>
                            <p className="text-gray-500 text-sm mt-1">Manage your room experiences and report issues.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Complaints */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <AlertTriangle className="text-blue-600" size={20} />
                                        {editingComplaintId ? 'Edit Complaint' : 'Submit a Complaint'}
                                    </h2>
                                    {editingComplaintId && (
                                        <button
                                            onClick={() => {
                                                setEditingComplaintId(null);
                                                setComplaintForm({ type: '', ownerId: '', roomId: '', description: '', image: null });
                                            }}
                                            className="text-gray-400 hover:text-gray-600 transition"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>

                                <form onSubmit={handleComplaintSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Complaint Type</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            value={complaintForm.type}
                                            onChange={(e) => setComplaintForm({ ...complaintForm, type: e.target.value })}
                                            required
                                        >
                                            <option value="">Select complaint type</option>
                                            <option value="Maintenance">Maintenance</option>
                                            <option value="Noise">Noise</option>
                                            <option value="Billing">Billing</option>
                                            <option value="Security">Security</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Owner / Room</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            value={`${complaintForm.ownerId}-${complaintForm.roomId}`}
                                            onChange={(e) => {
                                                const [ownerId, roomId] = e.target.value.split('-');
                                                setComplaintForm({ ...complaintForm, ownerId, roomId });
                                            }}
                                            required
                                        >
                                            <option value="">Select owner/room</option>
                                            {bookings.map(b => (
                                                <option key={b.id} value={`${b.room?.owner?.id}-${b.room?.id}`}>
                                                    {b.room?.owner?.full_name || 'Unknown Owner'} - {b.room?.title || 'Unknown Room'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            rows="4"
                                            placeholder="Describe your complaint in detail..."
                                            value={complaintForm.description}
                                            onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                                            required
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Attach Image</label>
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="text-xs text-gray-500">
                                                    {complaintForm.image ? complaintForm.image.name : 'Click to upload image'}
                                                </p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => setComplaintForm({ ...complaintForm, image: e.target.files[0] })}
                                            />
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submittingComplaint}
                                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Send size={18} />
                                        {submittingComplaint ? (editingComplaintId ? 'Updating...' : 'Submitting...') : (editingComplaintId ? 'Update Complaint' : 'Submit Complaint')}
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900">Complaint History</h3>
                                {complaints.length === 0 ? (
                                    <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center text-sm text-gray-500">
                                        No complaints filed yet.
                                    </div>
                                ) : (
                                    complaints.map(complaint => (
                                        <div key={complaint.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-100 transition relative overflow-hidden group">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-900">{complaint.description.substring(0, 30)}{complaint.description.length > 30 ? '...' : ''}</h4>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEditComplaint(complaint)} className="p-1 text-gray-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteComplaint(complaint.id)} className="p-1 text-gray-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <div className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${complaint.status === 'Resolved' ? 'bg-green-50 text-green-600' :
                                                        complaint.status === 'Investigating' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-yellow-50 text-yellow-600'
                                                        }`}>
                                                        {complaint.status}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                <span>Owner: {complaint.owner?.full_name || 'Unknown'}</span>
                                                <span>•</span>
                                                <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2">{complaint.description}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Column: Reviews */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Star className="text-blue-600" size={20} />
                                        {editingReviewId ? 'Edit Review' : 'Your Reviews'}
                                    </h2>
                                    {editingReviewId && (
                                        <button
                                            onClick={() => {
                                                setEditingReviewId(null);
                                                setReviewForm({ roomId: '', rating: 5, comment: '' });
                                            }}
                                            className="text-gray-400 hover:text-gray-600 transition"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>

                                <form onSubmit={handleReviewSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Room</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                                            value={reviewForm.roomId}
                                            onChange={(e) => setReviewForm({ ...reviewForm, roomId: e.target.value })}
                                            required
                                            disabled={!!editingReviewId}
                                        >
                                            <option value="">Select room</option>
                                            {bookings
                                                .filter(b => editingReviewId ? b.room?.id === reviewForm.roomId : !reviews.some(r => r.room?.id === b.room?.id))
                                                .map(b => (
                                                    <option key={b.id} value={b.room.id}>
                                                        {b.room.title}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rating</label>
                                        <div className="flex gap-2 mb-4">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                                    className={`${reviewForm.rating >= star ? 'text-yellow-400' : 'text-gray-200'} hover:scale-110 transition`}
                                                >
                                                    <Star size={28} fill={reviewForm.rating >= star ? 'currentColor' : 'none'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Review</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            rows="4"
                                            placeholder="Share your experience..."
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                            required
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submittingReview}
                                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} />
                                        {submittingReview ? (editingReviewId ? 'Updating...' : 'Submitting...') : (editingReviewId ? 'Update Review' : 'Submit Review')}
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900">Past Reviews</h3>
                                {reviews.length === 0 ? (
                                    <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center text-sm text-gray-500">
                                        No reviews submitted yet.
                                    </div>
                                ) : (
                                    reviews.map(review => (
                                        <div key={review.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-100 transition relative overflow-hidden group">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-900 leading-tight">{review.room?.title || 'Room Review'}</h4>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEditReview(review)} className="p-1 text-gray-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteReview(review.id)} className="p-1 text-gray-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                <span>Owner: {review.room?.owner?.full_name || 'Unknown'}</span>
                                                <span>•</span>
                                                <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
