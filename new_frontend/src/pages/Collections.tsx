import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, type Category } from '../api/index';

const API_BASE = `http://${window.location.hostname}:8000`;

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

// ─── COLLECTIONS ──────────────────────────────────────────────────────────────
export default function Collections() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const navigate = useNavigate();
  useReveal();

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="products-hero">
        <div className="section-inner">
          <p className="eyebrow reveal">Explore</p>
          <h1 className="products-hero-title reveal" style={{ transitionDelay: '.1s' }}>Our<br /><em>Collections</em></h1>
          <p className="products-hero-sub reveal" style={{ transitionDelay: '.2s' }}>Choose a collection to discover handcrafted leather goods</p>
        </div>
      </div>

      <div className="kente-border" aria-hidden="true" />

      {/* ─── GRID ─────────────────────────────────────────────────────────────── */}
      <section className="categories-section" style={{ minHeight: '60vh' }}>
        <div className="section-inner">
          {loading && (
            <div className="categories-grid">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '4/3' }} />)}
            </div>
          )}
          {error && <p className="products-error">Could not load collections</p>}
          {!loading && !error && categories.length === 0 && (
            <div className="products-page-empty">
              <p className="products-page-empty-title">No collections yet</p>
              <p className="products-page-empty-sub">Check back soon</p>
            </div>
          )}
          {!loading && !error && categories.length > 0 && (
            <div className="categories-grid">
              {categories.map((c, i) => (
                <div key={c.id} className="category-card reveal" style={{ transitionDelay: `${i * 0.1}s` }} onClick={() => navigate(`/collections/${c.slug}`)}>
                  {c.image_url && <img src={`${API_BASE}${c.image_url}`} alt={c.name} />}
                  <div className="category-card-content">
                    <h3 className="category-name">{c.name}</h3>
                    <p className="category-desc">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}