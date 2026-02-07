import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('input'); // 'input', 'otp'
  const [inputValue, setInputValue] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = { phone: inputValue };

      const response = await apiRequest(
        API_ENDPOINTS.FORGOT_PASSWORD,
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'OTP sent to your phone!'
        });
        setStep('otp');
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to send OTP. Please try again.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await apiRequest(
        API_ENDPOINTS.VERIFY_FORGOT_PASSWORD_OTP,
        {
          method: 'POST',
          body: JSON.stringify({
            phone: inputValue,
            otp_code: otp
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Redirect to reset password page with the temporary token
        navigate(`/reset-password/${data.token}`);
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Invalid or expired OTP.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Verification error. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-5xl font-bold mb-6 leading-tight">Forgot Your Password?</h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            Verify your identity with a secure phone code to reset your password.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {step === 'input' ? 'Reset Password' : 'Verify Phone'}
              </h2>
              <p className="text-gray-600">
                {step === 'input'
                  ? 'Enter your phone number to receive a reset code.'
                  : `Enter the code sent to ${inputValue}`}
              </p>
            </div>

            {message.text && (
              <div className={`mb-6 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {message.text}
              </div>
            )}

            {step === 'input' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter your registered phone number"
                    required
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !inputValue}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center">
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-48 mx-auto px-3 py-3 border-2 border-blue-500 rounded-lg text-center tracking-widest text-3xl font-bold"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-xs text-blue-600">(Check Terminal for code)</p>
                <button
                  type="submit"
                  disabled={isSubmitting || otp.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
                >
                  Back to input
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 transition-colors duration-200"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
