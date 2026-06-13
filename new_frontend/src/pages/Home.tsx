import { useEffect, useRef, useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { getProducts, type Product } from '../api/index';

function useReveal(dep?: unknown) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const obs = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
        { threshold: 0.1 }
      );
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));
    }, 100);
    return () => clearTimeout(timer);
  }, [dep]);
}

function showToast(msg: string) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function addToCart(id: number, name: string, price: number, image: string) {
  const cart = JSON.parse(localStorage.getItem('sero-cart') || '[]');
  const existing = cart.find((i: { id: number }) => i.id === id);
  if (existing) existing.quantity++;
  else cart.push({ id, name, price, image, quantity: 1 });
  localStorage.setItem('sero-cart', JSON.stringify(cart));
  showToast(`${name} — added to your bag`);
}

/* ── Ticker items ───────────────────────────────────────────── */
const TICKER = [
  'Premium Full-Grain Leather',
  'Handcrafted in Nairobi',
  'Ethically Sourced',
  'Ships Across Kenya & Beyond',
];

/* ── Sub-components ─────────────────────────────────────────── */

function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => bgRef.current?.classList.add('loaded'), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="hero">
      <div className="hero-bg" ref={bgRef} />

      <div className="hero-content">
        <h1 className="hero-title reveal" style={{ transitionDelay: '.5s' }}>
          Carry The<br /><em>Spirit</em><br />Of Africa
        </h1>
        <p className="hero-sub reveal" style={{ transitionDelay: '.7s' }}>
          Handcrafted leather goods born from lisero.<br />Worn by the world.
        </p>
        <div className="hero-cta reveal" style={{ transitionDelay: '.9s' }}>
          <a href="/products" className="btn-savannah">Explore Collections</a>
          <a href="/about"    className="btn-ember">Our Story</a>
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true">
        <span>Scroll</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </section>
  );
}

function Ticker() {
  const items = [...TICKER, ...TICKER]; // duplicate for seamless loop
  return (
    <div className="ticker-wrap" aria-hidden="true">
      <div className="ticker-track">
        {items.map((t, i) => (
          <span key={i} className="ticker-item">
            {t}<span className="ticker-dot">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  const { convertPrice } = useCurrency();
  return (
    <div className="product-card reveal" onClick={() => window.location.href = `/product?id=${p.id}`}>
      <img
        src={p.image}
        alt={p.name}
        onError={e => (e.currentTarget.src = '/images/sero_index_page.webp')}
      />
      {p.qty === 0 && <div className="sold-out-badge">Sold Out</div>}
      <div className="product-card-content">
        <p className="product-category">Leather Goods</p>
        <h3 className="product-name">{p.name}</h3>
        <p className="product-desc">{p.description}</p>
        <div className="product-footer">
          <span className="product-price">{convertPrice(p.price)}</span>
          <button
            className="product-add"
            disabled={p.qty === 0}
            onClick={e => { e.stopPropagation(); addToCart(p.id, p.name, p.price, p.image); }}
          >
            {p.qty === 0 ? 'Sold Out' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 380 }} />
      ))}
    </>
  );
}

function ProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  useReveal(products);
  useEffect(() => {
    getProducts()
      .then(list => setProducts(list.filter(p => p.available).slice(0, 4)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="products-section">
      <div className="section-inner">
        <div className="section-header">
          <div className="reveal">
            <p className="eyebrow">New Season</p>
            <h2 className="section-title">The Collection</h2>
          </div>
          <a href="/products" className="btn-savannah reveal" style={{ transitionDelay: '.2s' }}>
            View All Pieces
          </a>
        </div>

        <div className="products-grid">
          {loading && <ProductsSkeleton />}
          {error   && <p className="products-error">Could not load products</p>}
          {!loading && !error && products.length === 0 && (
            <p className="products-empty">No products available right now</p>
          )}
          {!loading && products.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { num: '50+',  label: 'Happy Customers' },
    { num: '100%', label: 'Handcrafted'     },
    { num: '🇰🇪',  label: 'Made in Kenya'   },
    { num: '∞',    label: 'Lifetime Quality' },
  ];
  return (
    <section className="stats-section">
      {items.map((s, i) => (
        <div key={i} className="stat reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
          <div className="stat-num">{s.num}</div>
          <p className="stat-label">{s.label}</p>
        </div>
      ))}
    </section>
  );
}

function Story() {
  return (
    <section className="story-section">
      <div className="story-glow" aria-hidden="true" />
      <div className="section-inner story-grid">

        <div className="story-image-wrap reveal-left">
          <img
            src="/images/sero_index_page.webp"
            alt="Leather craftsmanship"
            className="story-image"
          />
          <div className="story-corner story-corner--br" aria-hidden="true" />
          <div className="story-corner story-corner--tl" aria-hidden="true" />
          <div className="kente-border story-kente"      aria-hidden="true" />
        </div>

        <div className="reveal-right">
          <p className="eyebrow">Born From The Earth</p>
          <h2 className="story-title">
            Where <br /><em>Lisero</em><br />is redefined<br />through Craft
          </h2>
          <div className="story-rule" aria-hidden="true" />
          <p className="story-body">
            Each SERO product is made from ethically sourced cow hides (Lisero) and handcrafted
            by skilled artisans. A celebration of heritage, craft, and durability.
          </p>
          <p className="story-body story-body--muted">
            Our artisans in Nairobi have spent years perfecting their craft, blending traditional
            African techniques with modern precision to create leather goods that are both
            beautiful and built to last a lifetime.
          </p>
          <a href="/about" className="btn-savannah">Discover Our Story</a>
        </div>
      </div>
    </section>
  );
}

function WaveDivider() {
  return (
    <div className="wave-divider" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path fill="#1A0F08" d="M0,120 L0,60 C180,120 360,0 540,60 C720,120 900,0 1080,60 C1260,120 1380,40 1440,60 L1440,120 Z"/>
        <circle cx="720" cy="35" r="28" fill="rgba(212,168,71,0.15)"/>
        <circle cx="720" cy="35" r="18" fill="rgba(212,168,71,0.2)"/>
        <g fill="#1A0F08" opacity="0.8">
          <ellipse cx="350" cy="95" rx="15" ry="8"/><rect x="342" y="95" width="4" height="12"/><rect x="358" y="95" width="4" height="12"/><ellipse cx="355" cy="87" rx="8" ry="6"/>
          <ellipse cx="420" cy="98" rx="12" ry="7"/><rect x="414" y="98" width="3" height="10"/><rect x="428" y="98" width="3" height="10"/><ellipse cx="424" cy="91" rx="7" ry="5"/>
          <ellipse cx="490" cy="100" rx="14" ry="7"/><rect x="483" y="100" width="4" height="11"/><rect x="497" y="100" width="4" height="11"/><ellipse cx="494" cy="93" rx="7" ry="5"/>
        </g>
      </svg>
    </div>
  );
}

function USP() {
  const items = [
    { icon: '🚚', title: 'Nairobi Delivery',    body: 'Same-day delivery within Nairobi. Nationwide shipping available.'     },
    { icon: '🏆', title: 'Lifetime Guarantee', body: 'Every piece is built to outlast trends. We stand behind our craft.'    },
    { icon: '🤝', title: 'Artisan Made',        body: 'Every stitch placed by hand. Crafted from Lisero.'                    },
  ];
  return (
    <section className="usp-section">
      {items.map((u, i) => (
        <div key={i} className={`usp-item reveal${i < 2 ? ' usp-item--border' : ''}`} style={{ transitionDelay: `${i * 0.15}s` }}>
          <span className="usp-icon" aria-hidden="true">{u.icon}</span>
          <h3 className="usp-title">{u.title}</h3>
          <p  className="usp-body">{u.body}</p>
        </div>
      ))}
    </section>
  );
}

function Newsletter() {
  const [submitted, setSubmitted] = useState(false);

  const handle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Welcome to the herd ✦');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <section className="newsletter-section">
      <div className="newsletter-glow" aria-hidden="true" />
      <div className="newsletter-inner reveal">
        <p className="eyebrow">Join The Herd</p>
        <h2 className="newsletter-title">
          Stay Connected<br /><em>to the Wild</em>
        </h2>
        <p className="newsletter-sub">New arrivals, exclusive drops and stories from the savannah.</p>
        {submitted ? (
          <p className="newsletter-thanks">You're in. Welcome to the herd ✦</p>
        ) : (
          <form className="newsletter-form" onSubmit={handle}>
            <input type="email" placeholder="your@email.com" required className="newsletter-input" />
            <button type="submit" className="btn-ember">Subscribe</button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function Home() {
  useReveal();

  return (
    <>
      <Hero />
      <div className="kente-border" aria-hidden="true" />
      <Ticker />
      <ProductsGrid />
      <Stats />
      <Story />
      <WaveDivider />
      <USP />
      <Newsletter />
    </>
  );
}