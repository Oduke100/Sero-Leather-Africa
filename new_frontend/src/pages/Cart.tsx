import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

function useReveal() {
  useEffect(() => {
    const t = setTimeout(() => {
      const obs = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
        { threshold: 0.1 }
      );
      document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
      setTimeout(() => {
        document.querySelectorAll('.reveal').forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
        });
      }, 100);
      return () => obs.disconnect();
    }, 50);
    return () => clearTimeout(t);
  }, []);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* ICONS                                                                                      */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const IconBag = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,71,0.4)" strokeWidth="1.5">
    <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,71,0.4)" strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const LogoMpesa = () => (
  <svg height="24" viewBox="0 0 80 28" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.9 }}>
    <rect width="80" height="24" rx="4" fill="#00A651"/>
    <text x="8" y="19" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="white" letterSpacing="0.5">M-PESA</text>
  </svg>
);
const LogoPaypal = () => (
  <svg height="24" viewBox="0 0 101 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.85 }}>
    <path d="M 12.237 2.8 L 4.437 2.8 C 3.937 2.8 3.437 3.2 3.337 3.7 L 0.237 23.7 C 0.137 24.1 0.437 24.4 0.837 24.4 L 4.537 24.4 C 5.037 24.4 5.537 24 5.637 23.5 L 6.437 18.1 C 6.537 17.6 6.937 17.2 7.537 17.2 L 10.037 17.2 C 15.137 17.2 18.137 14.7 18.937 9.8 C 19.237 7.7 18.937 6 17.937 4.8 C 16.837 3.5 14.837 2.8 12.237 2.8 Z M 13.137 10.1 C 12.737 12.9 10.537 12.9 8.537 12.9 L 7.337 12.9 L 8.137 7.7 C 8.137 7.4 8.437 7.2 8.737 7.2 L 9.237 7.2 C 10.637 7.2 11.937 7.2 12.637 8 C 13.137 8.4 13.237 9.1 13.137 10.1 Z" fill="#253B80"/>
    <path d="M 35.437 10 L 31.737 10 C 31.437 10 31.137 10.2 31.137 10.5 L 30.937 11.5 L 30.637 11.1 C 29.737 9.8 27.837 9.4 25.937 9.4 C 21.737 9.4 18.137 12.6 17.437 17.1 C 17.037 19.4 17.637 21.5 18.937 23 C 20.137 24.4 21.937 25 24.037 25 C 27.437 25 29.337 22.8 29.337 22.8 L 29.137 23.8 C 29.037 24.2 29.337 24.6 29.737 24.6 L 33.137 24.6 C 33.637 24.6 34.137 24.2 34.237 23.7 L 36.237 10.8 C 36.337 10.4 36.037 10 35.437 10 Z M 30.437 17.2 C 30.037 19.4 28.337 20.9 26.037 20.9 C 24.937 20.9 24.037 20.6 23.437 19.9 C 22.837 19.2 22.637 18.3 22.837 17.2 C 23.237 15 24.937 13.5 27.237 13.5 C 28.337 13.5 29.237 13.8 29.837 14.5 C 30.337 15.2 30.537 16.1 30.437 17.2 Z" fill="#253B80"/>
    <path d="M 55.337 10 L 51.637 10 C 51.237 10 50.937 10.2 50.737 10.5 L 45.537 18.1 L 43.337 10.8 C 43.237 10.3 42.737 10 42.337 10 L 38.637 10 C 38.237 10 37.837 10.4 38.037 10.9 L 42.137 23.1 L 38.237 28.5 C 37.937 28.9 38.237 29.5 38.737 29.5 L 42.437 29.5 C 42.837 29.5 43.137 29.3 43.337 29 L 55.837 10.9 C 56.137 10.5 55.837 10 55.337 10 Z" fill="#253B80"/>
    <path d="M 67.737 2.8 L 59.937 2.8 C 59.437 2.8 58.937 3.2 58.837 3.7 L 55.737 23.7 C 55.637 24.1 55.937 24.4 56.337 24.4 L 60.337 24.4 C 60.737 24.4 61.037 24.1 61.037 23.7 L 61.937 18.1 C 62.037 17.6 62.437 17.2 63.037 17.2 L 65.537 17.2 C 70.637 17.2 73.637 14.7 74.437 9.8 C 74.737 7.7 74.437 6 73.437 4.8 C 72.237 3.5 70.237 2.8 67.737 2.8 Z M 68.637 10.1 C 68.237 12.9 66.037 12.9 64.037 12.9 L 62.837 12.9 L 63.637 7.7 C 63.637 7.4 63.937 7.2 64.237 7.2 L 64.737 7.2 C 66.137 7.2 67.437 7.2 68.137 8 C 68.637 8.4 68.837 9.1 68.637 10.1 Z" fill="#179BD7"/>
    <path d="M 90.937 10 L 87.237 10 C 86.937 10 86.637 10.2 86.537 10.5 L 86.337 11.5 L 86.037 11.1 C 85.137 9.8 83.237 9.4 81.337 9.4 C 77.137 9.4 73.537 12.6 72.837 17.1 C 72.437 19.4 73.037 21.5 74.337 23 C 75.537 24.4 77.337 25 79.437 25 C 82.837 25 84.737 22.8 84.737 22.8 L 84.537 23.8 C 84.437 24.2 84.737 24.6 85.137 24.6 L 88.537 24.6 C 89.037 24.6 89.537 24.2 89.637 23.7 L 91.637 10.8 C 91.737 10.4 91.437 10 90.937 10 Z M 85.837 17.2 C 85.437 19.4 83.737 20.9 81.437 20.9 C 80.337 20.9 79.437 20.6 78.837 19.9 C 78.237 19.2 78.037 18.3 78.237 17.2 C 78.637 15 80.337 13.5 82.637 13.5 C 83.737 13.5 84.637 13.8 85.237 14.5 C 85.837 15.2 85.937 16.1 85.837 17.2 Z" fill="#179BD7"/>
    <path d="M 95.337 3.3 L 92.137 23.7 C 92.037 24.1 92.337 24.4 92.737 24.4 L 95.937 24.4 C 96.437 24.4 96.937 24 97.037 23.5 L 100.237 3.5 C 100.337 3.1 100.037 2.8 99.637 2.8 L 96.037 2.8 C 95.637 2.8 95.337 3 95.337 3.3 Z" fill="#179BD7"/>
  </svg>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* CART                                                                                       */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function Cart() {
  const { items, removeItem, updateQty, totalPrice } = useCart();
  const { convertPrice } = useCurrency();
  const navigate = useNavigate();
  useReveal();

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      {/* ── HERO ── */}
      <div className="cart-hero">
        <div className="section-inner">
          <p className="eyebrow reveal">Review</p>
          <h1 className="cart-hero-title reveal" style={{ transitionDelay: '.1s' }}>Your Heritage<br /><em>Bag</em></h1>
          <p className="cart-hero-sub reveal" style={{ transitionDelay: '.2s' }}>
            {totalItems > 0 ? `${totalItems} piece${totalItems !== 1 ? 's' : ''} in your bag` : 'Review your selected pieces before checkout'}
          </p>
        </div>
      </div>

      <div className="kente-border" aria-hidden="true" />

      {/* ── EMPTY STATE ── */}
      {items.length === 0 && (
        <div className="section-inner cart-empty">
          <div className="cart-empty-icon"><IconBag /></div>
          <h2 className="cart-empty-title">Your bag is empty</h2>
          <p className="cart-empty-sub">You haven't added any handcrafted pieces yet.</p>
          <button className="btn-savannah" onClick={() => navigate('/products')}>Explore Collections</button>
        </div>
      )}

      {/* ── ITEMS + SIDEBAR ── */}
      {items.length > 0 && (
        <div className="section-inner cart-grid">
          <div className="cart-items">
            {items.map(item => (
              <div key={`${item.product_id}-${item.variant_id ?? 'none'}`} className="cart-item glass reveal">
                <div className="cart-item-img">
                  {item.image && <img src={item.image} alt={item.name} />}
                </div>
                <div className="cart-item-body">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <p className="cart-item-price-each">{convertPrice(item.price)} each</p>
                  <div className="cart-item-footer">
                    <div className="cart-qty-row">
                      <button className="cart-qty-btn" onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1)}>−</button>
                      <span className="cart-qty-val">{item.quantity}</span>
                      <button className="cart-qty-btn" onClick={() => updateQty(item.product_id, item.variant_id, item.quantity + 1)}>+</button>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-subtotal">{convertPrice(item.price * item.quantity)}</span>
                      <button className="cart-remove-btn" onClick={() => removeItem(item.product_id, item.variant_id)}><IconTrash /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="cart-sidebar">
            <div className="glass cart-summary-box">
              <h2 className="cart-summary-title">Order Summary</h2>
              <div className="cart-summary-rows">
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span className="cart-summary-val">{convertPrice(totalPrice)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Delivery</span>
                  <span className="cart-summary-delivery">On delivery</span>
                </div>
              </div>
              <div className="cart-summary-total-row">
                <span className="cart-summary-total-label">Total</span>
                <span className="cart-summary-total-val">{convertPrice(totalPrice)}</span>
              </div>
              <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
                Proceed to Checkout <IconArrow />
              </button>
              <div className="cart-trust"><IconShield /> Secure checkout</div>
              <div className="cart-payment-badges">
                <p className="cart-payment-label">We Accept</p>
                <div className="cart-payment-row" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <LogoMpesa />
                  <LogoPaypal />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}