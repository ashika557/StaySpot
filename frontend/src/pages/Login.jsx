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
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4ff] font-sans p-5">
      <div className="flex w-full max-w-[940px] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] min-h-[580px] bg-white">
        
        {/* LEFT PANEL */}
        <div className="w-[42%] hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-indigo-600">
          
          {/* Logo Top Left */}
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 bg-white rounded-[14px] flex items-center justify-center shrink-0 shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" />
                <path d="M9 21V12h6v9" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-white font-black text-2xl tracking-tighter">StaySpot</span>
          </div>

          {/* Bottom Advertising Text */}
          <div className="z-10 mt-auto">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="white" strokeWidth="2" />
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-white text-xs font-bold tracking-[0.15em] uppercase">Secure Access</span>
            </div>
            <h1 className="text-white text-5xl font-extrabold leading-[1.1] mb-5 tracking-tight font-sans">
              Welcome<br/>Back
            </h1>
            <p className="text-white/80 text-base leading-relaxed max-w-sm font-medium">
              Manage your rentals and bookings with the most advanced platform in the market.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Sign In</h2>
            <p className="text-sm text-gray-500 font-medium">Access your account to continue</p>
          </div>

          {/* Role selector buttons */}
          <div className="mb-6">
            <div className="flex bg-[#f4f6fc] p-1.5 rounded-[14px]">
              {['Tenant', 'Owner'].map(r => (
                <button
                  key={r}
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all duration-200 tracking-wider uppercase ${
                    formData.role === r 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-[#8792a6] hover:text-indigo-500'
                  }`}
                  onClick={() => setFormData(p => ({ ...p, role: r }))}
                >
                  <span className="text-sm">{r === 'Tenant' ? '👤' : '🏢'}</span> {r} Login
                </button>
              ))}
            </div>
          </div>

          {/* API Errors */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email field */}
            <div>
              <label className="block text-xs font-extrabold text-[#8792a6] mb-2 uppercase tracking-wider">Email or Phone</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">✉️</span>
                <input 
                  name="email" 
                  type="text" 
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="Enter email or phone number"
                  className={`w-full py-3.5 pl-11 pr-4 text-sm rounded-xl outline-none transition-colors border-2 ${
                    errors.email ? 'bg-red-50 border-red-200 focus:border-red-400' : 'bg-[#f4f6fc] border-transparent focus:bg-white focus:border-indigo-600 text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.email}</p>}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-extrabold text-[#8792a6] mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔒</span>
                <input 
                  name="password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={formData.password} 
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full py-3.5 pl-11 pr-11 text-sm rounded-xl outline-none transition-colors border-2 ${
                    errors.password ? 'bg-red-50 border-red-200 focus:border-red-400' : 'bg-[#f4f6fc] border-transparent focus:bg-white focus:border-indigo-600 text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium'
                  }`}
                />
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.password}</p>}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end mt-1">
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-indigo-600 font-extrabold uppercase tracking-wider hover:text-indigo-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <div className="mt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className={`w-full py-3.5 text-[13px] font-black tracking-[0.15em] text-white rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.35)] uppercase ${
                  loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {loading ? 'SIGNING IN...' : 'LOGIN →'}
              </button>
            </div>

            {/* Signup link */}
            <div className="text-center mt-6 text-sm text-gray-500 font-medium">
              New here?{' '}
              <Link to={ROUTES.REGISTER} className="text-indigo-600 font-black hover:text-indigo-700 transition-colors">
                CREATE ACCOUNT
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;