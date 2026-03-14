import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCsrfToken, apiRequest } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

function Register({ onLogin }) {
  const navigate = useNavigate();

  // form inputs
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: '', role: 'Tenant'
  });

  const [errors, setErrors] = useState({});        // field-level errors
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  // controls which screen to show: 'form' → 'email_otp' → 'success'
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0); // cooldown before resend

  // get CSRF token once on mount
  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);

  // countdown timer for resend button
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval); // cleanup to avoid memory leak
  }, [resendTimer]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Full Name is required';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\+?[\d\s-]{10,15}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Min. 8 characters';

    if (!formData.confirm_password) newErrors.confirm_password = 'Please confirm your password';
    else if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // update formData on every keystroke, clear that field's error
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  //submit → request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiRequest('/request-registration-otp/', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email })
      }, csrfToken);

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('Verification code sent to your email!');
        setStep('email_otp');
        setResendTimer(60);
        if (result.otp_dev) console.log("DEV OTP:", result.otp_dev); // remove in production
      } else {
        setErrorMessage(result.error || 'Failed to send code.');
      }
    } catch {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  //submit → verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otp || otp.length !== 6) {
      setErrorMessage('Please enter a 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/verify-registration-otp/', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, otp_code: otp })
      }, csrfToken);

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Email verified! Completing registration...');
        await finalizeRegistration();
      } else {
        setErrorMessage(data.error || 'Verification failed.');
      }
    } catch {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  //create the account
  const finalizeRegistration = async () => {
    try {
      // using FormData (not JSON) to support file uploads later
      const data = new FormData();
      data.append('full_name', formData.full_name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('password', formData.password);
      data.append('role', formData.role);

      const response = await apiRequest('/register/', { method: 'POST', body: data }, csrfToken);
      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('Registration successful! Redirecting...');
        setStep('success');
        setTimeout(() => navigate(ROUTES.LOGIN), 2000);
      } else {
        setErrorMessage(result.error || 'Registration failed.');
        setStep('form'); // go back if something went wrong
      }
    } catch {
      setErrorMessage('Network error during registration.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 font-sans p-5">
      <div className="flex w-full max-w-[940px] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] min-h-[580px] bg-white">

        {/* LEFT PANEL */}
        <div className="hidden md:flex w-[42%] flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-12 relative overflow-hidden">
          {/* decorative background circles */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />

          <div className="z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="#3b5bdb" />
                  <rect x="9" y="13" width="6" height="8" rx="1" fill="white" />
                </svg>
              </div>
              <span className="text-white font-extrabold text-xl tracking-tight">Stay Spot</span>
            </div>

            <h1 className="text-white text-3xl font-extrabold leading-[1.2] mb-4 tracking-tight">
              Join Smart Room<br />Renting Community
            </h1>
            <p className="text-white/80 text-sm leading-relaxed mb-8">
              Connect with verified owners and tenants. Find your perfect space or list your property with ease.
            </p>
          </div>
          <div className="text-white/60 text-xs z-10 font-medium tracking-wide">🏠 Join 50,000+ users already on RoomRent</div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white p-8 md:p-12 flex flex-col justify-center overflow-y-auto">

          {/* registration form */}
          {step === 'form' && (
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Create Account</h2>
              <p className="text-sm text-gray-500 mb-6">Sign up to get started with Stay Spot</p>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4 font-medium mt-2">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 font-medium mt-2">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                {/* full name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">👤</span>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="John Doe" 
                           className={`w-full py-2.5 pl-10 pr-4 text-sm rounded-lg outline-none transition-colors border-2 bg-gray-50 focus:bg-white placeholder:text-gray-400 ${errors.full_name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'}`} />
                  </div>
                  {errors.full_name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.full_name}</p>}
                </div>

                {/* email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">✉️</span>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" 
                           className={`w-full py-2.5 pl-10 pr-4 text-sm rounded-lg outline-none transition-colors border-2 bg-gray-50 focus:bg-white placeholder:text-gray-400 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'}`} />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
                </div>

                {/* phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">📞</span>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+977-9800000000" 
                           className={`w-full py-2.5 pl-10 pr-4 text-sm rounded-lg outline-none transition-colors border-2 bg-gray-50 focus:bg-white placeholder:text-gray-400 ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'}`} />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.phone}</p>}
                </div>

                {/* password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">🔒</span>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" 
                           className={`w-full py-2.5 pl-10 pr-4 text-sm rounded-lg outline-none transition-colors border-2 bg-gray-50 focus:bg-white placeholder:text-gray-400 ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'}`} />
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
                </div>

                {/* confirm password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">🔒</span>
                    <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} placeholder="Repeat your password" 
                           className={`w-full py-2.5 pl-10 pr-4 text-sm rounded-lg outline-none transition-colors border-2 bg-gray-50 focus:bg-white placeholder:text-gray-400 ${errors.confirm_password ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'}`} />
                  </div>
                  {errors.confirm_password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.confirm_password}</p>}
                </div>

                {/* role dropdown */}
                <div className="mb-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">I am a...</label>
                  <div className="relative">
                    <select name="role" value={formData.role} onChange={handleChange} 
                            className="w-full py-2.5 px-4 text-sm rounded-lg outline-none transition-colors border-2 bg-gray-50 focus:bg-white border-gray-200 focus:border-blue-600 appearance-none">
                      <option value="Tenant">Tenant (looking for a room)</option>
                      <option value="Owner">Owner (listing a room)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} 
                        className={`w-full py-3 mt-2 text-sm font-bold text-white rounded-lg transition-all shadow-[0_4px_14px_rgba(37,99,235,0.35)] ${loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-700 to-blue-500 hover:-translate-y-0.5 hover:shadow-lg'}`}>
                  {loading ? 'Sending OTP...' : 'Continue →'}
                </button>
              </form>

              <div className="text-center mt-6 text-sm text-gray-500">
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="text-blue-600 font-bold hover:text-blue-700 transition-colors">Sign In</Link>
              </div>
            </div>
          )}

          {/* OTP verification */}
          {step === 'email_otp' && (
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Check Your Email</h2>
              <p className="text-sm text-gray-500 mb-6">
                We sent a 6-digit code to <strong className="text-gray-800">{formData.email}</strong>
              </p>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4 font-medium">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 font-medium">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="flex flex-col">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full py-3.5 px-4 text-2xl font-bold tracking-[0.5em] text-center rounded-xl outline-none transition-colors border-2 bg-gray-50 focus:bg-white border-blue-400 focus:border-blue-600"
                  />
                </div>

                <button type="submit" disabled={loading} 
                        className={`w-full py-3 text-sm font-bold text-white rounded-lg transition-all shadow-[0_4px_14px_rgba(37,99,235,0.35)] mb-4 ${loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-700 to-blue-500 hover:-translate-y-0.5 hover:shadow-lg'}`}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>

                {/* disabled while timer is running */}
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={resendTimer > 0}
                  className={`w-full py-2.5 text-sm font-bold border-2 rounded-lg transition-colors ${resendTimer > 0 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </form>

              <div className="text-center mt-5 text-sm text-gray-500">
                Wrong email?{' '}
                <button onClick={() => setStep('form')} className="text-blue-600 font-bold hover:text-blue-700 transition-colors">Go Back</button>
              </div>
            </div>
          )}

          {/* success, auto redirects to login */}
          {step === 'success' && (
            <div className="text-center py-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">You're In!</h2>
              <p className="text-sm text-gray-600 mb-6 font-medium">Your account has been created successfully.</p>
              <div className="inline-block px-4 py-2 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-500 font-semibold flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Redirecting to login...
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Register;