import { useNavigate } from 'react-router-dom';

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--midnight)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px',
    }}>
      <div className="kente-border kente-fixed" aria-hidden="true" />

      <p style={{ fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--savannah)', marginBottom: 24 }}>
        Sero Leather Africa
      </p>

      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 'clamp(3rem, 8vw, 7rem)',
        fontWeight: 300,
        color: 'var(--bone)',
        lineHeight: 0.9,
        marginBottom: 32,
      }}>
        Coming<br /><em style={{ color: 'var(--savannah)' }}>Soon</em>
      </h1>

      <div style={{ width: 64, height: 1, background: 'var(--ember)', margin: '0 auto 32px' }} />

      <p style={{ color: 'rgba(245,237,216,0.4)', fontWeight: 300, letterSpacing: '0.1em', marginBottom: 48 }}>
        This page is still being crafted.
      </p>

      <button className="btn-savannah" onClick={() => navigate(-1)}>
        Go Back
      </button>
    </div>
  );
}
