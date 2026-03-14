import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCsrfToken, apiRequest, setUser } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  
  // 1. Form state
  // We keep track of what the user types in email, password, and role
  const [formData, setFormData] = useState({ email: '', password: '', role: 'Tenant' });
  const [errors, setErrors] = useState({}); // Stores errors for each input
  const [loading, setLoading] = useState(false); // Loading spinner state
  const [errorMessage, setErrorMessage] = useState(''); // General API errors
  const [csrfToken, setCsrfToken] = useState(''); // Security token for backend
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility

  // 2. Get CSRF token once when the page loads
  useEffect(() => { 
    getCsrfToken().then(setCsrfToken); 
  }, []);

  // 3. Check inputs before sending to backend
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email or phone is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true if no errors
  };

  // 4. Update form state as user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for the field as soon as user starts typing
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errorMessage) setErrorMessage('');
  };

  // 5. Submit form to backend
  const handleSubmit = async (e) => {
    e.preventDefault(); // Don't reload the page
    setErrorMessage('');

    if (!validateForm()) return; // Stop if validation fails
    
    setLoading(true); // Show loading on button
    try {
      const response = await apiRequest(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password, 
          role: formData.role 
        })
      }, csrfToken);
      
      const data = await response.json();
      
      if (response.ok) {
        // 6. Login success
        setUser(data.user); // Save user data
        onLogin(data.user); // Update app-level state

        // Go to dashboard based on role
        const role = data.user?.role;
        if (role === 'Admin') navigate(ROUTES.ADMIN_DASHBOARD);
        else if (role === 'Owner') navigate(ROUTES.OWNER_DASHBOARD);
        else navigate(ROUTES.TENANT_DASHBOARD);
      } else {
        // Show backend errors (wrong password, account disabled, etc.)
        setErrorMessage(data.error || 'Login failed. Check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Network error. Make sure the backend is running.');
    } finally {
      setLoading(false); // Stop loading spinner
    } // stop loading
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 font-sans p-5">
      <div className="flex w-full max-w-[940px] min-h-[580px] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] bg-white">
        
        {/* LEFT: Branding info */}
        <div className="w-[42%] hidden md:flex flex-col items-center justify-center p-12 text-center relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
          
          <div className="flex items-center gap-3 mb-5 z-10">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="#3b5bdb" />
                <rect x="9" y="13" width="6" height="8" rx="1" fill="white" />
              </svg>
            </div>
            <span className="text-white font-extrabold text-2xl tracking-tight">Stay Spot</span>
          </div>
          <p className="text-white/80 text-sm leading-relaxed z-10">
            Find your perfect room or manage your properties with our intelligent platform. Connect tenants and owners seamlessly.
          </p>
        </div>

        {/* RIGHT: Login form */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 md:px-12 py-10 relative">
          <div className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Welcome Back</div>
          <div className="text-sm text-gray-500 mb-7">Sign in to your account</div>

          {/* Role selector buttons */}
          <div className="flex gap-3 mb-5">
            {['Tenant', 'Owner'].map(r => (
              <button
                key={r}
                type="button"
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition-all duration-150 ${
                  formData.role === r 
                    ? 'border-blue-600 bg-blue-50 text-blue-600' 
                    : 'border-gray-200 bg-white text-gray-500 hover:border-blue-200'
                }`}
                onClick={() => setFormData(p => ({ ...p, role: r }))}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Show API errors */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Email field */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email or Phone</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                </span>
                <input 
                  name="email" 
                  type="text" 
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="Enter email or phone number"
                  className={`w-full py-2.5 pl-10 pr-4 text-sm rounded-lg outline-none transition-colors border-2 bg-gray-50 focus:bg-white placeholder:text-gray-400 ${
                    errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
            </div>

            {/* Password field */}
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </span>
                <input 
                  name="password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={formData.password} 
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full py-2.5 pl-10 pr-10 text-sm rounded-lg outline-none transition-colors border-2 bg-gray-50 focus:bg-white placeholder:text-gray-400 ${
                    errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
                  }`}
                />
                {/* Toggle password visibility */}
                <button 
                  type="button" 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end mb-6 mt-1">
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                Forgot your password?
              </Link>
            </div>

            {/* Submit button */}
            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-3 text-sm font-bold text-white rounded-lg transition-all duration-200 mb-5 shadow-[0_4px_14px_rgba(37,99,235,0.35)] ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-700 to-blue-500 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Signup link */}
            <div className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER} className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                Sign up here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;