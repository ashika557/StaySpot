import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Navigation, School, Hospital, Utensils, ShoppingBag, Shield, Check, Info, Clock, ChevronRight, MessageSquare, Phone, Mail, Link as LinkIcon, Facebook, Instagram, Twitter, Wifi, Wind, Tv, User, Calendar, ShieldCheck, ArrowLeft, Loader } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import TenantSidebar from '../components/TenantSidebar';
import Footer from '../components/Footer';
import { roomService } from '../services/roomService';
import { bookingService } from '../services/bookingService';
import { chatService } from '../services/chatService';
import { visitService } from '../services/tenantService'; // Added import
import { getMediaUrl, ROUTES } from '../constants/api';
import { CONFIG, GOOGLE_MAPS_API_KEY } from '../constants/config';
import { useMapContext } from '../context/MapContext';

const mapContainerStyle = {
    width: '100%',
    height: '250px',
    borderRadius: '16px',
};

const RoomDetails = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [map, setMap] = useState(null);

    // Visit Modal State
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitLoading, setVisitLoading] = useState(false);
    const [visitData, setVisitData] = useState({ date: '', time: '', purpose: 'Room viewing' });

    // Booking Form State
    const [bookingDates, setBookingDates] = useState({
        startDate: '',
        endDate: '',
    });
    const [bookingLoading, setBookingLoading] = useState(false);

    const [userBooking, setUserBooking] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const { isLoaded } = useMapContext();

    const fetchRoomReviews = async () => {
        try {
            const data = await roomService.getRoomReviews(id);
            setReviews(data);
        } catch (err) {
            console.error("Failed to fetch reviews", err);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            setReviewLoading(true);
            await roomService.addRoomReview({
                room: parseInt(id),
                rating: newReview.rating,
                comment: newReview.comment
            });
            setNewReview({ rating: 5, comment: '' });
            fetchRoomReviews();
            fetchRoomDetails(); // Refresh room to get updated average rating
            alert('Review posted successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to post review: ' + err.message);
        } finally {
            setReviewLoading(false);
        }
    };

    const fetchUserBooking = async () => {
        try {
            const bookings = await bookingService.getAllBookings();
            const currentBooking = bookings.find(b => b.room.id === parseInt(id));
            setUserBooking(currentBooking);
        } catch (err) {
            console.error("Failed to fetch user booking status", err);
        }
    };

    const fetchRoomDetails = async () => {
        try {
            setLoading(true);
            const data = await roomService.getRoomById(id);
            setRoom(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load room details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomDetails();
        fetchRoomReviews();
        if (user && user.role === 'Tenant') {
            fetchUserBooking();
        }
    }, [id, user]);

    useEffect(() => {
        if (room && isLoaded && map) {
            fetchNearbyPlaces();
        }
    }, [room, isLoaded, map]);

    const fetchNearbyPlaces = () => {
        if (!window.google || !room.latitude || !room.longitude || !map) return;

        const service = new window.google.maps.places.PlacesService(map);
        const location = new window.google.maps.LatLng(parseFloat(room.latitude), parseFloat(room.longitude));

        const types = ['restaurant', 'hospital', 'shopping_mall', 'school', 'university'];

        service.nearbySearch(
            {
                location: location,
                radius: 2000,
                type: types
            },
            (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    const formattedPlaces = results.slice(0, 8).map(place => ({
                        id: place.place_id,
                        name: place.name,
                        type: place.types[0],
                        rating: place.rating,
                        address: place.vicinity
                    }));
                    setNearbyPlaces(formattedPlaces);
                }
            }
        );
    };

    const handleBookingRequest = async (e) => {
        e.preventDefault();
        try {
            setBookingLoading(true);

            // Calculate rent roughly? Or backend handles it. 
            // We need to send monthly_rent. Usually same as room price.
            // But if it is partial month? For now, we assume monthly_rent = room.price

            await bookingService.createBooking({
                room_id: room.id,
                start_date: bookingDates.startDate,
                end_date: bookingDates.endDate,
                monthly_rent: room.price
            });

            alert('Booking requested successfully! Waiting for owner approval.');
            setShowBookingModal(false);
            navigate(ROUTES.TENANT_BOOKINGS); // Redirect to bookings page

        } catch (err) {
            console.error(err);
            alert('Failed to request booking: ' + err.message);
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!room) return (
        <div className="flex h-screen items-center justify-center">
            <p>Room not found.</p>
        </div>
    );

    const mainImage = room.images && room.images.length > 0
        ? getMediaUrl(room.images[0].image)
        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop';

    const handleVisitRequest = async (e) => {
        e.preventDefault();
        try {
            setVisitLoading(true);
            await visitService.createVisit({
                room_id: room.id,
                owner_id: room.owner.id, // Mandatory field fix
                visit_date: visitData.date,
                visit_time: visitData.time,
                purpose: visitData.purpose
            });
            alert('Visit requested successfully! Waiting for owner approval.');
            setShowVisitModal(false);
            navigate(ROUTES.TENANT_VISITS || '/tenant/visits');
        } catch (err) {
            console.error(err);
            alert('Failed to request visit: ' + err.message);
        } finally {
            setVisitLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
            <TenantSidebar user={user} />

            <div className="flex-1 flex flex-col overflow-auto">
                {/* Header */}
                <div className="bg-white border-b px-8 py-4 sticky top-0 z-10 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">Room Details</h1>
                    </div>
                    {(!user?.is_identity_verified && user?.role !== 'Admin') && (
                        <div className={`flex-1 max-w-md mx-6 border-l-4 p-2 flex items-center gap-2 ${user?.identity_document ? 'bg-blue-50 border-blue-500' : 'bg-yellow-100 border-yellow-500'}`}>
                            <ShieldCheck className={`w-4 h-4 ${user?.identity_document ? 'text-blue-600' : 'text-yellow-600'}`} />
                            <p className={`text-[10px] font-medium ${user?.identity_document ? 'text-blue-700' : 'text-yellow-700'}`}>
                                {user?.identity_document
                                    ? 'Identity document pending admin approval. You can book once verified.'
                                    : 'Identity document missing. Please upload your Citizenship/ID in the Profile to book.'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-8 max-w-7xl mx-auto w-full pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Images & Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Images & Details (unchanged) */}
                            {/* ... (Keep existing image/details structure) ... */}
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                <img src={mainImage} alt={room.title} className="w-full h-80 object-cover" />
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900">{room.title}</h2>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star key={i} size={16} fill={i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "none"} color={i <= Math.round(room.average_rating || 0) ? "#FBBF24" : "#D1D5DB"} />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500 font-bold">
                                            {room.average_rating ? room.average_rating.toFixed(1) : '0.0'} ({room.review_count || 0} reviews)
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-blue-600">NPR {parseFloat(room.price).toLocaleString()}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Per Month</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    {room.status === 'Rented' ? (
                                        <div className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                            Rented
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                            Available
                                        </div>
                                    )}

                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Property Specs</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Type</span> <span className="font-bold">{room.room_type}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Toilet</span> <span className="font-bold text-blue-600">{room.toilet_type}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Floor</span> <span className="font-bold">{room.floor || 'Ground'}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Deposit</span> <span className="font-bold text-green-600">NPR {parseFloat(room.deposit || 0).toLocaleString()}</span></div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Matching Prefs</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">For</span> <span className="font-bold text-blue-600">{room.preferred_tenant}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Gender</span> <span className="font-bold">{room.gender_preference}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Electricity</span> <span className="font-bold">{room.electricity_backup || 'None'}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Available</span> <span className="font-bold">{room.available_from || 'Now'}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">House Rules</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <RuleItem label="Cooking" allowed={room.cooking_allowed} />
                                        <RuleItem label="Smoking" allowed={room.smoking_allowed} />
                                        <RuleItem label="Drinking" allowed={room.drinking_allowed} />
                                        <RuleItem label="Pets" allowed={room.pets_allowed} />
                                        <RuleItem label="Visitors" allowed={room.visitor_allowed} />
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Amenities</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {room.wifi && <Amenity icon={Wifi} label="WiFi" />}
                                        {room.parking && <Amenity icon={User} label="Parking" />}
                                        {room.water_supply && <Amenity icon={ShieldCheck} label="Water Supply" />}
                                        {room.kitchen_access && <Amenity icon={ShieldCheck} label="Kitchen" />}
                                        {room.furnished && <Amenity icon={ShieldCheck} label="Furnished" />}
                                    </div>
                                </div>

                                {/* Reviews Section */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-gray-900">Reviews ({reviews.length})</h3>
                                    </div>

                                    {user?.role === 'Tenant' && userBooking && (userBooking.status === 'Confirmed' || userBooking.status === 'Completed' || userBooking.status === 'Active') && !reviews.some(r => r.tenant?.id === user?.id) && (
                                        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <h4 className="font-bold text-gray-900 mb-2">Write a Review</h4>
                                            <form onSubmit={handleReviewSubmit} className="space-y-4">
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                                            className={`${newReview.rating >= star ? 'text-yellow-500' : 'text-gray-300'} transition-colors`}
                                                        >
                                                            <Star size={24} fill={newReview.rating >= star ? 'currentColor' : 'none'} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    required
                                                    className="w-full p-3 border rounded-xl bg-white text-sm"
                                                    placeholder="Share your experience..."
                                                    value={newReview.comment}
                                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                    rows="3"
                                                ></textarea>
                                                <button
                                                    type="submit"
                                                    disabled={reviewLoading}
                                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50"
                                                >
                                                    {reviewLoading ? 'Posting...' : 'Submit Review'}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {reviews.length > 0 ? (
                                            reviews.map(review => (
                                                <div key={review.id} className="pb-6 border-b last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                                {review.tenant?.full_name?.[0] || 'T'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-gray-900">{review.tenant?.full_name || 'Tenant'}</p>
                                                                <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={14}
                                                                    className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                                                                    fill={i < review.rating ? 'currentColor' : 'none'}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center py-4 text-sm">No reviews yet. Be the first to review!</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Owner & Booking */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4">Landlord</h3>
                                {/* Owner Info */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg overflow-hidden">
                                        {room.owner?.profile_photo ? (
                                            <img src={getMediaUrl(room.owner.profile_photo)} alt={room.owner.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            room.owner?.full_name?.[0] || 'O'
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{room.owner?.full_name || 'Landlord'}</div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await chatService.startConversation(room.owner.id);
                                                    navigate(ROUTES.CHAT);
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Failed to start chat');
                                                }
                                            }}
                                            className="text-sm text-blue-600 font-bold hover:underline"
                                        >
                                            Message Landlord
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {/* Debug: {console.log('Room Status:', room.status)} */}
                                    {(room.status === 'Occupied' || room.status?.toLowerCase() === 'occupied') ? (
                                        <div className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-center border border-red-100 flex items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            This room is currently occupied
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (!user?.is_identity_verified && user?.role !== 'Admin') {
                                                        const errorMsg = user?.identity_document
                                                            ? 'Your identity document is pending verification by an administrator.'
                                                            : 'You must provide an identity document (Citizenship/ID) before requesting a booking.';

                                                        if (confirm(errorMsg + "\n\nClick OK to upload/view your document.")) {
                                                            navigate(ROUTES.VERIFICATION_REQUEST);
                                                        }
                                                        return;
                                                    }
                                                    setShowBookingModal(true);
                                                }}
                                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                                            >
                                                Request to Book
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (!user?.is_identity_verified && user?.role !== 'Admin') {
                                                        const errorMsg = user?.identity_document
                                                            ? 'Your identity document is pending verification by an administrator.'
                                                            : 'You must provide an identity document (Citizenship/ID) before scheduling a visit.';

                                                        if (confirm(errorMsg + "\n\nClick OK to upload/view your document.")) {
                                                            navigate(ROUTES.VERIFICATION_REQUEST);
                                                        }
                                                        return;
                                                    }
                                                    setShowVisitModal(true);
                                                }}
                                                className="w-full bg-white text-blue-600 border border-blue-200 py-3 rounded-xl font-bold hover:bg-blue-50 transition"
                                            >
                                                Schedule a Visit
                                            </button>
                                            <p className="text-xs text-center text-gray-400 mt-2">
                                                Current Status: <span className="font-semibold text-gray-600">{room.status === 'Pending Verification' ? 'Available' : room.status}</span>
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Location Map & Nearby Surroundings */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                        Location & Surroundings
                                    </h3>

                                    {isLoaded && room.latitude ? (
                                        <div className="space-y-4">
                                            <div className="h-64 rounded-xl overflow-hidden border border-gray-100">
                                                <GoogleMap
                                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                                    center={{ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) }}
                                                    zoom={15}
                                                    onLoad={(mapInstance) => setMap(mapInstance)}
                                                    options={{
                                                        disableDefaultUI: false,
                                                        mapTypeControl: false,
                                                        streetViewControl: false,
                                                        styles: [{ "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "on" }] }]
                                                    }}
                                                >
                                                    <Marker
                                                        position={{ lat: parseFloat(room.latitude), lng: parseFloat(room.longitude) }}
                                                        animation={window.google?.maps.Animation.DROP}
                                                        icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                                                    />
                                                </GoogleMap>
                                            </div>

                                            {/* Nearby Places Discovery */}
                                            <div className="mt-6 pt-6 border-t border-gray-50">
                                                <h4 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                                    <Navigation className="w-3.5 h-3.5 text-blue-500" />
                                                    Surroundings (Within 2KM)
                                                </h4>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {nearbyPlaces.length > 0 ? (
                                                        nearbyPlaces.map(place => (
                                                            <div key={place.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300 group">
                                                                <div className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:border-blue-100 transition-colors">
                                                                    {place.type.includes('restaurant') || place.type.includes('food') ? <Utensils className="w-4 h-4 text-orange-500" /> :
                                                                        place.type.includes('hospital') || place.type.includes('health') ? <Hospital className="w-4 h-4 text-red-500" /> :
                                                                            place.type.includes('shopping') ? <ShoppingBag className="w-4 h-4 text-blue-500" /> :
                                                                                place.type.includes('school') || place.type.includes('university') ? <School className="w-4 h-4 text-indigo-500" /> :
                                                                                    <MapPin className="w-4 h-4 text-gray-400" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start">
                                                                        <h5 className="font-bold text-gray-900 text-xs truncate">{place.name}</h5>
                                                                        {place.rating && (
                                                                            <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                                                                <Star className="w-2.5 h-2.5 fill-current" />
                                                                                {place.rating}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{place.address}</p>
                                                                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter mt-1 block">
                                                                        {place.type.replace(/_/g, ' ')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic animate-pulse">Scanning area...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-40 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200">
                                            <MapPin className="w-8 h-8 mb-2 opacity-20" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Map data unavailable</p>
                                            <p className="text-[10px] opacity-60 mt-1">Address: {room.location}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visit Modal */}
            {showVisitModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Schedule a Visit</h2>
                        <p className="text-sm text-gray-500 mb-6">Pick a date and time to view the room.</p>

                        <form onSubmit={handleVisitRequest}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-2 border rounded-xl"
                                        value={visitData.date}
                                        onChange={(e) => setVisitData({ ...visitData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full p-2 border rounded-xl"
                                        value={visitData.time}
                                        onChange={(e) => setVisitData({ ...visitData, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowVisitModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancel</button>
                                <button type="submit" disabled={visitLoading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">{visitLoading ? 'Sending...' : 'Request Visit'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Modal (Keep existing) */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    {/* Existing booking modal content */}
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Booking</h2>
                        <form onSubmit={handleBookingRequest}>
                            {/* Inputs */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Move-in Date</label>
                                    <input type="date" className="w-full p-2 border rounded-xl" value={bookingDates.startDate} onChange={(e) => setBookingDates({ ...bookingDates, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                                    <input type="date" className="w-full p-2 border rounded-xl" value={bookingDates.endDate} onChange={(e) => setBookingDates({ ...bookingDates, endDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowBookingModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Send Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

const Amenity = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700">
        <Icon size={18} className="text-blue-500" />
        {label}
    </div>
);

const RuleItem = ({ label, allowed }) => (
    <div className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase flex items-center justify-between border ${allowed ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
        <span>{label}</span>
        <span>{allowed ? 'Yes' : 'No'}</span>
    </div>
);

export default RoomDetails;
