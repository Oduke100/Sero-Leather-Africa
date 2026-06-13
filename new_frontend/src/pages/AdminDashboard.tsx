import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminProducts, deleteAdminProduct, toggleProduct,
  updateAdminProduct, getOrders, updateOrderStatus,
  type AdminProduct, type Order,
  getCategories, createCategory,
  type Category,
} from '../api/index';
import { useCurrency } from '../context/CurrencyContext';

/* ── tiny helpers ───────────────────────────────────────────── */
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return msg ? <div className={`adm-toast adm-toast--${type}`}>{msg}</div> : null;
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="adm-stat">
      <p className="adm-stat-label">{label}</p>
      <p className="adm-stat-value" style={color ? { color } : {}}>{value}</p>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate           = useNavigate();
  const { convertPrice }   = useCurrency();

  const [tab,       setTab]       = useState<'inventory' | 'orders' | 'categories'>('inventory');
  const [products,  setProducts]  = useState<AdminProduct[]>([]);
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [pLoading,  setPLoading]  = useState(true);
  const [oLoading,  setOLoading]  = useState(false);
  const [toast,     setToast]     = useState({ msg: '', type: 'ok' as 'ok' | 'err' });
  const [deleteId,  setDeleteId]  = useState<number | null>(null);
  const [editId,    setEditId]    = useState<number | null>(null);
  const [editData,  setEditData]  = useState<Partial<AdminProduct>>({});
  const [orderModal, setOrderModal] = useState<Order | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct,  setNewProduct]  = useState({
    name: '', slug: '', description: '', image_url: '',
    price: '', stock: '', category_id: '',
    is_active: true, is_customisable: false,
    is_on_discount: false, discount_percentage: 0,
  });
  const [addLoading, setAddLoading] = useState(false);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [cLoading,      setCLoading]      = useState(false);
  const [showCatForm,   setShowCatForm]   = useState(false);
  const [newCat,        setNewCat]        = useState({ name: '', slug: '', description: '', image_url: '' });
  const [catAddLoading, setCatAddLoading] = useState(false);
  const catFileRef = useRef<HTMLInputElement>(null);
  const [catImgLoading, setCatImgLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [editUploadLoading, setEditUploadLoading] = useState(false);
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  function notify(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 3200);
  }

  function logout() {
    sessionStorage.removeItem('sero_admin_token');
    navigate('/admin/login', { replace: true });
  }

  /* auth guard */
  useEffect(() => {
    if (!sessionStorage.getItem('sero_admin_token')) navigate('/admin/login', { replace: true });
  }, []);

  const loadProducts = useCallback(async () => {
    setPLoading(true);
    try {
      setProducts(await getAdminProducts());
    } catch {
      notify('Could not load products', 'err');
    } finally {
      setPLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOLoading(true);
    try {
      setOrders(await getOrders());
    } catch {
      notify('Could not load orders', 'err');
    } finally {
      setOLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setCLoading(true);
    try { setCategories(await getCategories()); }
    catch { notify('Could not load categories', 'err'); }
    finally { setCLoading(false); }
  }, []);

  useEffect(() => { loadProducts(); loadCategories(); }, []);
  useEffect(() => { if (tab === 'categories') loadCategories(); }, [tab]);
  useEffect(() => { if (tab === 'orders') loadOrders(); }, [tab]);

  /* ── actions ──────────────────────────────────────────────── */
  async function handleToggle(id: number) {
    try {
      await toggleProduct(id);
      notify('Availability updated');
      loadProducts();
    } catch { notify('Toggle failed', 'err'); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteAdminProduct(deleteId);
      notify('Product deleted');
      setDeleteId(null);
      loadProducts();
    } catch { notify('Delete failed', 'err'); }
  }

  async function handleEdit() {
    if (!editId) return;
    try {
      await updateAdminProduct(editId, editData);
      notify('Product updated');
      setEditId(null);
      setEditData({});
      loadProducts();
    } catch { notify('Update failed', 'err'); }
  }


  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) return notify('Only JPEG, PNG or WebP allowed', 'err');
    if (mode === 'add') setUploadLoading(true);
    else setEditUploadLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      if (mode === 'add') setNewProduct(p => ({ ...p, image_url: data.url }));
      else                setEditData(d  => ({ ...d, image: data.url }));
      notify('Image uploaded ✓');
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : 'Upload failed', 'err');
    } finally {
      if (mode === 'add') setUploadLoading(false);
      else setEditUploadLoading(false);
      e.target.value = '';
    }
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleAddProduct() {
    if (!newProduct.name.trim()) return notify('Name is required', 'err');
    if (!newProduct.price)       return notify('Price is required', 'err');
    if (!newProduct.stock)       return notify('Stock is required', 'err');
    if (!newProduct.category_id) return notify('Category is required', 'err');
    setAddLoading(true);
    try {
      const { createProduct } = await import('../api');
      await createProduct({
        name:                newProduct.name.trim(),
        slug:                newProduct.slug || slugify(newProduct.name),
        description:         newProduct.description,
        image_url:           newProduct.image_url,
        price:               parseFloat(newProduct.price),
        stock:               parseInt(newProduct.stock),
        is_active:           newProduct.is_active,
        is_customisable:     newProduct.is_customisable,
        is_on_discount:      newProduct.is_on_discount,
        discount_percentage: newProduct.discount_percentage,
        category_id:         parseInt(newProduct.category_id),
      });
      notify('Product added!');
      setShowAddForm(false);
      setNewProduct({ name: '', slug: '', description: '', image_url: '', price: '', stock: '', category_id: '', is_active: true, is_customisable: false, is_on_discount: false, discount_percentage: 0 });
      loadProducts();
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : 'Create failed', 'err');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleCatImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCatImgLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setNewCat(c => ({ ...c, image_url: data.url }));
      notify('Image uploaded ✓');
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : 'Upload failed', 'err');
    } finally {
      setCatImgLoading(false);
      e.target.value = '';
    }
  }

  function catSlugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleAddCategory() {
    if (!newCat.name.trim())        return notify('Name is required', 'err');
    if (!newCat.description.trim()) return notify('Description is required', 'err');
    if (!newCat.image_url)          return notify('Image is required', 'err');
    setCatAddLoading(true);
    try {
      await createCategory({
        name:        newCat.name.trim(),
        slug:        newCat.slug || catSlugify(newCat.name),
        description: newCat.description.trim(),
        image_url:   newCat.image_url,
      });
      notify('Category created!');
      setShowCatForm(false);
      setNewCat({ name: '', slug: '', description: '', image_url: '' });
      loadCategories();
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : 'Create failed', 'err');
    } finally {
      setCatAddLoading(false);
    }
  }

  async function handleOrderStatus(id: number, status: string) {
    try {
      await updateOrderStatus(id, status);
      notify(`Order #${id} → ${status}`);
      loadOrders();
    } catch { notify('Status update failed', 'err'); }
  }

  /* ── derived stats ────────────────────────────────────────── */
  const pending = orders.filter(o => o.status === 'Pending').length;

  return (
    <div className="adm-root">

      {/* Toast */}
      <Toast msg={toast.msg} type={toast.type} />

      {/* Delete confirm modal */}
      {deleteId !== null && (
        <div className="adm-overlay">
          <div className="adm-modal">
            <h3 className="adm-modal-title">Delete Product?</h3>
            <p className="adm-modal-body">This permanently removes the product from your inventory.</p>
            <div className="adm-modal-actions">
              <button className="adm-btn adm-btn--ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="adm-btn adm-btn--danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editId !== null && (
        <div className="adm-overlay">
          <div className="adm-modal adm-modal--wide">
            <h3 className="adm-modal-title">Edit Product</h3>
            <div className="adm-edit-grid">
              {([
                ['Name',        'name',        'text',   editData.name        ?? ''],
                ['Description', 'description', 'text',   editData.description ?? ''],
                ['Price (KES)', 'price',       'number', editData.price       ?? ''],
                ['Stock',       'qty',         'number', editData.qty         ?? ''],
                // image handled separately
              ] as [string, keyof AdminProduct, string, string | number][]).map(([label, key, type, val]) => (
                <div key={key} className="adm-field">
                  <label className="adm-field-label">{label}</label>
                  <input
                    type={type}
                    className="adm-field-input"
                    value={val}
                    onChange={e => setEditData(d => ({
                      ...d,
                      [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value,
                    }))}
                  />
                </div>
              ))}
              {/* Image picker */}
              <div className="adm-field" style={{ gridColumn: '1 / -1' }}>
                <label className="adm-field-label">Product Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {editData.image && (
                    <img
                      src={editData.image} alt="preview"
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                  )}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={e => handleImageUpload(e, 'edit')}
                  />
                  <button
                    type="button"
                    className="adm-btn adm-btn--ghost adm-btn--sm"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={editUploadLoading}
                  >
                    {editUploadLoading ? 'Uploading…' : editData.image ? '↺ Change Image' : '📁 Pick Image'}
                  </button>
                  {editData.image && (
                    <button
                      type="button"
                      className="adm-btn adm-btn--sm adm-btn--danger"
                      onClick={() => setEditData(d => ({ ...d, image: '' }))}
                    >✕</button>
                  )}
                </div>
              </div>
              <div className="adm-field">
                <label className="adm-field-label">
                  <input
                    type="checkbox"
                    checked={editData.available ?? false}
                    onChange={e => setEditData(d => ({ ...d, available: e.target.checked }))}
                    style={{ marginRight: 8 }}
                  />
                  Available
                </label>
              </div>
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn adm-btn--ghost" onClick={() => { setEditId(null); setEditData({}); }}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Order items modal */}
      {orderModal && (
        <div className="adm-overlay">
          <div className="adm-modal adm-modal--wide">
            <h3 className="adm-modal-title">Order #{orderModal.id} — Items</h3>
            <div className="adm-order-items">
              {orderModal.items.map((item, i) => (
                <div key={i} className="adm-order-item-row">
                  <div>
                    <p className="adm-order-item-name">{item.name}</p>
                    <p className="adm-order-item-qty">Qty: {item.quantity}</p>
                  </div>
                  <span className="adm-order-item-price">{convertPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="adm-order-total">
              <span>Total</span>
              <span>{convertPrice(orderModal.total)}</span>
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn adm-btn--ghost" onClick={() => setOrderModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <header className="adm-nav">
        <div className="adm-nav-inner">
          <div className="adm-nav-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Sero Admin
          </div>
          <div className="adm-nav-actions">
            <span className="adm-nav-badge">● Live</span>
            <a href="/" className="adm-nav-link">View Store</a>
            <button className="adm-nav-link" onClick={logout}>Log Out</button>
          </div>
        </div>
      </header>

      <div className="adm-body">

        {/* Page heading */}
        <div className="adm-heading">
          <h1 className="adm-heading-title">Dashboard</h1>
          <p className="adm-heading-sub">Manage inventory and orders</p>
        </div>

        {/* Stats */}
        <div className="adm-stats-row">
          <Stat label="Total Products"  value={products.length}                              />
          <Stat label="Available"       value={products.filter(p => p.available).length}     color="#16a34a" />
          <Stat label="Total Orders"    value={orders.length}                                color="var(--adm-gold)" />
          <Stat label="Pending Orders"  value={pending}                                      color="#d97706" />
        </div>

        {/* Tabs */}
        <div className="adm-tabs">
          <button
            className={`adm-tab${tab === 'inventory' ? ' adm-tab--active' : ''}`}
            onClick={() => setTab('inventory')}
          >
            Inventory
          </button>
          <button
            className={`adm-tab${tab === 'orders' ? ' adm-tab--active' : ''}`}
            onClick={() => setTab('orders')}
          >
            Orders {pending > 0 && <span className="adm-tab-badge">{pending}</span>}
          </button>
          <button
            className={`adm-tab${tab === 'categories' ? ' adm-tab--active' : ''}`}
            onClick={() => setTab('categories')}
          >
            Categories
          </button>
        </div>

        {/* ── INVENTORY TAB ──────────────────────────────────── */}
        {tab === 'inventory' && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span>Current Inventory</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="adm-refresh-btn" onClick={loadProducts}>↻ Refresh</button>
                <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setShowAddForm(s => !s)}>
                  {showAddForm ? '✕ Cancel' : '+ Add Product'}
                </button>
              </div>
            </div>

            {showAddForm && (
              <div className="adm-add-form">
                <div className="adm-edit-grid">
                  {([
                    ['Product Name *', 'name',        'text',   newProduct.name],
                    ['Slug (auto)',     'slug',        'text',   newProduct.slug],
                    ['Price (KES) *',  'price',       'number', newProduct.price],
                    ['Stock *',        'stock',       'number', newProduct.stock],
                    // image handled separately below
                    ['Description',    'description', 'text',   newProduct.description],
                  ] as [string, string, string, string][]).map(([label, key, type, val]) => (
                    <div key={key} className="adm-field">
                      <label className="adm-field-label">{label}</label>
                      <input
                        type={type}
                        className="adm-field-input"
                        placeholder={label.replace(' *', '')}
                        value={val}
                        onChange={e => setNewProduct(p => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                {/* Category */}
                <div className="adm-field">
                  <label className="adm-field-label">Category *</label>
                  <select
                    className="adm-field-input"
                    value={newProduct.category_id}
                    onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))}
                  >
                    <option value="">— select —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {/* Image picker */}
                <div className="adm-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="adm-field-label">Product Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {newProduct.image_url && (
                      <img
                        src={newProduct.image_url} alt="preview"
                        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={e => handleImageUpload(e, 'add')}
                    />
                    <button
                      type="button"
                      className="adm-btn adm-btn--ghost adm-btn--sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                    >
                      {uploadLoading ? 'Uploading…' : newProduct.image_url ? '↺ Change Image' : '📁 Pick Image'}
                    </button>
                    {newProduct.image_url && (
                      <button
                        type="button"
                        className="adm-btn adm-btn--sm adm-btn--danger"
                        onClick={() => setNewProduct(p => ({ ...p, image_url: '' }))}
                      >✕</button>
                    )}
                  </div>
                </div>
                <div className="adm-add-form-checks">
                  {([
                    ['is_active',       'Active (visible in store)'],
                    ['is_customisable', 'Customisable'],
                    ['is_on_discount',  'On Discount'],
                  ] as [keyof typeof newProduct, string][]).map(([key, label]) => (
                    <label key={key} className="adm-check-label">
                      <input
                        type="checkbox"
                        checked={newProduct[key] as boolean}
                        onChange={e => setNewProduct(p => ({ ...p, [key]: e.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                  <div className="adm-field" style={{ marginLeft: 'auto' }}>
                    <label className="adm-field-label">Discount %</label>
                    <input
                      type="number" className="adm-field-input" style={{ width: 80 }}
                      value={newProduct.discount_percentage}
                      onChange={e => setNewProduct(p => ({ ...p, discount_percentage: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                  <button
                    className="adm-btn adm-btn--primary"
                    onClick={handleAddProduct}
                    disabled={addLoading}
                  >
                    {addLoading ? 'Saving…' : 'Save Product'}
                  </button>
                </div>
              </div>
            )}

            {pLoading ? (
              <div className="adm-loading">Loading inventory…</div>
            ) : products.length === 0 ? (
              <div className="adm-empty">No products yet</div>
            ) : (
              <div className="adm-table">
                {/* Header */}
                <div className="adm-row adm-row--head">
                  <span>ID</span><span>Product</span><span>Price</span>
                  <span>Stock</span><span>Status</span><span>Actions</span>
                </div>
                {/* Rows */}
                {products.map(p => (
                  <div key={p.id} className="adm-row">
                    <span className="adm-cell-mono">#{p.id}</span>
                    <div className="adm-cell-product">
                      {p.image && (
                        <img
                          src={p.image} alt={p.name}
                          className="adm-product-thumb"
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <div>
                        <p className="adm-product-name">{p.name}</p>
                        <p className="adm-product-desc">{p.description || '—'}</p>
                      </div>
                    </div>
                    <span className="adm-cell-price">{convertPrice(p.price)}</span>
                    <span className="adm-cell-qty">{p.qty}</span>
                    <span className={`adm-badge ${p.available ? 'adm-badge--on' : 'adm-badge--off'}`}>
                      {p.available ? 'Active' : 'Hidden'}
                    </span>
                    <div className="adm-row-actions">
                      <button
                        className={`adm-btn adm-btn--sm ${p.available ? 'adm-btn--warn' : 'adm-btn--success'}`}
                        onClick={() => handleToggle(p.id)}
                      >
                        {p.available ? 'Hide' : 'Show'}
                      </button>
                      <button
                        className="adm-btn adm-btn--sm adm-btn--ghost"
                        onClick={() => { setEditId(p.id); setEditData({ ...p }); }}
                      >
                        Edit
                      </button>
                      <button
                        className="adm-btn adm-btn--sm adm-btn--danger"
                        onClick={() => setDeleteId(p.id)}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ─────────────────────────────────────── */}
        {tab === 'orders' && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span>All Orders</span>
              <button className="adm-refresh-btn" onClick={loadOrders}>↻ Refresh</button>
            </div>

            {oLoading ? (
              <div className="adm-loading">Loading orders…</div>
            ) : orders.length === 0 ? (
              <div className="adm-empty">No orders yet</div>
            ) : (
              <div className="adm-table">
                <div className="adm-row adm-row--head adm-row--orders">
                  <span>ID</span><span>Customer</span><span>Phone</span>
                  <span>Total</span><span>Items</span><span>Status</span>
                </div>
                {orders.map(o => (
                  <div key={o.id} className="adm-row adm-row--orders">
                    <div>
                      <p className="adm-cell-mono">#{o.id}</p>
                      <p className="adm-order-date">{new Date(o.created).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="adm-product-name">{o.customer}</p>
                      <p className="adm-product-desc">{o.address}</p>
                    </div>
                    <span className="adm-order-phone">{o.phone}</span>
                    <span className="adm-cell-price">{convertPrice(o.total)}</span>
                    <button
                      className="adm-items-btn"
                      onClick={() => setOrderModal(o)}
                    >
                      {o.items.length} item{o.items.length !== 1 ? 's' : ''} →
                    </button>
                    <select
                      className="adm-status-select"
                      value={o.status}
                      onChange={e => handleOrderStatus(o.id, e.target.value)}
                    >
                      {['Pending', 'Confirmed', 'Out for delivery', 'Delivered', 'Cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ── CATEGORIES TAB ─────────────────────────────────── */}
        {tab === 'categories' && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span>Categories</span>
              <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setShowCatForm(s => !s)}>
                {showCatForm ? '✕ Cancel' : '+ New Category'}
              </button>
            </div>

            {showCatForm && (
              <div className="adm-add-form">
                <div className="adm-edit-grid">
                  {([
                    ['Name *',        'name',        newCat.name],
                    ['Slug (auto)',    'slug',        newCat.slug],
                    ['Description *', 'description', newCat.description],
                  ] as [string, string, string][]).map(([label, key, val]) => (
                    <div key={key} className="adm-field">
                      <label className="adm-field-label">{label}</label>
                      <input
                        type="text"
                        className="adm-field-input"
                        placeholder={label.replace(' *', '')}
                        value={val}
                        onChange={e => setNewCat(c => ({ ...c, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="adm-field" style={{ marginTop: 12 }}>
                  <label className="adm-field-label">Category Image *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {newCat.image_url && (
                      <img src={newCat.image_url} alt="preview"
                        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                    )}
                    <input ref={catFileRef} type="file" accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }} onChange={handleCatImageUpload}
                    />
                    <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm"
                      onClick={() => catFileRef.current?.click()} disabled={catImgLoading}
                    >
                      {catImgLoading ? 'Uploading…' : newCat.image_url ? '↺ Change Image' : '📁 Pick Image'}
                    </button>
                    {newCat.image_url && (
                      <button type="button" className="adm-btn adm-btn--sm adm-btn--danger"
                        onClick={() => setNewCat(c => ({ ...c, image_url: '' }))}
                      >✕</button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
                  <button className="adm-btn adm-btn--primary" onClick={handleAddCategory} disabled={catAddLoading}>
                    {catAddLoading ? 'Saving…' : 'Save Category'}
                  </button>
                </div>
              </div>
            )}

            {cLoading ? (
              <div className="adm-loading">Loading categories…</div>
            ) : categories.length === 0 ? (
              <div className="adm-empty">No categories yet — create one above</div>
            ) : (
              <div className="adm-table">
                <div className="adm-row adm-row--head">
                  <span>ID</span><span>Image</span><span>Name</span><span>Slug</span><span>Description</span>
                </div>
                {categories.map(c => (
                  <div key={c.id} className="adm-row">
                    <span className="adm-cell-mono">#{c.id}</span>
                    <img src={c.image_url} alt={c.name}
                      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                    <span className="adm-product-name">{c.name}</span>
                    <span className="adm-cell-mono">{c.slug}</span>
                    <span className="adm-product-desc">{c.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}