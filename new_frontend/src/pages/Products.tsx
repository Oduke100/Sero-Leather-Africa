import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProducts, type Product } from '../api/index';
import { useCurrency } from '../context/CurrencyContext';

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

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ p }: { p: Product }) {
  const { convertPrice } = useCurrency();
  const navigate = useNavigate();
  const { addItem } = useCart();
  return (
    <div className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
      {p.image && <img src={p.image} alt={p.name} />}
      {p.qty === 0 && <div className="sold-out-badge">Sold Out</div>}
      <div className="view-hint"><div className="view-hint-label">View Details</div></div>
      <div className="product-card-content">
        <p className="product-category">Leather Goods</p>
        <h3 className="product-name">{p.name}</h3>
        <p className="product-desc">{p.description}</p>
        <div className="product-footer">
          <span className="product-price">{convertPrice(p.price)}</span>
          <button className="product-add" disabled={p.qty === 0}
            onClick={e => { e.stopPropagation(); addItem({ product_id: p.id, name: p.name, price: p.price, image: p.image }); showToast(`${p.name} — added to your bag`); }}>
            {p.qty === 0 ? 'Sold Out' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export default function Products() {
  const [all,      setAll]      = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [query,    setQuery]    = useState('');
  const [sort,     setSort]     = useState('default');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  useReveal();

  useEffect(() => {
    getProducts()
      .then(products => { setAll(products); setFiltered(products); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = all.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'price-low')  result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result = [...result].sort((a, b) => b.price - a.price);
    setFiltered(result);
  }, [query, sort, all]);

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="products-hero">
        <div className="section-inner">
          <p className="eyebrow reveal">The Full Range</p>
          <h1 className="products-hero-title reveal" style={{ transitionDelay: '.1s' }}>Our<br /><em>Collections</em></h1>
          <p className="products-hero-sub reveal" style={{ transitionDelay: '.2s' }}>Premium leather goods handcrafted in Nairobi, Kenya</p>
        </div>
      </div>

      <div className="kente-border" aria-hidden="true" />

      {/* ─── FILTER BAR ───────────────────────────────────────────────────────── */}
      <div className="filter-bar">
        <div className="section-inner filter-inner">
          <div className="search-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search the collection..." className="search-input" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="default">Sort by</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* ─── PRODUCT GRID ─────────────────────────────────────────────────────── */}
      <section className="products-section" style={{ minHeight: '100vh' }}>
        <div className="section-inner">
          {loading && (
            <div className="products-grid">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 380 }} />)}
            </div>
          )}
          {error && <p className="products-error">Could not reach the server</p>}
          {!loading && !error && filtered.length === 0 && (
            <div className="products-page-empty">
              <p className="products-page-empty-title">Nothing found</p>
              <p className="products-page-empty-sub">Try a different search</p>
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="products-grid">
              {filtered.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}