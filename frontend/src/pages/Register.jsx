import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCsrfToken, apiRequest } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'Tenant'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => { getCsrfToken().then(setCsrfToken); }, []);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.confirm_password) newErrors.confirm_password = 'Please confirm your password';
    else if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage(''); setSuccessMessage('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await apiRequest('/request-registration-otp/', { method: 'POST', body: JSON.stringify({ email: formData.email }) }, csrfToken);
      const result = await response.json();
      if (response.ok) {
        setSuccessMessage('Verification code sent to your email!');
        setStep('email_otp'); setResendTimer(60);
        if (result.otp_dev) console.log("REG OTP:", result.otp_dev);
      } else { setErrorMessage(result.error || 'Failed to send verification code.'); }
    } catch { setErrorMessage('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage(''); setSuccessMessage('');
    if (!otp || otp.length !== 6) { setErrorMessage('Please enter a 6-digit code.'); return; }
    setLoading(true);
    try {
      const response = await apiRequest('/verify-registration-otp/', { method: 'POST', body: JSON.stringify({ email: formData.email, otp_code: otp }) }, csrfToken);
      const data = await response.json();
      if (response.ok) { setSuccessMessage('Email verified! Completing registration...'); await finalizeRegistration(); }
      else { setErrorMessage(data.error || 'Verification failed.'); }
    } catch { setErrorMessage('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const finalizeRegistration = async () => {
    try {
      const data = new FormData();
      data.append('full_name', formData.full_name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('password', formData.password);
      data.append('role', formData.role);
      const response = await apiRequest('/register/', { method: 'POST', body: data }, csrfToken);
      const result = await response.json();
      if (response.ok) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        setStep('success');
        setTimeout(() => navigate(ROUTES.LOGIN), 2000);
      } else { setErrorMessage(result.error || 'Registration failed.'); setStep('form'); }
    } catch { setErrorMessage('Network error during final registration.'); }
  };

  const inputStyle = (hasError) => ({
    width: '100%', padding: '11px 14px 11px 38px', fontSize: '14px',
    border: hasError ? '1.5px solid #fa5252' : '1.5px solid #e8eaf0',
    borderRadius: '10px', outline: 'none', boxSizing: 'border-box',
    color: '#1a1a2e', background: '#fafbff'
  });

  const labelStyle = {
    fontSize: '13px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px'
  };

  const iconWrap = {
    position: 'absolute', left: '13px', top: '50%',
    transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none'
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#f0f4ff', fontFamily: "'Segoe UI', sans-serif", padding: '20px'
    }}>
      <div style={{
        display: 'flex', width: '100%', maxWidth: '940px',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)', minHeight: '580px'
      }}>

        {/* LEFT PANEL */}
        <div style={{
          width: '42%',
          background: 'linear-gradient(145deg, #3b5bdb 0%, #4c6ef5 60%, #5c7cfa 100%)',
          padding: '48px 40px', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <div>
            {/* Logo */}
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

            {[
              { icon: '✓', text: 'Verified Listings', sub: 'All properties and users are verified for your safety' },
              { icon: '⚡', text: 'Instant Booking', sub: 'Book rooms instantly or list properties in minutes' },
              { icon: '🕐', text: '24/7 Support', sub: 'Our team is always here to help you' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{item.text}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px' }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>
            🏠 Join 50,000+ users already on RoomRent
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '40px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>

          {/* STEP: FORM */}
          {step === 'form' && (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a2e', marginBottom: '4px', letterSpacing: '-0.4px' }}>Create Account</h2>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>Get started with your free account</p>

              {/* Role selector */}
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '13px', color: '#555', fontWeight: 600, marginBottom: '10px' }}>I want to join as</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { value: 'Tenant', label: 'Tenant', sub: 'Find and book rooms' },
                    { value: 'Owner', label: 'Owner', sub: 'List your properties' }
                  ].map(role => (
                    <div key={role.value} onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                      style={{
                        flex: 1, padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                        border: formData.role === role.value ? '2px solid #3b5bdb' : '2px solid #e8eaf0',
                        background: formData.role === role.value ? '#f0f4ff' : 'white',
                        textAlign: 'center', transition: 'all 0.2s'
                      }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{role.value === 'Tenant' ? '👤' : '🏠'}</div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: formData.role === role.value ? '#3b5bdb' : '#444' }}>{role.label}</div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{role.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div style={{ background: '#fff0f0', border: '1px solid #ffc9c9', color: '#c92a2a', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleRequestOtp}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>

                  {/* Full Name */}
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconWrap}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/></svg>
                      </span>
                      <input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleChange}
                        placeholder="Enter your full name" style={inputStyle(errors.full_name)}
                        onFocus={e => e.target.style.borderColor = '#3b5bdb'}
                        onBlur={e => e.target.style.borderColor = errors.full_name ? '#fa5252' : '#e8eaf0'} />
                    </div>
                    {errors.full_name && <p style={{ color: '#fa5252', fontSize: '12px', margin: '4px 0 0' }}>{errors.full_name}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconWrap}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.34 2.18 2 2 0 012.32.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-.77a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.5v1.42z" strokeLinecap="round"/></svg>
                      </span>
                      <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange}
                        placeholder="+977 XXXXXXXXXX" style={inputStyle(errors.phone)}
                        onFocus={e => e.target.style.borderColor = '#3b5bdb'}
                        onBlur={e => e.target.style.borderColor = errors.phone ? '#fa5252' : '#e8eaf0'} />
                    </div>
                    {errors.phone && <p style={{ color: '#fa5252', fontSize: '12px', margin: '4px 0 0' }}>{errors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconWrap}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                      </span>
                      <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                        placeholder="your@email.com" style={inputStyle(errors.email)}
                        onFocus={e => e.target.style.borderColor = '#3b5bdb'}
                        onBlur={e => e.target.style.borderColor = errors.email ? '#fa5252' : '#e8eaf0'} />
                    </div>
                    {errors.email && <p style={{ color: '#fa5252', fontSize: '12px', margin: '4px 0 0' }}>{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconWrap}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      </span>
                      <input id="password" name="password" type="password" value={formData.password} onChange={handleChange}
                        placeholder="Min. 8 characters" style={inputStyle(errors.password)}
                        onFocus={e => e.target.style.borderColor = '#3b5bdb'}
                        onBlur={e => e.target.style.borderColor = errors.password ? '#fa5252' : '#e8eaf0'} />
                    </div>
                    {errors.password && <p style={{ color: '#fa5252', fontSize: '12px', margin: '4px 0 0' }}>{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={labelStyle}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconWrap}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      </span>
                      <input id="confirm_password" name="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange}
                        placeholder="Re-enter password" style={inputStyle(errors.confirm_password)}
                        onFocus={e => e.target.style.borderColor = '#3b5bdb'}
                        onBlur={e => e.target.style.borderColor = errors.confirm_password ? '#fa5252' : '#e8eaf0'} />
                    </div>
                    {errors.confirm_password && <p style={{ color: '#fa5252', fontSize: '12px', margin: '4px 0 0' }}>{errors.confirm_password}</p>}
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '13px', fontSize: '14px', fontWeight: 700,
                  background: loading ? '#748ffc' : 'linear-gradient(135deg, #3b5bdb, #4c6ef5)',
                  color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 14px rgba(59,91,219,0.35)', marginBottom: '14px'
                }}>
                  {loading ? 'Sending code...' : 'Continue →'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', margin: 0 }}>
                  Already have an account?{' '}
                  <Link to={ROUTES.LOGIN} style={{ color: '#3b5bdb', fontWeight: 700, textDecoration: 'none' }}>Login</Link>
                </p>
              </form>
            </>
          )}

          {/* STEP: OTP */}
          {step === 'email_otp' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ width: '60px', height: '60px', background: '#f0f4ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', marginBottom: '8px' }}>Verify your email</h2>
                <p style={{ color: '#888', fontSize: '14px' }}>We've sent a 6-digit code to</p>
                <p style={{ color: '#3b5bdb', fontWeight: 700, fontSize: '14px' }}>{formData.email}</p>
              </div>

              {errorMessage && (
                <div style={{ background: '#fff0f0', border: '1px solid #ffc9c9', color: '#c92a2a', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px', textAlign: 'center' }}>
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div style={{ background: '#f0fff4', border: '1px solid #b2f2bb', color: '#2f9e44', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px', textAlign: 'center' }}>
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                  <input
                    id="otp" name="otp" type="text" maxLength="6"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000" autoFocus
                    style={{
                      width: '180px', padding: '16px', fontSize: '28px', fontWeight: 800,
                      textAlign: 'center', letterSpacing: '0.3em',
                      border: '2px solid #3b5bdb', borderRadius: '14px', outline: 'none',
                      color: '#1a1a2e', background: '#f8f9ff', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button type="submit" disabled={loading || otp.length !== 6} style={{
                  width: '100%', padding: '13px', fontSize: '14px', fontWeight: 700,
                  background: (loading || otp.length !== 6) ? '#aab4f5' : 'linear-gradient(135deg, #3b5bdb, #4c6ef5)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(59,91,219,0.25)', marginBottom: '16px'
                }}>
                  {loading ? 'Verifying...' : 'Verify & Continue →'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <button type="button" onClick={handleRequestOtp} disabled={resendTimer > 0 || loading}
                    style={{ background: 'none', border: 'none', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer', color: resendTimer > 0 ? '#aaa' : '#3b5bdb', fontWeight: 600, fontSize: '13px', marginBottom: '8px', display: 'block', width: '100%' }}>
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive the code? Resend"}
                  </button>
                  <button type="button" onClick={() => setStep('form')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '13px' }}>
                    ← Edit email / Back
                  </button>
                </div>
              </form>
            </>
          )}

          {/* STEP: SUCCESS */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '72px', height: '72px', background: '#f0fff4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2f9e44" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', marginBottom: '8px' }}>Account Created!</h2>
              <p style={{ color: '#888', fontSize: '14px' }}>Redirecting you to login...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;