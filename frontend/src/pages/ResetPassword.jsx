import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiRequest, getCsrfToken } from "../utils/api";
import { API_ENDPOINTS, ROUTES } from "../constants/api";

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [formData, setFormData] = useState({
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [tokenValid, setTokenValid] = useState(true);
  const [csrfToken, setCsrfToken] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  const passwordRules = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "One uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
    { label: "One number (0–9)", test: (p) => /[0-9]/.test(p) },
  ];

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setMessage({
        type: "error",
        text: "Invalid reset token. Please request a new password reset link.",
      });
    } else {
      getCsrfToken().then(setCsrfToken);
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setErrors({});

    const failedRules = passwordRules.filter((r) => !r.test(formData.password));
    if (failedRules.length > 0) {
      setErrors({ password: "Password does not meet all requirements." });
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setErrors({ confirm_password: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      let tokenToUse = csrfToken || (await getCsrfToken());
      setCsrfToken(tokenToUse);

      const response = await apiRequest(
        `${API_ENDPOINTS.RESET_PASSWORD}${token}/`,
        {
          method: "POST",
          body: JSON.stringify({
            password: formData.password,
            confirm_password: formData.confirm_password,
          }),
        },
        tokenToUse,
      );
      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message || "Password has been reset successfully!",
        });
        setTimeout(() => navigate(ROUTES.LOGIN), 2000);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to reset password. Please try again.",
        });
        if (data.error?.includes("token")) setTokenValid(false);
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Invalid token screen
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 font-sans p-5">
        <div className="flex w-full max-w-[940px] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] bg-white">
          {/* Left Panel */}
          <div className="w-[42%] hidden md:flex flex-col justify-between p-12 bg-indigo-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-[14px] flex items-center justify-center shrink-0 shadow-sm">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 21V12h6v9"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-white font-black text-2xl tracking-tighter">
                StaySpot
              </span>
            </div>
            <div>
              <h1 className="text-white text-5xl font-extrabold leading-[1.1] mb-5 tracking-tight">
                Oops!
              </h1>
              <p className="text-white/80 text-base leading-relaxed max-w-sm font-medium">
                This reset link is no longer valid. Request a fresh one and
                we'll have you back in no time.
              </p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 bg-white p-8 md:p-12 flex flex-col justify-center">
            <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">
              Invalid Reset Link
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {message.text ||
                "This password reset link is invalid or has expired."}
            </p>
            <button
              onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
              className="w-full py-3.5 text-[13px] font-black tracking-[0.15em] text-white rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.35)] uppercase bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
            >
              REQUEST NEW LINK →
            </button>
            <div className="text-center mt-6 text-sm text-gray-500">
              Remember your password?{" "}
              <Link
                to={ROUTES.LOGIN}
                className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (message.type === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 font-sans p-5">
        <div className="flex w-full max-w-[940px] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] bg-white">
          <div className="w-[42%] hidden md:flex flex-col justify-between p-12 bg-indigo-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-[14px] flex items-center justify-center shrink-0 shadow-sm">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 21V12h6v9"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-white font-black text-2xl tracking-tighter">
                StaySpot
              </span>
            </div>
            <div>
              <h1 className="text-white text-5xl font-extrabold leading-[1.1] mb-5 tracking-tight">
                All Done!
              </h1>
              <p className="text-white/80 text-base leading-relaxed max-w-sm font-medium">
                Your password has been reset. You can now sign in with your new
                credentials.
              </p>
            </div>
          </div>
          <div className="flex-1 bg-white p-8 md:p-12 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Password Reset!
            </h2>
            <p className="text-sm text-gray-600 mb-6 font-medium">
              Your password has been updated successfully.
            </p>
            <div className="inline-block px-4 py-2 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-500 font-semibold flex items-center gap-2">
                <svg
                  className="animate-spin h-3 w-3 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 font-sans p-5">
      <div className="flex w-full max-w-[940px] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] min-h-[580px] bg-white">
        {/* Left Panel */}
        <div className="w-[42%] hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-indigo-600">
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 bg-white rounded-[14px] flex items-center justify-center shrink-0 shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                  stroke="#4f46e5"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 21V12h6v9"
                  stroke="#4f46e5"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-white font-black text-2xl tracking-tighter">
              StaySpot
            </span>
          </div>

          <div className="z-10 mt-auto">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="white"
                  strokeWidth="2"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-white text-xs font-bold tracking-[0.15em] uppercase">
                Secure & Verified
              </span>
            </div>
            <h1 className="text-white text-5xl font-extrabold leading-[1.1] mb-5 tracking-tight font-sans">
              Reset Your
              <br />
              Password
            </h1>
            <p className="text-white/80 text-base leading-relaxed max-w-sm font-medium">
              Choose a strong new password to keep your account safe and secure.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">
            New Password
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter and confirm your new password below
          </p>

          {message.text && (
            <div
              className={`px-4 py-3 rounded-lg text-sm mb-4 font-medium border ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* New Password */}
            <div className="mb-2">
              <label className="block text-xs font-extrabold text-[#8792a6] mb-2 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  🔒
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setPasswordTouched(true)}
                  placeholder="••••••••"
                  className={`w-full py-3.5 pl-11 pr-4 text-sm rounded-xl outline-none transition-colors border-2 ${
                    errors.password
                      ? "bg-red-50 border-red-200 focus:border-red-400"
                      : "bg-[#f4f6fc] border-transparent focus:bg-white focus:border-indigo-600 text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium"
                  }`}
                />
              </div>

              {/* Live password rules */}
              {passwordTouched && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
                    Password must have:
                  </p>
                  <ul className="space-y-1">
                    {passwordRules.map((rule) => {
                      const passed = rule.test(formData.password);
                      return (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-2 text-xs font-semibold transition-colors ${passed ? "text-green-600" : "text-gray-400"}`}
                        >
                          <span
                            className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-black ${passed ? "bg-green-500" : "bg-gray-300"}`}
                          >
                            {passed ? "✓" : "×"}
                          </span>
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 font-bold">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-2">
              <label className="block text-xs font-extrabold text-[#8792a6] mb-2 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  🔒
                </span>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full py-3.5 pl-11 pr-4 text-sm rounded-xl outline-none transition-colors border-2 ${
                    errors.confirm_password
                      ? "bg-red-50 border-red-200 focus:border-red-400"
                      : "bg-[#f4f6fc] border-transparent focus:bg-white focus:border-indigo-600 text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium"
                  }`}
                />
              </div>
              {errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1.5 font-bold">
                  {errors.confirm_password}
                </p>
              )}
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={
                  loading || !formData.password || !formData.confirm_password
                }
                className={`w-full py-3.5 text-[13px] font-black tracking-[0.15em] text-white rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.35)] uppercase ${
                  loading || !formData.password || !formData.confirm_password
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                {loading ? "Resetting..." : "RESET PASSWORD →"}
              </button>
            </div>
          </form>

          <div className="text-center mt-6 text-sm text-gray-500">
            Remember your password?{" "}
            <Link
              to={ROUTES.LOGIN}
              className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
