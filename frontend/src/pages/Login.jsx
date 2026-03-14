import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCsrfToken, apiRequest, setUser } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  
  // 1. Form state
  // We keep track of what the user types in email, password, and role
  const [formData, setFormData] = useState({ email: '', password: '', role: 'Tenant' });
  const [errors, setErrors] = useState({}); // Stores errors for each input
  const [loading, setLoading] = useState(false); // Loading spinner state
  const [errorMessage, setErrorMessage] = useState(''); // General API errors
  const [csrfToken, setCsrfToken] = useState(''); // Security token for backend
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility

  // 2. Get CSRF token once when the page loads
  useEffect(() => { 
    getCsrfToken().then(setCsrfToken); 
  }, []);

  // 3. Check inputs before sending to backend
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email or phone is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true if no errors
  };

  // 4. Update form state as user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for the field as soon as user starts typing
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errorMessage) setErrorMessage('');
  };

  // 5. Submit form to backend
  const handleSubmit = async (e) => {
    e.preventDefault(); // Don't reload the page
    setErrorMessage('');

    if (!validateForm()) return; // Stop if validation fails
    
    setLoading(true); // Show loading on button
    try {
      const response = await apiRequest(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password, 
          role: formData.role 
        })
      }, csrfToken);
      
      const data = await response.json();
      
      if (response.ok) {
        // 6. Login success
        setUser(data.user); // Save user data
        onLogin(data.user); // Update app-level state

        // Go to dashboard based on role
        const role = data.user?.role;
        if (role === 'Admin') navigate(ROUTES.ADMIN_DASHBOARD);
        else if (role === 'Owner') navigate(ROUTES.OWNER_DASHBOARD);
        else navigate(ROUTES.TENANT_DASHBOARD);
      } else {
        // Show backend errors (wrong password, account disabled, etc.)
        setErrorMessage(data.error || 'Login failed. Check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Network error. Make sure the backend is running.');
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  // 7. Inline styles for the page, separated to keep JSX clean
  const S = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', fontFamily: "'Segoe UI', sans-serif", padding: '20px' },
    card: { display: 'flex', width: '100%', maxWidth: '940px', minHeight: '580px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' },
    left: { width: '42%', background: 'linear-gradient(145deg, #3b5bdb 0%, #4c6ef5 60%, #5c7cfa 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' },
    leftCircle1: { position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' },
    leftCircle2: { position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' },
    leftDesc: { color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.6 },
    right: { flex: 1, background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 48px' },
    heading: { fontSize: '24px', fontWeight: 800, color: '#1a1a2e', marginBottom: '4px', letterSpacing: '-0.4px' },
    subheading: { fontSize: '14px', color: '#888', marginBottom: '28px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '6px' },
    inputWrap: { position: 'relative', marginBottom: '4px' },
    inputIcon: { position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' },
    inputIconRight: { position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', color: '#bbb', cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center' },
    input: (err) => ({ width: '100%', padding: '11px 14px 11px 38px', fontSize: '14px', border: err ? '1.5px solid #fa5252' : '1.5px solid #e8eaf0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', color: '#1a1a2e', background: '#fafbff', transition: 'border 0.15s' }),
    errText: { color: '#fa5252', fontSize: '12px', marginTop: '4px' },
    forgotRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', marginTop: '6px' },
    forgotLink: { fontSize: '13px', color: '#3b5bdb', fontWeight: 600, textDecoration: 'none' },
    signinBtn: (loading) => ({ width: '100%', padding: '13px', fontSize: '14px', fontWeight: 700, background: loading ? '#748ffc' : 'linear-gradient(135deg, #3b5bdb, #4c6ef5)', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '18px', transition: 'background 0.2s', boxShadow: '0 4px 14px rgba(59,91,219,0.35)' }),
    signupRow: { textAlign: 'center', fontSize: '13px', color: '#888' },
    signupLink: { color: '#3b5bdb', fontWeight: 700, textDecoration: 'none' },
    errorBox: { background: '#fff0f0', border: '1px solid #ffc9c9', color: '#c92a2a', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' },
    roleRow: { display: 'flex', gap: '10px', marginBottom: '18px' },
    roleBtn: (active) => ({ flex: 1, padding: '9px', borderRadius: '8px', border: active ? '2px solid #3b5bdb' : '1.5px solid #e8eaf0', background: active ? '#f0f4ff' : 'white', color: active ? '#3b5bdb' : '#666', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }),
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* LEFT: Branding info */}
        <div style={S.left}>
          <div style={S.leftCircle1} />
          <div style={S.leftCircle2} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {/* Home icon */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="#3b5bdb" />
                <rect x="9" y="13" width="6" height="8" rx="1" fill="white" />
              </svg>
            </div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.3px' }}>Stay Spot</span>
          </div>
          <p style={S.leftDesc}>Find your perfect room or manage your properties with our intelligent platform. Connect tenants and owners seamlessly.</p>
        </div>

        {/* RIGHT: Login form */}
        <div style={S.right}>
          <div style={S.heading}>Welcome Back</div>
          <div style={S.subheading}>Sign in to your account</div>

          {/* Role selector buttons */}
          <div style={S.roleRow}>
            {['Tenant', 'Owner'].map(r => (
              <button key={r} type="button" style={S.roleBtn(formData.role === r)} onClick={() => setFormData(p => ({ ...p, role: r }))}>
                {r}
              </button>
            ))}
          </div>

          {/* Show API errors */}
          {errorMessage && <div style={S.errorBox}>{errorMessage}</div>}

          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div style={{ marginBottom: '14px' }}>
              <label style={S.label}>Email or Phone</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                </span>
                <input name="email" type="text" value={formData.email} onChange={handleChange}
                  placeholder="Enter email or phone number"
                  style={S.input(errors.email)} 
                  onFocus={e => e.target.style.borderColor = '#3b5bdb'}
                  onBlur={e => e.target.style.borderColor = errors.email ? '#fa5252' : '#e8eaf0'}
                />
              </div>
              {errors.email && <p style={S.errText}>{errors.email}</p>}
            </div>

            {/* Password field */}
            <div style={{ marginBottom: '4px' }}>
              <label style={S.label}>Password</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </span>
                <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                  placeholder="Enter your password"
                  style={{ ...S.input(errors.password), paddingRight: '40px' }}
                  onFocus={e => e.target.style.borderColor = '#3b5bdb'}
                  onBlur={e => e.target.style.borderColor = errors.password ? '#fa5252' : '#e8eaf0'}
                />
                {/* Toggle password visibility */}
                <button type="button" style={S.inputIconRight} onClick={() => setShowPassword(p => !p)}>
                  {showPassword
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.password && <p style={S.errText}>{errors.password}</p>}
            </div>

            {/* Forgot password */}
            <div style={S.forgotRow}>
              <Link to={ROUTES.FORGOT_PASSWORD} style={S.forgotLink}>Forgot your password?</Link>
            </div>

            {/* Submit button */}
            <button type="submit" disabled={loading} style={S.signinBtn(loading)}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Signup link */}
            <div style={S.signupRow}>
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER} style={S.signupLink}>Sign up here</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;