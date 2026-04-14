import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Building2, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Home } from "lucide-react";
import { getCsrfToken, apiRequest, setUser } from "../utils/api";
import { API_ENDPOINTS, ROUTES } from "../constants/api";

function Login({ onLogin }) {
  const navigate = useNavigate();

  // 1. Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "Tenant",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 2. Get CSRF token once when the page loads
  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);

  // 3. Check inputs before sending to backend
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email or phone is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 4. Update form state as user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (errorMessage) setErrorMessage("");
  };

  // 5. Submit form to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiRequest(
        API_ENDPOINTS.LOGIN,
        {
          method: "POST",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }),
        },
        csrfToken,
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        onLogin(data.user);

        const role = data.user?.role;
        if (role === "Admin") navigate(ROUTES.ADMIN_DASHBOARD);
        else if (role === "Owner") navigate(ROUTES.OWNER_DASHBOARD);
        else navigate(ROUTES.TENANT_DASHBOARD);
      } else {
        setErrorMessage(data.error || "Login failed. Check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Network error. Make sure the backend is running.");
    } finally {
      setLoading(false);
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
                Secure Access
              </span>
            </div>
            <h1 className="text-white text-5xl font-black leading-tight mb-6 tracking-tight">
              Welcome
              <br />
              Back
            </h1>
            <p className="text-indigo-100 text-base leading-relaxed max-w-[280px] font-medium">
              Manage your rentals and bookings with the most advanced platform in the market.
            </p>
          </div>
        </div>

        {/* LOGIN FORM PANEL */}
        <div className="flex-1 bg-white p-8 sm:p-14 flex flex-col justify-center relative">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
              Sign In
            </h2>
            <p className="text-base text-slate-500 font-medium">
              Access your account to continue
            </p>
          </div>

          {/* Role selector buttons */}
          <div className="mb-8">
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

          {/* API Errors */}
          {errorMessage && (
            <div className="bg-red-50/80 border border-red-200/50 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 font-semibold flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Email field */}
            <div className="group">
              <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">
                Email or Phone
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email or phone number"
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

            {/* Password field */}
            <div className="group">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">
                  Password
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-[11px] text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full py-4 pl-12 pr-12 text-sm rounded-2xl outline-none transition-all duration-200 border-2 ${
                    errors.password
                      ? "bg-red-50/50 border-red-200 focus:border-red-400 focus:bg-white"
                      : "bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-medium"
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-2 font-semibold">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit button */}
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
                {loading ? "AUTHENTICATING..." : "SIGN IN"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Signup link */}
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500 font-medium">
                Don't have an account?{" "}
                <Link
                  to={ROUTES.REGISTER}
                  className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors ml-1"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
