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

  // red border on error, normal otherwise
  const inputStyle = (hasError) => ({
    width: '100%', padding: '11px 14px 11px 38px', fontSize: '14px',
    border: hasError ? '1.5px solid #fa5252' : '1.5px solid #e8eaf0',
    borderRadius: '10px', outline: 'none', boxSizing: 'border-box',
    color: '#1a1a2e', background: '#fafbff'
  });
  const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' };
  const iconWrap = { position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4ff', fontFamily: "'Segoe UI', sans-serif", padding: '20px' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: '940px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', minHeight: '580px' }}>

        {/* LEFT PANEL - branding, doesn't change between steps */}
        <div style={{ width: '42%', background: 'linear-gradient(145deg, #3b5bdb 0%, #4c6ef5 60%, #5c7cfa 100%)', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          {/* decorative background circles */}
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
              <div style={{ width: '36px', height: '36px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="#3b5bdb" />
                  <rect x="9" y="13" width="6" height="8" rx="1" fill="white" />
                </svg>
              </div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>Stay Spot</span>
            </div>

            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 800, lineHeight: 1.25, marginBottom: '14px', letterSpacing: '-0.5px' }}>
              Join Smart Room<br />Renting Community
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.6, marginBottom: '36px' }}>
              Connect with verified owners and tenants. Find your perfect space or list your property with ease.
            </p>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>🏠 Join 50,000+ users already on RoomRent</div>
        </div>

        {/* RIGHT PANEL - changes based on step */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '40px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>

          {/*registration form */}
          {step === 'form' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a2e', marginBottom: '6px' }}>Create Account</h2>
              <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>Sign up to get started with Stay Spot</p>

              {errorMessage && (
                <div style={{ background: '#fff5f5', border: '1px solid #ffc9c9', color: '#c92a2a', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div style={{ background: '#f3fff3', border: '1px solid #b2f2bb', color: '#2f9e44', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleRequestOtp}>
                {/* full name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}>👤</span>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="John Doe" style={inputStyle(!!errors.full_name)} />
                  </div>
                  {errors.full_name && <p style={{ color: '#fa5252', fontSize: '12px', marginTop: '4px' }}>{errors.full_name}</p>}
                </div>

                {/* email */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}>✉️</span>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" style={inputStyle(!!errors.email)} />
                  </div>
                  {errors.email && <p style={{ color: '#fa5252', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
                </div>

                {/* phone */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}>📞</span>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+977-9800000000" style={inputStyle(!!errors.phone)} />
                  </div>
                  {errors.phone && <p style={{ color: '#fa5252', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</p>}
                </div>

                {/* password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}>🔒</span>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" style={inputStyle(!!errors.password)} />
                  </div>
                  {errors.password && <p style={{ color: '#fa5252', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
                </div>

                {/* confirm password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}>🔒</span>
                    <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} placeholder="Repeat your password" style={inputStyle(!!errors.confirm_password)} />
                  </div>
                  {errors.confirm_password && <p style={{ color: '#fa5252', fontSize: '12px', marginTop: '4px' }}>{errors.confirm_password}</p>}
                </div>

                {/* role dropdown */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>I am a...</label>
                  <select name="role" value={formData.role} onChange={handleChange} style={{ ...inputStyle(false), paddingLeft: '14px' }}>
                    <option value="Tenant">Tenant (looking for a room)</option>
                    <option value="Owner">Owner (listing a room)</option>
                  </select>
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', backgroundColor: loading ? '#a5b4fc' : '#3b5bdb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Sending OTP...' : 'Continue →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#888' }}>
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} style={{ color: '#3b5bdb', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
              </p>
            </div>
          )}

          {/*OTP verification */}
          {step === 'email_otp' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a2e', marginBottom: '6px' }}>Check Your Email</h2>
              <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>
                We sent a 6-digit code to <strong>{formData.email}</strong>
              </p>

              {errorMessage && (
                <div style={{ background: '#fff5f5', border: '1px solid #ffc9c9', color: '#c92a2a', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div style={{ background: '#f3fff3', border: '1px solid #b2f2bb', color: '#2f9e44', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Enter Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    style={{ ...inputStyle(false), paddingLeft: '14px', letterSpacing: '8px', fontSize: '22px', textAlign: 'center' }}
                  />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', backgroundColor: loading ? '#a5b4fc' : '#3b5bdb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '14px' }}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>

                {/* disabled while timer is running */}
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={resendTimer > 0}
                  style={{ width: '100%', padding: '11px', backgroundColor: 'transparent', color: resendTimer > 0 ? '#bbb' : '#3b5bdb', border: '1.5px solid', borderColor: resendTimer > 0 ? '#ddd' : '#3b5bdb', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: resendTimer > 0 ? 'not-allowed' : 'pointer' }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#888' }}>
                Wrong email?{' '}
                <span onClick={() => setStep('form')} style={{ color: '#3b5bdb', fontWeight: 600, cursor: 'pointer' }}>Go Back</span>
              </p>
            </div>
          )}

          {/*success, auto redirects to login */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a2e', marginBottom: '10px' }}>You're In!</h2>
              <p style={{ fontSize: '14px', color: '#888', marginBottom: '6px' }}>Your account has been created successfully.</p>
              <p style={{ fontSize: '13px', color: '#aaa' }}>Redirecting to login in 2 seconds...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Register;