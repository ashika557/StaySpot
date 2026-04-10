import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MapProvider } from './context/MapContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerRooms from './pages/OwnerRoom';
import TenantDashboard from './pages/TenantDashboard';
import SearchRooms from './pages/SearchRooms';
import VerifyEmail from './pages/VerifyEmail';
import StaySpotLanding from './pages/LandingPage';
import Chat from './pages/Chat';
import RoomDetails from './pages/RoomDetails';
import TenantBookings from './pages/TenantBookings';
import TenantVisits from './pages/TenantVisits';
import TenantPayments from './pages/TenantPayments';
import ComplaintsReviews from './pages/ComplaintsReviews';
import OwnerBookings from './pages/OwnerBookings';
import OwnerTenants from './pages/OwnerTenants';
import OwnerPayments from './pages/OwnerPayments';
import OwnerVisitRequests from './pages/OwnerVisitRequests';
import Profile from './pages/Profile';
import VerificationRequest from './pages/VerificationRequest';
import AdminLayout from './components/AdminLayout';
import AdminSettings from './pages/AdminSettings';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserRegistry from './pages/AdminUserRegistry';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminKycReview from './pages/AdminKycReview';
import AdminRoomRegistry from './pages/AdminRoomRegistry';
import AdminComplaintRegistry from './pages/AdminComplaintRegistry';
import AdminComplaintDetail from './pages/AdminComplaintDetail';
import AdminRoomDetail from './pages/AdminRoomDetail';
import OwnerMaintenance from './pages/OwnerMaintenance';
import { ROUTES, API_ENDPOINTS } from './constants/api';
import { apiRequest } from './utils/api';


function App() {
  const [user, setUser] = React.useState(null);
  const [showLanding, setShowLanding] = React.useState(true);

  // Load user from localStorage
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setShowLanding(false);
      // Process rent reminders automatically on load
      triggerRentReminders();
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    try {
      // Add timestamp to prevent caching
      const response = await apiRequest(`${API_ENDPOINTS.GET_USER}?t=${new Date().getTime()}`);
      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log("User profile refreshed:", updatedUser.is_identity_verified);
      }
    } catch (error) {
      console.error("Failed to refresh user profile", error);
    }
  }, []);

  const triggerRentReminders = async () => {
    try {
      await apiRequest(API_ENDPOINTS.TRIGGER_REMINDERS, {
        method: 'POST'
      });
      console.log("Rent reminders processed successfully");
    } catch (error) {
      console.error("Failed to trigger rent reminders:", error);
    }
  };

  const handleLogin = (userData) => {
    // Ensure full_name exists for tenants too
    if (!userData.full_name) {
      userData.full_name = userData.username || 'User';
    }
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowLanding(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setShowLanding(true);
  };

  return (
    <MapProvider>
      <Router>
        <AppContent
          user={user}
          setUser={setUser}
          showLanding={showLanding}
          setShowLanding={setShowLanding}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
          refreshUser={refreshUser}
        />
      </Router>
    </MapProvider>
  );
}

function AppContent({ user, setUser, showLanding, setShowLanding, handleLogin, handleLogout, refreshUser }) {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPath && !showLanding && user && (
        <Navigation user={user} onLogout={handleLogout} showLanding={showLanding} />
      )}

      {/* Global Payment Callback Redirect */}
      <PaymentCallbackHandler />

      <main className="flex-grow">
        <Routes>
          {/* Landing page */}
          <Route
            path={ROUTES.HOME}
            element={
              showLanding ? (
                <StaySpotLanding
                  onGetStarted={() => setShowLanding(false)}
                  onSignIn={() => setShowLanding(false)}
                  user={user}
                />
              ) : user ? (
                <Navigate
                  to={`${user.role === 'Admin' ? ROUTES.ADMIN_DASHBOARD :
                      user.role === 'Owner' ? ROUTES.OWNER_DASHBOARD :
                        (location.search.includes('pidx=') || location.search.includes('data=') || location.search.includes('oid='))
                          ? ROUTES.TENANT_PAYMENTS : ROUTES.TENANT_DASHBOARD
                    }${location.search}`}
                />
              ) : (
                <Navigate to={`${ROUTES.LOGIN}${location.search}`} />
              )
            }
          />

          {/* Auth routes */}
          <Route
            path={ROUTES.LOGIN}
            element={
              user ? (
                <Navigate to={`${user.role === 'Admin' ? ROUTES.ADMIN_DASHBOARD :
                    user.role === 'Owner' ? ROUTES.OWNER_DASHBOARD :
                      (new URLSearchParams(location.search).get('pidx') ||
                        new URLSearchParams(location.search).get('data') ||
                        new URLSearchParams(location.search).get('oid'))
                        ? ROUTES.TENANT_PAYMENTS : ROUTES.TENANT_DASHBOARD
                  }${location.search}`} />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          <Route
            path={ROUTES.REGISTER}
            element={
              user ? (
                <Navigate to={`${user.role === 'Admin' ? ROUTES.ADMIN_DASHBOARD :
                    user.role === 'Owner' ? ROUTES.OWNER_DASHBOARD :
                      (new URLSearchParams(location.search).get('pidx') ||
                        new URLSearchParams(location.search).get('data') ||
                        new URLSearchParams(location.search).get('oid'))
                        ? ROUTES.TENANT_PAYMENTS : ROUTES.TENANT_DASHBOARD
                  }${location.search}`} />
              ) : (
                <Register onLogin={handleLogin} />
              )
            }
          />

          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={`${ROUTES.RESET_PASSWORD}/:token`} element={<ResetPassword />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />

          <Route
            path={ROUTES.TENANT_SEARCH}
            element={user && user.role === 'Tenant' ? <SearchRooms user={user} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.TENANT_DASHBOARD}
            element={user && user.role === 'Tenant' ? <TenantDashboard user={user} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.TENANT_BOOKINGS}
            element={user && user.role === 'Tenant' ? <TenantBookings user={user} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.TENANT_VISITS}
            element={user && user.role === 'Tenant' ? <TenantVisits user={user} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.TENANT_PAYMENTS}
            element={user && user.role === 'Tenant' ? <TenantPayments user={user} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          {/* Fallback for Khalti Redirection */}
          <Route
            path="/payments/khalti_callback/"
            element={user && user.role === 'Tenant' ? <TenantPayments user={user} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.TENANT_COMPLAINTS}
            element={user && user.role === 'Tenant' ? <ComplaintsReviews user={user} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.ROOM_DETAILS}
            element={user ? <RoomDetails user={user} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />

          <Route
            path={ROUTES.OWNER_DASHBOARD}
            element={user && user.role === 'Owner' ? <OwnerDashboard user={user} onLogout={handleLogout} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.OWNER_ROOMS}
            element={user && user.role === 'Owner' ? <OwnerRooms user={user} refreshUser={refreshUser} onLogout={handleLogout} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.OWNER_BOOKINGS}
            element={user && user.role === 'Owner' ? <OwnerBookings user={user} onLogout={handleLogout} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path="/owner/visits"
            element={user && user.role === 'Owner' ? <OwnerVisitRequests user={user} onLogout={handleLogout} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.OWNER_TENANTS}
            element={user && user.role === 'Owner' ? <OwnerTenants user={user} onLogout={handleLogout} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.OWNER_PAYMENTS}
            element={user && user.role === 'Owner' ? <OwnerPayments user={user} onLogout={handleLogout} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />

          <Route
            path={ROUTES.OWNER_MAINTENANCE}
            element={user && user.role === 'Owner' ? <OwnerMaintenance user={user} onLogout={handleLogout} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.CHAT}
            element={user ? <Chat user={user} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />
          <Route
            path={ROUTES.PROFILE}
            element={user ? <Profile user={user} refreshUser={refreshUser} onUpdateUser={(updatedUser) => {
              if (updatedUser === null) {
                handleLogout(); // Use handleLogout to clean up everything
              } else {
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            }} /> : <Navigate to={`${ROUTES.LOGIN}${location.search}`} />}
          />

          <Route
            path={ROUTES.VERIFICATION_REQUEST}
            element={user ? <VerificationRequest user={user} refreshUser={refreshUser} /> : <Navigate to={ROUTES.LOGIN} />}
          />

          {/* Admin Routes with Layout */}
          <Route
            path="/admin/*"
            element={
              user && user.role === 'Admin' ? (
                <AdminLayout user={user}>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard user={user} />} />
                    <Route path="users" element={<AdminUserRegistry user={user} />} />
                    <Route path="users/:id" element={<AdminUserDetail user={user} />} />
                    <Route path="users/:id/kyc" element={<AdminKycReview user={user} />} />
                    <Route path="rooms" element={<AdminRoomRegistry user={user} />} />
                    <Route path="rooms/:id" element={<AdminRoomDetail user={user} />} />
                    <Route path="complaints" element={<AdminComplaintRegistry user={user} />} />
                    <Route path="complaints/:id" element={<AdminComplaintDetail user={user} />} />
                    <Route path="settings" element={<AdminSettings user={user} />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" />} />
                  </Routes>
                </AdminLayout>
              ) : (
                <Navigate to={ROUTES.LOGIN} />
              )
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} />} />
        </Routes>
      </main>

      {!showLanding && !isAdminPath && <Footer />}
    </div>
  );
}

/**
 * Handles automatic redirection to the payments page when payment gateway 
 * callback parameters are detected in the URL, regardless of which page the 
 * user lands on first.
 */
function PaymentCallbackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Nucleaer Failsafe: If we land on dashboard (even for a second) with tokens, instantly move away
    const search = window.location.search;
    if (search.includes('pidx=') || search.includes('data=') || search.includes('oid=')) {
      navigate(`${ROUTES.TENANT_PAYMENTS}${search}`, { replace: true });
      return;
    }
  }, [navigate]);

  return null;
}

export default App;