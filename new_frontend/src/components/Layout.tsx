import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Cursor from './Cursor';
import Footer from './Footer';
import CurrencySelector from './CurrencySelector';

interface Props { children: React.ReactNode; }

export default function Layout({ children }: Props) {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('sero-cart') || '[]');
    const count = cart.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
    setCartCount(count);
  }, [location]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <>
      <Cursor />

      {/* Kente top bar */}
      <div className="kente-border kente-fixed" aria-hidden="true" />

      {/* Toast slot — filled by global showToast() */}
      <div className="toast" id="toast" aria-live="polite" />

      {/* Nav */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-logo-link">
            <img
              src={scrolled ? '/logo1.webp' : '/logo2.webp'}
              alt="Sero Leather Africa"
              className="nav-logo"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          </Link>

          <div className="nav-links">
            <Link to="/"         className={`nav-link${location.pathname === "/" ? " nav-link--active" : ""}`}>Home</Link>
            <Link to="/collections" className={`nav-link${location.pathname.startsWith("/product") ? " nav-link--active" : ""}`}>Collections</Link>
            <Link to="/about"    className={`nav-link${location.pathname === "/about" ? " nav-link--active" : ""}`}>Our Story</Link>
            <Link to="/cart"     className="nav-cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            <CurrencySelector />
          </div>

          <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <Link to="/"         className="mobile-link">Home</Link>
        <Link to="/collections" className="mobile-link">Collections</Link>
        <Link to="/about"    className="mobile-link">Our Story</Link>
        <Link to="/cart"     className="mobile-link">Your Bag</Link>
        <CurrencySelector />
      </div>

      <main>{children}</main>

      <Footer />
    </>
  );
}