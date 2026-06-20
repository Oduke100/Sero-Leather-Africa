import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api';

export default function AdminChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) { setError('All fields are required'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
    setLoading(true);
    try {
      const token = await changePassword(currentPassword, newPassword);
      sessionStorage.setItem('sero_admin_token', token);
      setSuccess('Password updated');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setLoading(false);
    }
  }

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
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase',
    color: 'rgba(245,237,216,0.4)', fontWeight: 500,
  };
  const KENTE_THIN = 'repeating-linear-gradient(90deg,#C15C3D 0,#C15C3D 20px,#D4A847 20px,#D4A847 40px,#2C1E16 40px,#2C1E16 60px,#485c4f 60px,#485c4f 80px)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 40px', background: '#1A0F08', fontFamily: "'Jost',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: KENTE_THIN }} />
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4A847', fontWeight: 400, marginBottom: 12 }}>Admin Portal</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(2rem,3vw,2.6rem)', fontWeight: 300, color: '#F5EDD8', lineHeight: 1, marginBottom: 8 }}>
            Change <em style={{ color: '#D4A847', fontStyle: 'italic' }}>Password</em>
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(245,237,216,0.35)', fontWeight: 300 }}>Update your admin credentials</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" disabled={loading} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" disabled={loading} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" disabled={loading} style={inputStyle} />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#f87171', padding: '10px 14px', background: 'rgba(248,113,113,0.07)', borderLeft: '2px solid #f87171', letterSpacing: '0.03em' }}>{error}</div>
          )}
          {success && (
            <div style={{ fontSize: 12, color: '#34d399', padding: '10px 14px', background: 'rgba(52,211,153,0.07)', borderLeft: '2px solid #34d399', letterSpacing: '0.03em' }}>{success}</div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: 8, padding: 16, background: loading ? 'rgba(212,168,71,0.6)' : 'linear-gradient(135deg,#D4A847 0%,#C68E5A 100%)', border: 'none', color: '#1A0F08', fontFamily: "'Jost',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
            {loading ? 'Saving…' : 'Update Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a onClick={() => navigate('/sero-internal')} style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.25)', textDecoration: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#D4A847')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,216,0.25)')}>← Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
}
