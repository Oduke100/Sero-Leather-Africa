import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api';

const MAX  = 5;
const LOCK = 60;

export default function AdminLogin() {
  const navigate                  = useNavigate();
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [attempts,  setAttempts]  = useState(() => parseInt(sessionStorage.getItem('sero_attempts') || '0'));
  const [lockEnd,   setLockEnd]   = useState(() => parseInt(sessionStorage.getItem('sero_locked')   || '0'));
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem('sero_admin_token')) navigate('/admin', { replace: true });
  }, []);
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
        setError(`Invalid credentials — ${MAX - next} attempt${MAX - next === 1 ? '' : 's'} remaining`);
      }
    } finally {
      setLoading(false);
    }
  }

  const locked = Date.now() < lockEnd;

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* SHARED STYLES                                                                           */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const inputStyle: React.CSSProperties = {
    background: 'rgba(44,30,22,0.6)',
    border: '1px solid rgba(212,168,71,0.2)',
    borderBottom: '1px solid rgba(212,168,71,0.4)',
    color: '#F5EDD8',
    padding: '14px 16px',
    fontFamily: "'Jost',sans-serif",
    fontSize: 14,
    outline: 'none',
    width: '100%',
    letterSpacing: '0.02em',
    opacity: locked ? 0.4 : 1,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase',
    color: 'rgba(245,237,216,0.4)', fontWeight: 500,
  };
  const KENTE      = 'repeating-linear-gradient(90deg,#C15C3D 0,#C15C3D 20px,#D4A847 20px,#D4A847 40px,#2C1E16 40px,#2C1E16 60px,#485c4f 60px,#485c4f 80px,#D4A847 80px,#D4A847 100px,#C15C3D 100px,#C15C3D 120px,#8B5E3C 120px,#8B5E3C 140px)';
  const KENTE_THIN = 'repeating-linear-gradient(90deg,#C15C3D 0,#C15C3D 20px,#D4A847 20px,#D4A847 40px,#2C1E16 40px,#2C1E16 60px,#485c4f 60px,#485c4f 80px)';

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* RENDER                                                                                  */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: "'Jost',sans-serif", background: '#1A0F08' }}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* LEFT — HERO                                                                        */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 48 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/Landing_4.webp)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.55) sepia(0.3)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(26,15,8,0.97) 0%,rgba(26,15,8,0.3) 50%,rgba(26,15,8,0.1) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: KENTE }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img src="/logo2.webp" alt="Sero" style={{ height: 36, marginBottom: 32, opacity: 0.9 }} onError={e => (e.currentTarget.style.display = 'none')} />
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 300, color: '#F5EDD8', lineHeight: 1.1, marginBottom: 16 }}>
            Crafted with<br /><em style={{ color: '#D4A847', fontStyle: 'italic' }}>intention.</em><br />Worn with pride.
          </p>
          <p style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.35)', fontWeight: 300 }}>
            Nairobi, Kenya — Est. 2020
          </p>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* RIGHT — FORM                                                                       */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 40px', background: '#1A0F08', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 20%,rgba(212,168,71,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>

          {/* ── HEADER ── */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4A847', fontWeight: 400, marginBottom: 12 }}>Admin Portal</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(2rem,3vw,2.8rem)', fontWeight: 300, color: '#F5EDD8', lineHeight: 1, marginBottom: 8 }}>
              Welcome back,<br /><em style={{ color: '#D4A847', fontStyle: 'italic' }}>Your Excellency</em>
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(245,237,216,0.35)', fontWeight: 300 }}>Sign in to manage your store</p>
          </div>

          {/* ── INPUTS ── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={labelStyle}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" autoComplete="username" disabled={locked || loading} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" disabled={locked || loading} style={{ ...inputStyle, padding: '14px 48px 14px 16px' }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,237,216,0.3)', padding: 0 }}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>

            {/* ── FEEDBACK ── */}
            {error && (
              <div style={{ fontSize: 12, color: '#f87171', padding: '10px 14px', background: 'rgba(248,113,113,0.07)', borderLeft: '2px solid #f87171', letterSpacing: '0.03em' }}>{error}</div>
            )}
            {locked && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#fbbf24', padding: '10px 14px', background: 'rgba(251,191,36,0.07)', borderLeft: '2px solid #fbbf24' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Too many attempts — retry in {countdown}s
              </div>
            )}

            {/* ── SUBMIT ── */}
            <button type="submit" disabled={locked || loading} style={{ marginTop: 8, padding: 16, background: loading ? 'rgba(212,168,71,0.6)' : 'linear-gradient(135deg,#D4A847 0%,#C68E5A 100%)', border: 'none', color: '#1A0F08', fontFamily: "'Jost',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', cursor: locked || loading ? 'not-allowed' : 'pointer', opacity: locked ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s' }}>
              {loading
                ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(26,15,8,0.2)', borderTop: '2px solid #1A0F08', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Signing in...</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>Enter the Studio</>}
            </button>
          </form>

          {/* ── FOOTER ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '32px 0 24px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(212,168,71,0.1)' }} />
            <span style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(245,237,216,0.2)', textTransform: 'uppercase' }}>Sero Leather Africa</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(212,168,71,0.1)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <a href="/" style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.25)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#D4A847')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,216,0.25)')}>← Back to Store</a>
          </div>
          {attempts > 0 && !locked && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 9, color: 'rgba(245,237,216,0.15)', letterSpacing: '0.15em' }}>Failed attempts this session: {attempts}</p>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: KENTE_THIN }} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .admin-split { grid-template-columns: 1fr !important; } .admin-left { display: none !important; } }
      `}</style>
    </div>
  );
}