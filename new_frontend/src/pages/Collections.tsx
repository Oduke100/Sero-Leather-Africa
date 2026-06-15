import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, type Category } from '../api/index';

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

export default function Collections() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const navigate = useNavigate();
  const API_BASE = `http://${window.location.hostname}:8000`;

  useReveal();

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <div className="products-hero">
        <div className="section-inner">
          <p className="eyebrow reveal">Explore</p>
          <h1 className="products-hero-title reveal" style={{ transitionDelay: '.1s' }}>
            Our<br /><em>Collections</em>
          </h1>
          <p className="products-hero-sub reveal" style={{ transitionDelay: '.2s' }}>
            Choose a collection to discover handcrafted leather goods
          </p>
        </div>
      </div>

      <div className="kente-border" aria-hidden="true" />

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
                <div
                  key={c.id}
                  className="category-card reveal"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                  onClick={() => navigate(`/collections/${c.slug}`)}
                >
                  <img
                    src={`${API_BASE}${c.image_url}`}
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
          )}
        </div>
      </section>
    </>
  );
}
