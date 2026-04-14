import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Building2, Mail, Lock, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Home, Loader2 } from "lucide-react";
import { getCsrfToken, apiRequest } from "../utils/api";
import { ROUTES } from "../constants/api";

function Register({ onLogin }) {
  const navigate = useNavigate();

  // form inputs
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "Tenant",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  // controls which screen to show: 'form' → 'email_otp' → 'success'
  const [step, setStep] = useState("form");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // get CSRF token once on mount
  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);

  // countdown timer for resend button
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Password rules
  const passwordRules = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "One uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
    { label: "One number (0–9)", test: (p) => /[0-9]/.test(p) },
  ];

  const [passwordTouched, setPasswordTouched] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim())
      newErrors.full_name = "Full Name is required";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@gmail\.com$/.test(formData.email.trim().toLowerCase()))
      newErrors.email = "Must be a valid @gmail.com address";

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const failedRules = passwordRules.filter(
        (r) => !r.test(formData.password),
      );
      if (failedRules.length > 0)
        newErrors.password = "Password does not meet all requirements.";
    }

    if (!formData.confirm_password)
      newErrors.confirm_password = "Please confirm your password";
    else if (formData.password !== formData.confirm_password)
      newErrors.confirm_password = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiRequest(
        "/request-registration-otp/",
        {
          method: "POST",
          body: JSON.stringify({ email: formData.email }),
        },
        csrfToken,
      );

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage("Verification code sent to your email!");
        setStep("email_otp");
        setResendTimer(60);
      } else {
        setErrorMessage(result.error || "Failed to send code.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!otp || otp.length !== 6) {
      setErrorMessage("Please enter a 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest(
        "/verify-registration-otp/",
        {
          method: "POST",
          body: JSON.stringify({ email: formData.email, otp_code: otp }),
        },
        csrfToken,
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Email verified! Completing registration...");
        await finalizeRegistration();
      } else {
        setErrorMessage(data.error || "Verification failed.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const finalizeRegistration = async () => {
    try {
      const data = new FormData();
      data.append("full_name", formData.full_name);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("role", formData.role);

      const response = await apiRequest(
        "/register/",
        { method: "POST", body: data },
        csrfToken,
      );
      const result = await response.json();

      if (response.ok) {
        setSuccessMessage("Registration successful! Redirecting...");
        setStep("success");
        setTimeout(() => navigate(ROUTES.LOGIN), 2000);
      } else {
        setErrorMessage(result.error || "Registration failed.");
        setStep("form");
      }
    } catch {
      setErrorMessage("Network error during registration.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7ff] font-sans p-5 sm:p-8">
      <div className="flex w-full max-w-[1000px] rounded-3xl overflow-hidden shadow-2xl min-h-[600px] bg-white ring-1 ring-gray-200/50">
        
        {/* LEFT BRANDING PANEL */}
        <div className="w-[45%] hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-indigo-600">
          {/* Subtle Abstract Background */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white mix-blend-overlay filter blur-[100px] opacity-30 animate-pulse rounded-full"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-300 mix-blend-multiply filter blur-[100px] opacity-50 rounded-full"></div>
          </div>

          {/* Logo Top Left */}
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 border border-white/30 shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-extrabold text-2xl tracking-tight">
              StaySpot
            </span>
          </div>

          {/* Bottom Advertising Text */}
          <div className="z-10 mt-auto pb-4">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-5 h-5 text-indigo-100" />
              <span className="text-indigo-100 text-xs font-bold tracking-[0.2em] uppercase">
                Secure & Verified
              </span>
            </div>
            <h1 className="text-white text-5xl font-black leading-tight mb-6 tracking-tight">
              Welcome to
              <br />
              StaySpot
            </h1>
            <p className="text-indigo-100 text-base leading-relaxed max-w-[280px] font-medium">
              Find your perfect room in minutes and manage your rental portfolio with ease.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white p-8 sm:p-14 flex flex-col justify-center overflow-y-auto relative">
          
          {step === "form" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                  Create Account
                </h2>
                <p className="text-base text-slate-500 font-medium">
                  Create an account to get started
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-50/80 border border-red-200/50 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 font-semibold flex items-center gap-2">
                   <XCircle className="w-4 h-4 shrink-0" />
                   {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50/80 border border-green-200/50 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 font-semibold flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4 shrink-0" />
                   {successMessage}
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
                
                {/* Role selector button toggle */}
                <div className="mb-2">
                  <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
                    {["Tenant", "Owner"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                          formData.role === r
                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/30"
                        }`}
                        onClick={() => setFormData((p) => ({ ...p, role: r }))}
                      >
                        {r === "Tenant" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        {r} Account
                      </button>
                    ))}
                  </div>
                </div>

                {/* full name */}
                <div className="group">
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`w-full py-4 pl-12 pr-4 text-sm rounded-2xl outline-none transition-all duration-200 border-2 ${
                        errors.full_name
                          ? "bg-red-50/50 border-red-200 focus:border-red-400 focus:bg-white"
                          : "bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-medium"
                      }`}
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-red-500 text-xs mt-2 font-semibold">
                      {errors.full_name}
                    </p>
                  )}
                </div>

                {/* email */}
                <div className="group">
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@gmail.com"
                      className={`w-full py-4 pl-12 pr-4 text-sm rounded-2xl outline-none transition-all duration-200 border-2 ${
                        errors.email
                          ? "bg-red-50/50 border-red-200 focus:border-red-400 focus:bg-white"
                          : "bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-medium"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-2 font-semibold">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* password */}
                <div className="group">
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setPasswordTouched(true)}
                      placeholder="••••••••"
                      className={`w-full py-4 pl-12 pr-4 text-sm rounded-2xl outline-none transition-all duration-200 border-2 ${
                        errors.password
                          ? "bg-red-50/50 border-red-200 focus:border-red-400 focus:bg-white"
                          : "bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-medium"
                      }`}
                    />
                  </div>

                  {/* Live password requirements */}
                  {passwordTouched && (
                    <div className="mt-3 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Password criteria
                      </p>
                      <ul className="space-y-2.5">
                        {passwordRules.map((rule) => {
                          const passed = rule.test(formData.password);
                          return (
                            <li
                              key={rule.label}
                              className={`flex items-center gap-2 text-[13px] font-semibold transition-colors ${passed ? "text-indigo-600" : "text-slate-400"}`}
                            >
                              <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                  passed ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-400"
                                }`}
                              >
                                {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                              </div>
                              {rule.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {errors.password && (
                    <p className="text-red-500 text-xs mt-2 font-semibold">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* confirm password */}
                <div className="group">
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full py-4 pl-12 pr-4 text-sm rounded-2xl outline-none transition-all duration-200 border-2 ${
                        errors.confirm_password
                          ? "bg-red-50/50 border-red-200 focus:border-red-400 focus:bg-white"
                          : "bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-medium"
                      }`}
                    />
                  </div>
                  {errors.confirm_password && (
                    <p className="text-red-500 text-xs mt-2 font-semibold">
                      {errors.confirm_password}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 text-[13px] font-black tracking-[0.1em] text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 ${
                      loading 
                      ? "bg-slate-300 cursor-not-allowed text-slate-500" 
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5"
                    }`}
                  >
                    {loading ? "SENDING VERIFICATION..." : "CREATE ACCOUNT"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="text-center mt-6">
                <p className="text-sm text-slate-500 font-medium">
                  Already have an account?{" "}
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors ml-1"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* OTP verification */}
          {step === "email_otp" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                  Check Your Email
                </h2>
                <p className="text-base text-slate-500 font-medium">
                  We sent a 6-digit code to{" "}
                  <strong className="text-slate-800">{formData.email}</strong>
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-50/80 border border-red-200/50 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 font-semibold flex items-center gap-2">
                   <XCircle className="w-4 h-4 shrink-0" />
                   {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50/80 border border-green-200/50 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 font-semibold flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4 shrink-0" />
                   {successMessage}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest text-center">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full py-4 px-4 text-3xl font-black tracking-[0.5em] text-center rounded-2xl outline-none transition-all duration-200 border-2 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 text-slate-900 placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-3 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 text-[13px] font-black tracking-[0.1em] text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 ${
                      loading 
                      ? "bg-slate-300 cursor-not-allowed text-slate-500" 
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5"
                    }`}
                  >
                    {loading ? "VERIFYING..." : "CONFIRM & REGISTER"}
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={resendTimer > 0}
                    className={`w-full py-4 text-[13px] font-black tracking-[0.1em] border-2 rounded-2xl transition-all duration-200 ${
                      resendTimer > 0 
                      ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed" 
                      : "border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
                    }`}
                  >
                    {resendTimer > 0
                      ? `RESEND CODE IN ${resendTimer}S`
                      : "RESEND RECOVERY CODE"}
                  </button>
                </div>
              </form>

              <div className="text-center mt-8">
                <p className="text-sm text-slate-500 font-medium">
                  Wrong email address?{" "}
                  <button
                    onClick={() => setStep("form")}
                    className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors ml-1"
                  >
                    Go Back
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* success, auto redirects to login */}
          {step === "success" && (
            <div className="text-center py-8 flex flex-col items-center justify-center h-full animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100/50 rounded-full flex items-center justify-center mb-8 border-[6px] border-green-50">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                Account Created!
              </h2>
              <p className="text-base text-slate-500 mb-8 font-medium max-w-xs mx-auto">
                Your email has been verified and your profile is ready.
              </p>
              
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-600 font-bold tracking-wide uppercase">
                  Redirecting securely...
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
