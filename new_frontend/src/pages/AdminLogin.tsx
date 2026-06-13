import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api';

const MAX  = 5;
const LOCK = 60;

export default function AdminLogin() {
  const navigate               = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [attempts, setAttempts] = useState(() => parseInt(sessionStorage.getItem('sero_attempts') || '0'));
  const [lockEnd,  setLockEnd]  = useState(() => parseInt(sessionStorage.getItem('sero_locked')   || '0'));
  const [countdown, setCountdown] = useState(0);

  /* redirect if already authed */
  useEffect(() => {
    if (sessionStorage.getItem('sero_admin_token')) navigate('/admin', { replace: true });
  }, []);

  /* lockout countdown */
  useEffect(() => {
    if (Date.now() >= lockEnd) return;
    const t = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockEnd - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        setAttempts(0);
        sessionStorage.removeItem('sero_attempts');
        sessionStorage.removeItem('sero_locked');
        clearInterval(t);
      }
    }, 1000);
    setCountdown(Math.ceil((lockEnd - Date.now()) / 1000));
    return () => clearInterval(t);
  }, [lockEnd]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Date.now() < lockEnd) return;
    if (!username.trim() || !password.trim()) { setError('Both fields are required'); return; }

    setLoading(true); setError('');
    try {
      const token = await adminLogin(username.trim(), password);
      sessionStorage.setItem('sero_admin_token', token);
      sessionStorage.removeItem('sero_attempts');
      sessionStorage.removeItem('sero_locked');
      navigate('/admin', { replace: true });
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      sessionStorage.setItem('sero_attempts', String(next));
      if (next >= MAX) {
        const end = Date.now() + LOCK * 1000;
        setLockEnd(end);
        sessionStorage.setItem('sero_locked', String(end));
        setError('');
      } else {
        setError(`Invalid credentials. ${MAX - next} attempt${MAX - next === 1 ? '' : 's'} remaining.`);
      }
    } finally {
      setLoading(false);
    }
  }

  const locked = Date.now() < lockEnd;

  return (
    <div className="admin-login-root">
      <div className="admin-kente-top" />

      <div className="admin-login-wrap">
        {/* Brand */}
        <div className="admin-login-brand">
          <img
            src="/static/images/logo1.webp"
            alt="Sero"
            className="admin-login-logo"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <div>
            <div className="admin-login-brand-name">Sero Leather Africa</div>
            <div className="admin-login-brand-sub">Admin Portal</div>
          </div>
        </div>

        {/* Card */}
        <div className="admin-login-card">
          <div className="admin-login-card-header">
            <svg className="admin-login-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <h1 className="admin-login-title">Restricted Access</h1>
            <p className="admin-login-subtitle">Enter your administrator credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="admin-field">
              <label className="admin-field-label">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="admin-field-input"
                placeholder="admin"
                autoComplete="username"
                disabled={locked || loading}
              />
            </div>

            <div className="admin-field">
              <label className="admin-field-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="admin-field-input"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={locked || loading}
              />
            </div>

            {error && <p className="admin-login-error">{error}</p>}

            {locked && (
              <div className="admin-login-lockout">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Too many attempts. Try again in {countdown}s
              </div>
            )}

            <button
              type="submit"
              className="admin-login-btn"
              disabled={locked || loading}
            >
              {loading ? (
                <span className="admin-login-spinner" />
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                  </svg>
                  Unlock Dashboard
                </>
              )}
            </button>
          </form>

          {attempts > 0 && !locked && (
            <p className="admin-login-attempts">Failed attempts this session: {attempts}</p>
          )}
        </div>

        <a href="/" className="admin-login-back">← Back to Store</a>
      </div>
    </div>
  );
}