import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCsrfToken, apiRequest } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

function Register({ onLogin }) {
  const navigate = useNavigate();

  // form inputs
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', confirm_password: '', role: 'Tenant'
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

  // Password rules
  const passwordRules = [
    { label: 'At least 8 characters',       test: (p) => p.length >= 8 },
    { label: 'One uppercase letter (A–Z)',   test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter (a–z)',   test: (p) => /[a-z]/.test(p) },
    { label: 'One number (0–9)',             test: (p) => /[0-9]/.test(p) },
  ];

  const [passwordTouched, setPasswordTouched] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Full Name is required';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@gmail\.com$/.test(formData.email.trim().toLowerCase())) newErrors.email = 'Must be a valid @gmail.com address';

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const failedRules = passwordRules.filter(r => !r.test(formData.password));
      if (failedRules.length > 0) newErrors.password = 'Password does not meet all requirements.';
    }

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
              <span className="text-white text-xs font-bold tracking-[0.15em] uppercase">Secure & Verified</span>
            </div>
            <h1 className="text-white text-5xl font-extrabold leading-[1.1] mb-5 tracking-tight font-sans">
              Welcome to<br/>StaySpot
            </h1>
            <p className="text-white/80 text-base leading-relaxed max-w-sm font-medium">
              Find your perfect room in minutes and manage your rental portfolio with ease.
            </p>
          </div>
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
                <div className="mb-2">
                  <label className="block text-xs font-extrabold text-[#8792a6] mb-2 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">👤</span>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="John Doe"
                      className={`w-full py-3.5 pl-11 pr-4 text-sm rounded-xl outline-none transition-colors border-2 ${errors.full_name ? 'bg-red-50 border-red-200 focus:border-red-400' : 'bg-[#f4f6fc] border-transparent focus:bg-white focus:border-indigo-600 text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium'}`} />
                  </div>
                  {errors.full_name && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.full_name}</p>}
                </div>

                {/* email */}
                <div className="mb-2">
                  <label className="block text-xs font-extrabold text-[#8792a6] mb-2 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">✉️</span>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@gmail.com"
                      className={`w-full py-3.5 pl-11 pr-4 text-sm rounded-xl outline-none transition-colors border-2 ${errors.email ? 'bg-red-50 border-red-200 focus:border-red-400' : 'bg-[#f4f6fc] border-transparent focus:bg-white focus:border-indigo-600 text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium'}`} />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.email}</p>}
                </div>

                {/* password */}
                <div className="mb-2">
                  <label className="block text-xs font-extrabold text-[#8792a6] mb-2 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔒</span>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setPasswordTouched(true)}
                      placeholder="••••••••"
                      className={`w-full py-3.5 pl-11 pr-4 text-sm rounded-xl outline-none transition-colors border-2 ${errors.password ? 'bg-red-50 border-red-200 focus:border-red-400' : 'bg-[#f4f6fc] border-transparent focus:bg-white focus:border-indigo-600 text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium'}`}
                    />
                  </div>

                  {/* Live password requirements */}
                  {passwordTouched && (
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Password must have:</p>
                      <ul className="space-y-1">
                        {passwordRules.map((rule) => {
                          const passed = rule.test(formData.password);
                          return (
                            <li key={rule.label} className={`flex items-center gap-2 text-xs font-semibold transition-colors ${passed ? 'text-green-600' : 'text-gray-400'}`}>
                              <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-black ${
                                passed ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {passed ? '✓' : '×'}
                              </span>
                              {rule.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {errors.password && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.password}</p>}
                </div>

                {/* confirm password */}
                <div className="mb-2">
                  <label className="block text-xs font-extrabold text-[#8792a6] mb-2 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔒</span>
                    <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} placeholder="••••••••"
                      className={`w-full py-3.5 pl-11 pr-4 text-sm rounded-xl outline-none transition-colors border-2 ${errors.confirm_password ? 'bg-red-50 border-red-200 focus:border-red-400' : 'bg-[#f4f6fc] border-transparent focus:bg-white focus:border-indigo-600 text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium'}`} />
                  </div>
                  {errors.confirm_password && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.confirm_password}</p>}
                </div>

                {/* role selector button toggle */}
                <div className="mb-2">
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
                        <span className="text-sm">{r === 'Tenant' ? '👤' : '🏢'}</span> {r} Account
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <button type="submit" disabled={loading}
                    className={`w-full py-3.5 text-[13px] font-black tracking-[0.15em] text-white rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.35)] uppercase ${loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5'}`}>
                    {loading ? 'Sending OTP...' : 'REGISTER →'}
                  </button>
                </div>
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