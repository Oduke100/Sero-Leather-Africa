import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProductsByCategory, getCategories, type Product, type Category } from '../api/index';
import { useCurrency } from '../context/CurrencyContext';

const API_BASE = import.meta.env.VITE_API_BASE?.replace('/api', '') || `http://${window.location.hostname}:8000`;

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
      {p.image && <img src={`${API_BASE}${p.image}`} alt={p.name} />}
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

// ─── COLLECTION DETAIL ────────────────────────────────────────────────────────
export default function CollectionDetail() {
  const { slug }               = useParams<{ slug: string }>();
  const navigate               = useNavigate();
  const [products,  setProducts] = useState<Product[]>([]);
  const [category,  setCategory] = useState<Category | null>(null);
  const [loading,   setLoading]  = useState(true);
  const [error,     setError]    = useState(false);
  const [query,     setQuery]    = useState('');
  const [sort,      setSort]     = useState('default');

  useEffect(() => {
    if (!slug) return;
    Promise.all([getProductsByCategory(slug), getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategory(cats.find(c => c.slug === slug) || null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const filtered = (() => {
    let result = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'price-low')  result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result = [...result].sort((a, b) => b.price - a.price);
    return result;
  })();

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="collection-hero">
        {category?.image_url && (
          <div className="collection-hero-bg" style={{ backgroundImage: `url(${API_BASE}${category.image_url})` }} />
        )}
        <div className="collection-hero-overlay" />
        <div className="section-inner collection-hero-content">
          <button className="pd-back-link" onClick={() => navigate('/collections')}>← All Collections</button>
          <p className="eyebrow" style={{ marginTop: 16 }}>Collection</p>
          <h1 className="collection-hero-title">{category?.name || slug}</h1>
          {category?.description && <p className="collection-hero-desc">{category.description}</p>}
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
            <input type="text" placeholder="Search this collection..." className="search-input" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="default">Sort by</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* ─── PRODUCT GRID ─────────────────────────────────────────────────────── */}
      <section className="products-section" style={{ minHeight: '60vh' }}>
        <div className="section-inner">
          {loading && (
            <div className="products-grid">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 380 }} />)}
            </div>
          )}
          {error && <p className="products-error">Could not load products</p>}
          {!loading && !error && filtered.length === 0 && (
            <div className="products-page-empty">
              <p className="products-page-empty-title">Nothing here yet</p>
              <p className="products-page-empty-sub">Check back soon</p>
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