import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { API_ENDPOINTS, ROUTES } from "../constants/api";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("input"); // 'input' → 'otp'
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Step 1 – request OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message || "OTP sent to your email!",
        });
        setStep("otp");
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to send OTP. Please try again.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 – verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await apiRequest(
        API_ENDPOINTS.VERIFY_FORGOT_PASSWORD_OTP,
        {
          method: "POST",
          body: JSON.stringify({ email, otp_code: otp }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        navigate(`/reset-password/${data.token}`);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Invalid or expired OTP.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Verification error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 font-sans p-5">
      <div className="flex w-full max-w-[940px] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] min-h-[580px] bg-white">
        {/* Left Panel */}
        <div className="w-[42%] hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-indigo-600">
          {/* Logo */}
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

          {/* Bottom text */}
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
              {step === "input" ? (
                <>
                  Forgot Your
                  <br />
                  Password?
                </>
              ) : (
                <>
                  Check Your
                  <br />
                  Inbox
                </>
              )}
            </h1>
            <p className="text-white/80 text-base leading-relaxed max-w-sm font-medium">
              {step === "input"
                ? "No worries! Enter your Gmail address and we'll send a 6-digit reset code to your inbox."
                : `We've sent a 6-digit verification code to ${email}. Enter it to continue.`}
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
          {/* ── STEP 1: Enter Email ── */}
          {step === "input" && (
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">
                Reset Password
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your Gmail address to receive a reset code
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
                <div className="mb-2">
                  <label className="block text-xs font-extrabold text-[#8792a6] mb-2 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      ✉️
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@gmail.com"
                      required
                      className="w-full py-3.5 pl-11 pr-4 text-sm rounded-xl outline-none transition-colors border-2 bg-[#f4f6fc] border-transparent focus:bg-white focus:border-indigo-600 text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className={`w-full py-3.5 text-[13px] font-black tracking-[0.15em] text-white rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.35)] uppercase ${
                      isSubmitting || !email
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    {isSubmitting ? "Sending..." : "SEND RESET CODE →"}
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
          )}

          {/* ── STEP 2: Enter OTP ── */}
          {step === "otp" && (
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">
                Check Your Email
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                We sent a 6-digit code to{" "}
                <strong className="text-gray-800 font-bold">{email}</strong>
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

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="mb-2">
                  <label className="block text-xs font-extrabold text-[#8792a6] mb-2 uppercase tracking-wider">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    autoFocus
                    className="w-full py-3.5 px-4 text-2xl font-bold tracking-[0.5em] text-center rounded-xl outline-none transition-colors border-2 bg-[#f4f6fc] border-transparent focus:bg-white focus:border-indigo-600 text-gray-800"
                  />
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || otp.length !== 6}
                    className={`w-full py-3.5 text-[13px] font-black tracking-[0.15em] text-white rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.35)] uppercase mb-3 ${
                      isSubmitting || otp.length !== 6
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    {isSubmitting ? "Verifying..." : "VERIFY CODE →"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("input");
                      setOtp("");
                      setMessage({ type: "", text: "" });
                    }}
                    className="w-full py-3 border-2 border-gray-200 text-gray-500 font-bold text-sm rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all"
                  >
                    ← Back
                  </button>
                </div>
              </form>

              <div className="text-center mt-6 text-sm text-gray-500">
                Wrong email?{" "}
                <button
                  onClick={() => {
                    setStep("input");
                    setOtp("");
                    setMessage({ type: "", text: "" });
                  }}
                  className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
