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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 font-sans p-5 relative">
      <div className="flex items-center justify-center w-full max-w-[860px] gap-8 md:gap-16 flex-col md:flex-row">

        {/* LEFT */}
        <div className="flex-1 p-5 max-w-[320px] text-center md:text-left">
          <div className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">Forgot Your Password?</div>
          <p className="text-sm text-gray-500 leading-relaxed">
            No worries! It happens to the best of us. Enter your email or phone number and we'll help you reset your password quickly and securely.
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-[380px] border-2 border-gray-100">

          {step === 'input' && (
            <>
              {/* Key icon */}
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7.5" cy="15.5" r="5.5"/>
                  <path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/>
                </svg>
              </div>

              <div className="text-xl font-extrabold text-gray-900 text-center mb-1.5">Reset Password</div>
              <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">Enter your email or phone number to receive a reset link</p>

              {/* Tabs */}
              <div className="flex mb-6 border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <button 
                  type="button" 
                  className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${inputType === 'email' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} 
                  onClick={() => handleTabSwitch('email')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                  Email
                </button>
                <button 
                  type="button" 
                  className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${inputType === 'phone' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} 
                  onClick={() => handleTabSwitch('phone')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.34 2.18 2 2 0 012.32.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-.77a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.5v1.42z" strokeLinecap="round"/></svg>
                  Phone
                </button>
              </div>

              {message.text && (
                <div className={`px-4 py-3 rounded-lg text-sm mb-4 font-medium border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{inputType === 'email' ? 'Email Address' : 'Phone Number'}</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      {inputType === 'email'
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.34 2.18 2 2 0 012.32.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-.77a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.5v1.42z" strokeLinecap="round"/></svg>
                      }
                    </span>
                    <input
                      type={inputType === 'email' ? 'email' : 'tel'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={inputType === 'email' ? 'Enter your email address' : 'Enter your phone number'}
                      required
                      className="w-full py-2.5 pl-10 pr-4 text-sm rounded-lg outline-none transition-colors border-2 bg-gray-50 focus:bg-white border-gray-200 focus:border-blue-600 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !inputValue} 
                  className={`w-full py-3 text-sm font-bold text-white rounded-lg transition-all mb-4 shadow-sm ${isSubmitting || !inputValue ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 shadow-blue-600/20 hover:shadow-lg'}`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <button onClick={() => navigate(ROUTES.LOGIN)} className="w-full flex items-center justify-center gap-1.5 text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors">
                ← Back to Login
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                </svg>
              </div>

              <div className="text-xl font-extrabold text-gray-900 text-center mb-1.5">Enter OTP</div>
              <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
                We sent a 6-digit code to<br /><strong className="text-gray-900 font-semibold">{inputValue}</strong>
              </p>

              {message.text && (
                <div className={`px-4 py-3 rounded-lg text-sm mb-4 font-medium border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="flex flex-col">
                <div className="flex justify-center mb-2">
                  <input
                    type="text" 
                    maxLength="6" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000" 
                    autoFocus
                    className="w-[170px] p-3 text-2xl font-extrabold text-center tracking-[0.3em] border-2 border-blue-600 rounded-xl outline-none text-gray-900 bg-blue-50/50"
                  />
                </div>
                <p className="text-xs text-blue-600 font-semibold text-center mb-5">(Check Terminal for code)</p>

                <button 
                  type="submit" 
                  disabled={isSubmitting || otp.length !== 6} 
                  className={`w-full py-3 text-sm font-bold text-white rounded-lg transition-all mb-4 shadow-sm ${isSubmitting || otp.length !== 6 ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 shadow-blue-600/20 hover:shadow-lg'}`}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Reset Password'}
                </button>

                <button type="button" onClick={() => setStep('input')} className="w-full flex items-center justify-center gap-1.5 text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors">
                  ← Back
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 w-full text-center">
        <p className="text-sm text-gray-400 m-0">Need help?</p>
        <a href="mailto:support@stayspot.com" className="text-blue-600 font-bold text-sm hover:underline">
          Contact Support
        </a>
      </div>
    </div>
  );
}

export default ForgotPassword;