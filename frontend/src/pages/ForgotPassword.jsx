import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('input'); // 'input', 'otp'
  const [inputType, setInputType] = useState('email'); // 'email', 'phone'
  const [inputValue, setInputValue] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleTabSwitch = (type) => {
    setInputType(type);
    setInputValue('');
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = inputType === 'phone' ? { phone: inputValue } : { phone: inputValue };
      const response = await apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, { method: 'POST', body: JSON.stringify(payload) });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'OTP sent!' });
        setStep('otp');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send OTP. Please try again.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await apiRequest(API_ENDPOINTS.VERIFY_FORGOT_PASSWORD_OTP, {
        method: 'POST',
        body: JSON.stringify({ phone: inputValue, otp_code: otp })
      });
      const data = await response.json();
      if (response.ok) {
        navigate(`/reset-password/${data.token}`);
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid or expired OTP.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Verification error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const S = {
    page: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8eef8 0%, #f5f7fc 50%, #eaf0fb 100%)',
      fontFamily: "'Segoe UI', sans-serif", padding: '20px'
    },
    layout: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '860px', gap: '60px' },
    left: { flex: 1, padding: '20px', maxWidth: '320px' },
    leftTitle: { fontSize: '24px', fontWeight: 800, color: '#1a1a2e', marginBottom: '14px', letterSpacing: '-0.3px' },
    leftDesc: { fontSize: '14px', color: '#6b7280', lineHeight: 1.7 },
    card: {
      background: 'white', borderRadius: '20px', padding: '40px 36px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.10)', width: '100%', maxWidth: '380px',
      border: '2.5px solid #94a3b8'
    },
    iconCircle: {
      width: '56px', height: '56px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 16px'
    },
    cardTitle: { fontSize: '20px', fontWeight: 800, color: '#1a1a2e', textAlign: 'center', marginBottom: '6px' },
    cardDesc: { fontSize: '13px', color: '#9ca3af', textAlign: 'center', marginBottom: '24px', lineHeight: 1.6 },
    tabRow: { display: 'flex', gap: '0', marginBottom: '20px', border: '1.5px solid #e5e7eb', borderRadius: '9px', overflow: 'hidden' },
    tab: (active) => ({
      flex: 1, padding: '9px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
      background: active ? '#2563eb' : 'white', color: active ? 'white' : '#6b7280',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s'
    }),
    label: { fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' },
    inputWrap: { position: 'relative', marginBottom: '18px' },
    inputIcon: { position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' },
    input: { width: '100%', padding: '11px 14px 11px 38px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#111827', background: 'white' },
    btn: (disabled) => ({
      width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700,
      background: disabled ? '#93c5fd' : '#2563eb', color: 'white', border: 'none',
      borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
      marginBottom: '14px', transition: 'background 0.2s'
    }),
    backLink: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px', color: '#2563eb', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', width: '100%' },
    msgBox: (type) => ({
      padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px',
      background: type === 'success' ? '#f0fdf4' : '#fef2f2',
      color: type === 'success' ? '#16a34a' : '#b91c1c',
      border: type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca'
    }),
    footer: { textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#9ca3af' },
    footerLink: { color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'block', marginTop: '4px' }
  };

  return (
    <div style={S.page}>
      <div style={S.layout}>

        {/* LEFT */}
        <div style={S.left}>
          <div style={S.leftTitle}>Forgot Your Password?</div>
          <p style={S.leftDesc}>
            No worries! It happens to the best of us. Enter your email or phone number and we'll help you reset your password quickly and securely.
          </p>
        </div>

        {/* CARD */}
        <div style={S.card}>

          {step === 'input' && (
            <>
              {/* Key icon */}
              <div style={S.iconCircle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7.5" cy="15.5" r="5.5"/>
                  <path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/>
                </svg>
              </div>

              <div style={S.cardTitle}>Reset Password</div>
              <p style={S.cardDesc}>Enter your email or phone number to receive a reset link</p>

              {/* Tabs */}
              <div style={S.tabRow}>
                <button type="button" style={S.tab(inputType === 'email')} onClick={() => handleTabSwitch('email')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                  Email
                </button>
                <button type="button" style={S.tab(inputType === 'phone')} onClick={() => handleTabSwitch('phone')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.34 2.18 2 2 0 012.32.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-.77a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.5v1.42z" strokeLinecap="round"/></svg>
                  Phone
                </button>
              </div>

              {message.text && <div style={S.msgBox(message.type)}>{message.text}</div>}

              <form onSubmit={handleSubmit}>
                <div>
                  <label style={S.label}>{inputType === 'email' ? 'Email Address' : 'Phone Number'}</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}>
                      {inputType === 'email'
                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.34 2.18 2 2 0 012.32.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-.77a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.5v1.42z" strokeLinecap="round"/></svg>
                      }
                    </span>
                    <input
                      type={inputType === 'email' ? 'email' : 'tel'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={inputType === 'email' ? 'Enter your email address' : 'Enter your phone number'}
                      required
                      style={S.input}
                      onFocus={e => e.target.style.borderColor = '#2563eb'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting || !inputValue} style={S.btn(isSubmitting || !inputValue)}>
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <button onClick={() => navigate(ROUTES.LOGIN)} style={S.backLink}>
                ← Back to Login
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div style={S.iconCircle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                </svg>
              </div>

              <div style={S.cardTitle}>Enter OTP</div>
              <p style={S.cardDesc}>We sent a 6-digit code to<br /><strong style={{ color: '#1a1a2e' }}>{inputValue}</strong></p>

              {message.text && <div style={S.msgBox(message.type)}>{message.text}</div>}

              <form onSubmit={handleVerifyOtp}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <input
                    type="text" maxLength="6" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000" autoFocus
                    style={{
                      width: '170px', padding: '14px', fontSize: '26px', fontWeight: 800,
                      textAlign: 'center', letterSpacing: '0.3em',
                      border: '2px solid #2563eb', borderRadius: '12px', outline: 'none',
                      color: '#1a1a2e', background: '#f8f9ff', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: '#2563eb', textAlign: 'center', marginBottom: '18px' }}>
                  (Check Terminal for code)
                </p>

                <button type="submit" disabled={isSubmitting || otp.length !== 6} style={S.btn(isSubmitting || otp.length !== 6)}>
                  {isSubmitting ? 'Verifying...' : 'Verify & Reset Password'}
                </button>

                <button type="button" onClick={() => setStep('input')} style={S.backLink}>
                  ← Back
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '24px', width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Need help?</p>
        <a href="mailto:support@stayspot.com" style={{ color: '#2563eb', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
          Contact Support
        </a>
      </div>
    </div>
  );
}

export default ForgotPassword;