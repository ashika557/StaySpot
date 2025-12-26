import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

function ForgotPassword() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('email');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = activeTab === 'email' 
        ? { email: inputValue }
        : { phone: inputValue };

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
          text: data.message || 'Password reset link has been sent!'
        });
        // In development, show the reset link
        if (data.reset_link) {
          console.log('Reset link:', data.reset_link);
          setMessage({
            type: 'success',
            text: `Password reset link sent! Check console for link (development mode).`
          });
        }
        setInputValue('');
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Something went wrong. Please try again.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please check if the backend is running.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    return activeTab === 'email' ? 'Enter your email address' : 'Enter your phone number';
  };

  const getInputType = () => {
    return activeTab === 'email' ? 'email' : 'tel';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex">
      {/* Left Column - Title and Description */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Forgot Your Password?
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            No worries! Enter your email or phone number and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      {/* Right Column - Reset Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
            </div>

            {/* Title and Subtitle */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Reset Password
              </h2>
              <p className="text-gray-600">
                Choose how you'd like to reset your password
              </p>
            </div>

            {/* Message Display */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            {/* Toggle Tabs */}
            <div className="mb-6">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('email');
                    setInputValue('');
                    setMessage({ type: '', text: '' });
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'email'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('phone');
                    setInputValue('');
                    setMessage({ type: '', text: '' });
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'phone'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Phone
                  </div>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input Field with Icon */}
              <div>
                <label
                  htmlFor="reset-input"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {activeTab === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {activeTab === 'email' ? (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    )}
                  </div>
                  <input
                    id="reset-input"
                    type={getInputType()}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={getPlaceholder()}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Primary Button */}
              <button
                type="submit"
                disabled={isSubmitting || !inputValue}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Login
              </button>
            </div>
          </div>

          {/* Footer Support Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help?{' '}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Contact Support feature - UI only');
                }}
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
