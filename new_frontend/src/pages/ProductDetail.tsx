import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, type Product } from '../api/index';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  });
}

function showToast(msg: string) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ─── PRODUCT DETAIL ───────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id }           = useParams<{ id: string }>();
  const navigate         = useNavigate();
  const { convertPrice } = useCurrency();
  const { addItem }      = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty,     setQty]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  useReveal();

  useEffect(() => {
    const pid = parseInt(id || '');
    if (!pid || isNaN(pid)) { setError(true); setLoading(false); return; }
    getProduct(pid)
      .then(p => setProduct(p))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (product) document.title = `${product.name} — Sero Leather Africa`;
  }, [product]);

  function changeQty(delta: number) {
    setQty(q => {
      const next = q + delta;
      const max  = product?.qty ?? 99;
      return next < 1 ? 1 : next > max ? max : next;
    });
  }

  // ─── SKELETON ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="section-inner" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <div className="pd-grid">
        <div className="skeleton" style={{ aspectRatio: '1', width: '100%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 16 }}>
          <div className="skeleton" style={{ height: 12, width: '30%' }} />
          <div className="skeleton" style={{ height: 56, width: '100%' }} />
          <div className="skeleton" style={{ height: 32, width: '40%' }} />
          <div className="skeleton" style={{ height: 80, width: '100%' }} />
          <div className="skeleton" style={{ height: 56, width: '100%', marginTop: 24 }} />
        </div>
      </div>
    </div>
  );

  // ─── ERROR ────────────────────────────────────────────────────────────────
  if (error || !product) return (
    <div className="pd-error">
      <p className="pd-error-title">Product Not Found</p>
      <p className="pd-error-sub">This piece may no longer be available.</p>
      <button className="pd-back-btn" onClick={() => navigate('/products')}>Browse Collections</button>
    </div>
  );

  const soldOut = !product.available || product.qty === 0;

  // ─── CONTENT ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* ─── BREADCRUMB ───────────────────────────────────────────────────── */}
      <nav className="pd-breadcrumb">
        <span className="pd-breadcrumb-link" onClick={() => navigate('/')}>Home</span>
        <span>/</span>
        <span className="pd-breadcrumb-link" onClick={() => navigate('/products')}>Collections</span>
        <span>/</span>
        <span className="pd-breadcrumb-active">{product.name}</span>
      </nav>

      <div className="section-inner pd-grid">

        {/* ─── IMAGE ────────────────────────────────────────────────────── */}
        <div className="reveal">
          <div className="pd-img-wrap">
            {product.image && <img src={product.image} alt={product.name} />}
            {soldOut && <div className="pd-sold-badge">Sold Out</div>}
            <div className="kente-border" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 }} />
          </div>
        </div>

        {/* ─── DETAILS ──────────────────────────────────────────────────── */}
        <div className="reveal" style={{ transitionDelay: '.15s' }}>
          <p className="pd-category">Leather Goods</p>
          <h1 className="pd-name">{product.name}</h1>
          <p className="pd-price">{convertPrice(product.price)}</p>
          <p className="pd-description">{product.description || 'A premium handcrafted leather piece made with care in Nairobi, Kenya.'}</p>
          <p className="pd-stock">{soldOut ? 'This item is currently out of stock' : `${product.qty} in stock`}</p>

          {/* ─── ACTIONS ────────────────────────────────────────────────── */}
          <div className="pd-actions-wrap">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="pd-label">Quantity</label>
              <div className="pd-qty-row">
                <button className="pd-qty-btn" onClick={() => changeQty(-1)}>−</button>
                <span className="pd-qty-value">{qty}</span>
                <button className="pd-qty-btn" onClick={() => changeQty(1)}>+</button>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="pd-label" style={{ opacity: 0, userSelect: 'none' }}>Action</label>
              <button className="pd-bag-btn" disabled={soldOut}
                onClick={() => { addItem({ product_id: product.id, name: product.name, image: product.image, price: product.price }, qty); showToast(`${product.name} — added to your bag`); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                {soldOut ? 'Sold Out' : 'Add to Bag'}
              </button>
            </div>
          </div>

          {/* ─── TRUST TILES ────────────────────────────────────────────── */}
          <div className="pd-tiles">
            {[
              { icon: '🌍', title: 'Authentic Origins', sub: 'Local Kenyan artisans'    },
              { icon: '🛡', title: 'Quality Guarantee', sub: 'Built to last a lifetime' },
              { icon: '🚚', title: 'Nairobi Delivery',  sub: 'Same-day within CBD'      },
              { icon: '↩',  title: 'Easy Returns',      sub: '7-day return policy'      },
            ].map(f => (
              <div key={f.title} className="pd-tile">
                <span style={{ fontSize: 20, marginBottom: 8, display: 'block' }}>{f.icon}</span>
                <h4 className="pd-tile-title">{f.title}</h4>
                <p className="pd-tile-sub">{f.sub}</p>
              </div>
            ))}
          </div>

          <button className="pd-back-link" onClick={() => navigate('/products')}>← Back to Collections</button>
        </div>
      </div>
    </>
  );
}