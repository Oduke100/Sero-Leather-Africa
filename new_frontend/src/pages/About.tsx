import { useEffect } from 'react';

/* ── DATA ── */
const TICKER = [
  'Born in Nairobi',
  'Ethically Sourced Leather',
  '20+ Local Artisans',
  '5+ Years of Craft',
];
const STATS = [
  { num: '50+',  label: 'Happy Customers' },
  { num: '100%', label: 'Handcrafted'     },
  { num: '20+',  label: 'Local Artisans'  },
  { num: '🇰🇪',  label: 'Made in Kenya'   },
];
const VALUES = [
  { icon: '🏆', title: 'Uncompromising Quality',  body: 'Every stitch is inspected. Every hide evaluated. We build leather goods designed to outlast trends and outlive expectations.' },
  { icon: '🤝', title: 'Empowering Communities',  body: 'By employing local talent and paying fair wages, we invest directly back into the communities that inspire our designs every day.' },
  { icon: '🌿', title: 'Sustainable Practices',   body: 'We use vegetable tanning and aim for zero waste production by upcycling every leather scrap into smaller accessories.' },
];

/* ── HOOK ── */
function useReveal() {
  useEffect(() => {
    const sel = '.reveal, .reveal-left, .reveal-right';
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(sel).forEach(el => obs.observe(el));
    setTimeout(() => {
      document.querySelectorAll(sel).forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
      });
    }, 100);
    return () => obs.disconnect();
  }, []);
}

/* ── COMPONENT ── */
export default function About() {
  useReveal();
  return (
    <>
      {/* ── HERO ── */}
      <section className="about-hero">
        <div className="about-hero-bg" />
        <div className="section-inner about-hero-content">
          <p className="eyebrow reveal">The Artisans</p>
          <h1 className="about-hero-title reveal" style={{ transitionDelay: '.1s' }}>Our<br /><em>Story</em></h1>
          <p className="about-hero-sub reveal" style={{ transitionDelay: '.2s' }}>
            Preserving African heritage through master craftsmanship and the finest leathers.
          </p>
        </div>
      </section>
      <div className="kente-border" aria-hidden="true" />
      {/* ── TICKER ── */}
      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="ticker-item">{t}<span className="ticker-dot">✦</span></span>
          ))}
        </div>
      </div>
      {/* ── ORIGIN STORY ── */}
      <section className="story-section">
        <div className="story-glow" aria-hidden="true" />
        <div className="section-inner story-grid">
          <div className="story-image-wrap reveal-left">
            <img
              src="/sero_about_page.webp"
              alt="Craftsmanship"
              className="story-image"
              onError={e => (e.currentTarget.src = 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&auto=format&fit=crop')}
            />
            <div className="story-corner story-corner--br" aria-hidden="true" />
            <div className="story-corner story-corner--tl" aria-hidden="true" />
            <div className="kente-border story-kente"      aria-hidden="true" />
          </div>
          <div className="reveal-right">
            <p className="eyebrow">Rooted in Tradition</p>
            <h2 className="story-title">Where <br /><em>Lisero</em><br />becomes heritage</h2>
            <div className="story-rule" aria-hidden="true" />
            <p className="story-body">
              SERO comes from Lisero, the Idakho (Luhya) word for animal hide. Rooted in this heritage,
              we create premium leather goods from ethically sourced cow hides, blending tradition with
              thoughtful, modern craftsmanship. Each piece begins with raw material and is transformed
              by skilled artisans who understand the value of patience, precision, and detail.
            </p>
            <p className="story-body story-body--muted">
              Our work is guided by a simple philosophy: to create leather goods that last. We focus on
              timeless design, honest materials, and quiet elegance — pieces that age beautifully and
              carry meaning over time. At SERO, we do not chase trends; we craft enduring objects that
              reflect heritage, durability, and understated luxury.
            </p>
            <a href="/collections" className="btn-savannah">See The Collection</a>
          </div>
        </div>
      </section>
      {/* ── STATS ── */}
      <section className="about-stats">
        {STATS.map((s, i) => (
          <div key={i} className="about-stat reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
            <div className="about-stat-num">{s.num}</div>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </section>
      {/* ── VALUES ── */}
      <section className="about-values">
        <div className="section-inner">
          <div className="text-center reveal" style={{ marginBottom: 80 }}>
            <p className="eyebrow">What Drives Us</p>
            <h2 className="section-title">Our Values</h2>
          </div>
          <div className="values-grid">
            {VALUES.map((v, i) => (
              <div key={i} className="value-card reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
                <span className="value-icon" aria-hidden="true">{v.icon}</span>
                <h3 className="value-title">{v.title}</h3>
                <p  className="value-body">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── CTA ── */}
      <section className="about-cta">
        <div className="about-cta-glow" aria-hidden="true" />
        <div className="reveal" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <p className="eyebrow">Ready?</p>
          <h2 className="about-cta-title">Own a Piece of<br /><em>Kenya</em></h2>
          <p className="about-cta-sub">Find something made just for you.</p>
          <a href="/collections" className="btn-savannah">Browse Collections</a>
        </div>
      </section>
    </>
  );
}