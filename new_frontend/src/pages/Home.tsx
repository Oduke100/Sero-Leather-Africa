import { useEffect, useRef, useState } from 'react';
import { getCategories, type Category } from '../api/index';

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
          <a href="/collections" className="btn-savannah">Explore Collections</a>
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


function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    getCategories()
      .then(data => setCategories(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="categories-section">
      <div className="section-inner">
        <div className="reveal">
          <p className="eyebrow">Shop By Category</p>
          <h2 className="section-title">Browse The Range</h2>
        </div>
        <div className="categories-grid">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '4/3' }} />)}
        </div>
      </div>
    </section>
  );

  if (!categories.length) return null;

  return (
    <section className="categories-section">
      <div className="section-inner">
        <div className="reveal">
          <p className="eyebrow">Shop By Category</p>
          <h2 className="section-title">Browse The Range</h2>
        </div>
        <div className="categories-grid">
          {categories.map((c, i) => (
            <div
              key={c.id}
              className="category-card reveal"
              style={{ transitionDelay: `${i * 0.1}s` }}
              onClick={() => window.location.href = `/collections/${c.slug}`}
            >
              <img
                src={`${import.meta.env.VITE_API_BASE?.replace("/api","") || "`http://${window.location.hostname}:8000`"}${c.image_url}`}
                alt={c.name}
                onError={e => (e.currentTarget.src = 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop')}
              />
              <div className="category-card-content">
                <h3 className="category-name">{c.name}</h3>
                <p className="category-desc">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
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
            src="/sero_index_page.webp"
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
      <Categories />
      <Stats />
      <Story />
      <WaveDivider />
      <USP />
      <Newsletter />
    </>
  );
}