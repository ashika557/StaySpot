import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OwnerDashboard from './pages/OwnerDashboard';
import TenantDashboard from './pages/TenantDashboard';
import StaySpotLanding from './pages/LandingPage';
import { ROUTES } from './constants/api';

function App() {
  const [user, setUser] = useState(null);
  const [showLanding, setShowLanding] = useState(true);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setShowLanding(false);
    }
  }, []);

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

        {/* Dashboards */}
        <Route
          path={ROUTES.OWNER_DASHBOARD}
          element={user && user.role === 'Owner' ? <OwnerDashboard user={user} /> : <Navigate to={ROUTES.LOGIN} />}
        />
        <Route
          path={ROUTES.TENANT_DASHBOARD}
          element={user && user.role === 'Tenant' ? <TenantDashboard user={user} /> : <Navigate to={ROUTES.LOGIN} />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} />} />
      </Routes>
    </Router>
  );
}

export default App;
