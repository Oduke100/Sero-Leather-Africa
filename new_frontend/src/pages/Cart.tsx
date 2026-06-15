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

const FALLBACK = 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop';

export default function Cart() {
  const { items, removeItem, updateQty, totalPrice } = useCart();
  const { convertPrice } = useCurrency();
  const navigate = useNavigate();
  useReveal();

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <div className="cart-hero">
        <div className="section-inner">
          <p className="eyebrow reveal">Review</p>
          <h1 className="cart-hero-title reveal" style={{ transitionDelay: '.1s' }}>
            Your Heritage<br /><em>Bag</em>
          </h1>
          <p className="cart-hero-sub reveal" style={{ transitionDelay: '.2s' }}>
            {totalItems > 0
              ? `${totalItems} piece${totalItems !== 1 ? 's' : ''} in your bag`
              : 'Review your selected pieces before checkout'}
          </p>
        </div>
      </div>

      <div className="kente-border" aria-hidden="true" />

      {items.length === 0 && (
        <div className="section-inner cart-empty">
          <div className="cart-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                 stroke="rgba(212,168,71,0.4)" strokeWidth="1.5">
              <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <h2 className="cart-empty-title">Your bag is empty</h2>
          <p className="cart-empty-sub">You haven't added any handcrafted pieces yet.</p>
          <button className="btn-savannah" onClick={() => navigate('/products')}>
            Explore Collections
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="section-inner cart-grid">
          <div className="cart-items">
            {items.map(item => (
              <div
                key={`${item.product_id}-${item.variant_id ?? 'none'}`}
                className="cart-item glass reveal"
              >
                <div className="cart-item-img">
                  <img
                    src={item.image || FALLBACK}
                    alt={item.name}
                    onError={e => (e.currentTarget.src = FALLBACK)}
                  />
                </div>
                <div className="cart-item-body">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <p className="cart-item-price-each">{convertPrice(item.price)} each</p>
                  <div className="cart-item-footer">
                    <div className="cart-qty-row">
                      <button className="cart-qty-btn"
                        onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1)}>−</button>
                      <span className="cart-qty-val">{item.quantity}</span>
                      <button className="cart-qty-btn"
                        onClick={() => updateQty(item.product_id, item.variant_id, item.quantity + 1)}>+</button>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-subtotal">{convertPrice(item.price * item.quantity)}</span>
                      <button className="cart-remove-btn"
                        onClick={() => removeItem(item.product_id, item.variant_id)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="1.5">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
                Proceed to Checkout
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <div className="cart-trust">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="rgba(212,168,71,0.4)" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                Secure checkout
              </div>
              <div className="cart-payment-badges">
                <p className="cart-payment-label">We Accept</p>
                <div className="cart-payment-row">
                  {[
                    { label: 'M-PESA',  bg: 'rgba(0,166,81,0.12)',   border: 'rgba(0,166,81,0.35)',   color: '#4ade80' },
                    { label: 'PAYPAL',  bg: 'rgba(24,160,251,0.12)',  border: 'rgba(24,160,251,0.35)', color: '#60cfff' },
                    { label: 'PESAPAL', bg: 'rgba(212,168,71,0.12)',  border: 'rgba(212,168,71,0.3)',  color: 'var(--savannah)' },
                  ].map(p => (
                    <div key={p.label} className="cart-payment-badge"
                         style={{ background: p.bg, border: `1px solid ${p.border}` }}>
                      <span style={{ color: p.color }}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
