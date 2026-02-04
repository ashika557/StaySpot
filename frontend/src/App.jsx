import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
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
import OwnerBookings from './pages/OwnerBookings';
import Profile from './pages/Profile';
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
      refreshUser();
    }
  }, []);

  const refreshUser = async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.GET_USER);
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
    <Router>
      <Navigation user={user} onLogout={handleLogout} showLanding={showLanding} />

      <Routes>
        {/* Landing page */}
        <Route
          path={ROUTES.HOME}
          element={
            showLanding ? (
              <StaySpotLanding
                onGetStarted={() => setShowLanding(false)}
                onSignIn={() => setShowLanding(false)}
              />
            ) : user ? (
              <Navigate
                to={user.role === 'Owner' ? ROUTES.OWNER_DASHBOARD : ROUTES.TENANT_DASHBOARD}
              />
            ) : (
              <Navigate to={ROUTES.LOGIN} />
            )
          }
        />

        {/* Auth routes */}
        <Route
          path={ROUTES.LOGIN}
          element={
            user ? (
              <Navigate to={user.role === 'Owner' ? ROUTES.OWNER_DASHBOARD : ROUTES.TENANT_DASHBOARD} />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        <Route
          path={ROUTES.REGISTER}
          element={
            user ? (
              <Navigate to={user.role === 'Owner' ? ROUTES.OWNER_DASHBOARD : ROUTES.TENANT_DASHBOARD} />
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
          element={user && user.role === 'Tenant' ? <SearchRooms user={user} /> : <Navigate to={ROUTES.LOGIN} />}
        />
        <Route
          path={ROUTES.TENANT_DASHBOARD}
          element={user && user.role === 'Tenant' ? <TenantDashboard user={user} /> : <Navigate to={ROUTES.LOGIN} />}
        />
        <Route
          path={ROUTES.TENANT_BOOKINGS}
          element={user && user.role === 'Tenant' ? <TenantBookings user={user} /> : <Navigate to={ROUTES.LOGIN} />}
        />
        <Route
          path={ROUTES.ROOM_DETAILS}
          element={user ? <RoomDetails user={user} /> : <Navigate to={ROUTES.LOGIN} />}
        />

        <Route
          path={ROUTES.OWNER_DASHBOARD}
          element={user && user.role === 'Owner' ? <OwnerDashboard user={user} onLogout={handleLogout} /> : <Navigate to={ROUTES.LOGIN} />}
        />
        <Route
          path={ROUTES.OWNER_ROOMS}
          element={user && user.role === 'Owner' ? <OwnerRooms user={user} refreshUser={refreshUser} onLogout={handleLogout} /> : <Navigate to={ROUTES.LOGIN} />}
        />
        <Route
          path={ROUTES.OWNER_BOOKINGS}
          element={user && user.role === 'Owner' ? <OwnerBookings user={user} onLogout={handleLogout} /> : <Navigate to={ROUTES.LOGIN} />}
        />

        <Route
          path={ROUTES.CHAT}
          element={user ? <Chat user={user} /> : <Navigate to={ROUTES.LOGIN} />}
        />
        <Route
          path={ROUTES.PROFILE}
          element={user ? <Profile user={user} refreshUser={refreshUser} onUpdateUser={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }} /> : <Navigate to={ROUTES.LOGIN} />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} />} />
      </Routes>
    </Router>
  );
}

export default App;