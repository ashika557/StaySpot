import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCsrfToken, apiRequest } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

function Register() {
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
  const [step, setStep] = useState('form'); // 'form', 'email_otp', 'success'
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Full Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await apiRequest(
        API_ENDPOINTS.REQUEST_REGISTRATION_OTP,
        {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            phone: formData.phone
          })
        },
        csrfToken
      );

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('Verification code sent to your email!');
        setStep('email_otp');
        setResendTimer(60);
      } else {
        setErrorMessage(result.error || 'Failed to send verification code.');
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setErrorMessage('Please enter a 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await apiRequest(
        API_ENDPOINTS.VERIFY_REGISTRATION_OTP,
        {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            otp_code: otp
          })
        },
        csrfToken
      );

      if (response.ok) {
        setSuccessMessage('Email verified! Completing registration...');
        await finalizeRegistration();
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Invalid verification code.');
      }
    } catch (error) {
      setErrorMessage('Network error during verification.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeRegistration = async () => {
    try {
      const response = await apiRequest(
        API_ENDPOINTS.REGISTER,
        {
          method: 'POST',
          body: JSON.stringify(formData)
        },
        csrfToken
      );

      const result = await response.json();

      if (response.ok) {
        setStep('success');
        setTimeout(() => navigate(ROUTES.LOGIN), 2000);
      } else {
        setErrorMessage(result.error || 'Final registration failed.');
        setStep('form'); // Go back to fix issues
      }
    } catch (error) {
      setErrorMessage('Network error during final registration.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'form' ? 'Create your account' : step === 'email_otp' ? 'Verify your email' : 'Registration Complete!'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errorMessage && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {errorMessage}
            </div>
          )}
          {successMessage && step !== 'success' && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
              {successMessage}
            </div>
          )}

          {step === 'form' && (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="Tenant">Tenant</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  name="confirm_password"
                  type="password"
                  required
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Sending Code...' : 'Register'}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to={ROUTES.LOGIN} className="font-medium text-blue-600 hover:text-blue-500">
                    Login
                  </Link>
                </p>
              </div>
            </form>
          )}

          {step === 'email_otp' && (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="text-center">
                <p className="text-sm text-gray-600">Enter the verification code sent to your email.</p>
                <div className="mt-4 flex justify-center">
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-48 px-3 py-3 border border-gray-300 rounded-lg text-center tracking-widest text-3xl font-bold focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-xs text-blue-600 font-semibold">(Check Terminal for code)</p>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Register'}
                </button>

                <div className="flex flex-col items-center space-y-2">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={resendTimer > 0 || loading}
                    className={`text-sm font-medium ${resendTimer > 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-500'}`}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Back to form
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">Verification successful! Redirecting to login...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;

