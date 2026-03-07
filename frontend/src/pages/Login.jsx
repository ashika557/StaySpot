import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCsrfToken, apiRequest, setUser } from '../utils/api';
import { API_ENDPOINTS, ROUTES } from '../constants/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', role: 'Tenant' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { getCsrfToken().then(setCsrfToken); }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await apiRequest(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, password: formData.password, role: formData.role })
      }, csrfToken);
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        onLogin(data.user);
        const role = data.user?.role;
        if (role === 'Admin') navigate(ROUTES.ADMIN_DASHBOARD);
        else if (role === 'Owner') navigate(ROUTES.OWNER_DASHBOARD);
        else navigate(ROUTES.TENANT_DASHBOARD);
      } else {
        setErrorMessage(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Network error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const S = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: "'Segoe UI', sans-serif", padding: '20px' },
    card: { display: 'flex', width: '100%', maxWidth: '860px', minHeight: '420px', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.13)' },
    left: { width: '38%', background: 'linear-gradient(160deg, #2e54d4 0%, #3b6ef5 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' },
    leftCircle1: { position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' },
    leftCircle2: { position: 'absolute', bottom: '-60px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' },
    houseIcon: { width: '64px', height: '64px', marginBottom: '18px' },
    leftTitle: { color: 'white', fontSize: '22px', fontWeight: 800, marginBottom: '14px', letterSpacing: '-0.3px' },
    leftDesc: { color: 'rgba(255,255,255,0.78)', fontSize: '13px', lineHeight: 1.65 },
    right: { flex: 1, background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 52px' },
    heading: { fontSize: '26px', fontWeight: 800, color: '#111827', marginBottom: '6px', letterSpacing: '-0.4px' },
    subheading: { fontSize: '14px', color: '#9ca3af', marginBottom: '28px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
    inputWrap: { position: 'relative', marginBottom: '4px' },
    inputIcon: { position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' },
    inputIconRight: { position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center' },
    input: (err) => ({ width: '100%', padding: '11px 14px 11px 38px', fontSize: '14px', border: err ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#111827', background: 'white', transition: 'border 0.15s' }),
    errText: { color: '#ef4444', fontSize: '12px', marginTop: '4px' },
    forgotRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', marginTop: '6px' },
    forgotLink: { fontSize: '13px', color: '#3b6ef5', fontWeight: 600, textDecoration: 'none' },
    signinBtn: (loading) => ({ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, background: loading ? '#93a8f4' : '#3b6ef5', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '18px', transition: 'background 0.2s' }),
    dividerRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
    dividerLine: { flex: 1, height: '1px', background: '#e5e7eb' },
    dividerText: { fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' },
    socialRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
    socialBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#374151' },
    signupRow: { textAlign: 'center', fontSize: '13px', color: '#6b7280' },
    signupLink: { color: '#3b6ef5', fontWeight: 700, textDecoration: 'none' },
    errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '11px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
    roleRow: { display: 'flex', gap: '10px', marginBottom: '18px' },
    roleBtn: (active) => ({ flex: 1, padding: '9px', borderRadius: '8px', border: active ? '2px solid #3b6ef5' : '1.5px solid #e5e7eb', background: active ? '#eff3ff' : 'white', color: active ? '#3b6ef5' : '#6b7280', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }),
  };

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* LEFT */}
        <div style={S.left}>
          <div style={S.leftCircle1} />
          <div style={S.leftCircle2} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="#3b5bdb" />
                <rect x="9" y="13" width="6" height="8" rx="1" fill="white" />
              </svg>
            </div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.3px' }}>Stay Spot</span>
          </div>
          <p style={S.leftDesc}>Find your perfect room or manage your properties with our intelligent platform. Connect tenants and owners seamlessly.</p>
        </div>

        {/* RIGHT */}
        <div style={S.right}>
          <div style={S.heading}>Welcome Back</div>
          <div style={S.subheading}>Sign in to your account</div>

          {/* Role selector */}
          <div style={S.roleRow}>
            {['Tenant', 'Owner'].map(r => (
              <button key={r} type="button" style={S.roleBtn(formData.role === r)} onClick={() => setFormData(p => ({ ...p, role: r }))}>
                {r}
              </button>
            ))}
          </div>

          {errorMessage && <div style={S.errorBox}>{errorMessage}</div>}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={S.label}>Email or Phone</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                </span>
                <input name="email" type="email" value={formData.email} onChange={handleChange}
                  placeholder="Enter email or phone number"
                  style={S.input(errors.email)}
                  onFocus={e => e.target.style.borderColor = '#3b6ef5'}
                  onBlur={e => e.target.style.borderColor = errors.email ? '#ef4444' : '#e5e7eb'}
                />
              </div>
              {errors.email && <p style={S.errText}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '4px' }}>
              <label style={S.label}>Password</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </span>
                <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                  placeholder="Enter your password"
                  style={{ ...S.input(errors.password), paddingRight: '40px' }}
                  onFocus={e => e.target.style.borderColor = '#3b6ef5'}
                  onBlur={e => e.target.style.borderColor = errors.password ? '#ef4444' : '#e5e7eb'}
                />
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

            {/* Sign in button */}
            <button type="submit" disabled={loading} style={S.signinBtn(loading)}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Sign up */}
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