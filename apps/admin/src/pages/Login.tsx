import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader2, Mail, Lock, Eye, EyeOff, Calendar, Users, Settings, BarChart3 } from 'lucide-react';

/* ── step data for left panel ─────────────────────────────────────── */
const steps = [
  { n: 1, title: 'Sign in to\nyour account', active: true },
  { n: 2, title: 'Access your\ndashboard', active: false },
  { n: 3, title: 'Manage your\nschedule', active: false },
];

export default function AdminLogin() {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) { navigate('/'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ── LEFT PANEL ──────────────────────────────────────────── */}
      <div className="login-left">

        {/* Glow blob */}
        <div className="login-glow" />

        {/* Content */}
        <div className="login-left-content">

          {/* Logo — White version for dark background */}
          <div className="login-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src="/images/logo-light.png"
                alt="RaGenda Logo"
                style={{ position: 'absolute', height: '180%', width: 'auto', maxWidth: 'none', objectFit: 'contain' }}
              />
            </div>
            <span className="login-brand-text" style={{ fontSize: '2rem' }}>
              <span style={{ color: '#c9b162' }}>R</span>a<span style={{ color: '#c9b162' }}>G</span>enda
            </span>
          </div>

          {/* Hero heading */}
          <h1 className="login-hero-title">
            Welcome<br />Back
          </h1>

          <p className="login-hero-subtitle">
            Complete these easy steps to manage your scheduling system.
          </p>

          {/* Steps */}
          <div className="login-steps">
            {steps.map((s) => (
              <div key={s.n} className={`login-step ${s.active ? 'login-step--active' : ''}`}>
                <div className={`login-step-number ${s.active ? 'login-step-number--active' : ''}`}>
                  {s.n}
                </div>
                <span className="login-step-label">{s.title.split('\n')[0]}<br />{s.title.split('\n')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom features row (desktop only) */}
        <div className="login-features">
          {[
            { icon: Calendar, label: 'Appointments' },
            { icon: Users, label: 'Clients' },
            { icon: Settings, label: 'Services' },
            { icon: BarChart3, label: 'Analytics' },
          ].map((f) => (
            <div key={f.label} className="login-feature-pill">
              <f.icon className="w-3 h-3" />
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL (FORM) ──────────────────────────────────── */}
      <div className="login-right">
        <div className="login-form-wrapper">

          {/* Mobile Logo — White version */}
          <div className="md:hidden flex items-center justify-center mb-8">
            <div style={{ position: 'relative', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src="/images/logo-light.png"
                alt="RaGenda Logo"
                style={{ position: 'absolute', left: '-50%', top: '-40%', height: '180%', width: '200%', maxWidth: 'none', objectFit: 'contain' }}
              />
            </div>
          </div>

          <div className="login-form-header">
            <h2 className="login-form-title">Sign In</h2>
            <p className="login-form-subtitle">
              Enter your admin credentials to access the dashboard.
            </p>
          </div>

          {/* Separator */}
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">Admin Portal</span>
            <div className="login-divider-line" />
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="login-field">
              <label className="login-label">Email</label>
              <div className="login-input-wrap">
                <Mail className="login-input-icon" />
                <input
                  type="email"
                  required
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ragenda.app"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <Lock className="login-input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  className="login-input login-input--password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="login-eye-btn"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="login-hint">Must be at least 8 characters.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in…</>
                : 'Sign In'
              }
            </button>
          </form>

          <p className="login-footer">
            RaGenda Admin · Restricted access
          </p>
        </div>
      </div>
    </div>
  );
}
