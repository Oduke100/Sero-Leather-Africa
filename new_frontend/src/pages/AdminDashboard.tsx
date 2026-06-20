import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminProducts, deleteAdminProduct, toggleProduct,
  updateAdminProduct, getOrders, updateOrderStatus,
  type Order,
  getCategories, createCategory, type Category,
  getCurrencies, addCurrency, removeCurrency,
  getCategoryDetail, getAdminProductDetail, updateCategory, deleteCategory,
  type Currency, type CategoryDetail, type AdminProductDetail,
} from '../api/index';
import { useCurrency } from '../context/CurrencyContext';
type AdminProduct = Awaited<ReturnType<typeof getAdminProducts>>[number];

/* ── STYLES ── */
const S = {
  root: {
    minHeight: '100vh',
    background: '#1A0F08',
    fontFamily: "'Jost', sans-serif",
    color: '#F5EDD8',
  } as React.CSSProperties,
  nav: {
    background: 'rgba(10,5,2,0.85)',
    borderBottom: '1px solid rgba(212,168,71,0.15)',
    position: 'sticky', top: 0, zIndex: 100, isolation: 'isolate',
    backdropFilter: 'blur(24px)',
  } as React.CSSProperties,
  navInner: {
    maxWidth: 1400, margin: '0 auto',
    padding: '0 40px', height: 68,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  } as React.CSSProperties,
  body: {
    maxWidth: 1400, margin: '0 auto', padding: '48px 40px', position: 'relative', zIndex: 1,
  } as React.CSSProperties,
  card: {
    background: 'rgba(20,10,4,0.75)',
    border: '1px solid rgba(212,168,71,0.12)',
    backdropFilter: 'blur(16px)',
    overflow: 'hidden',
  } as React.CSSProperties,
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(10,5,2,0.85)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  } as React.CSSProperties,
  modal: {
    background: '#221408',
    border: '1px solid rgba(212,168,71,0.2)',
    padding: '40px',
    width: '100%', maxWidth: 460,
    position: 'relative',
  } as React.CSSProperties,
};
const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
  background: 'rgba(44,30,22,0.8)',
  border: '1px solid rgba(212,168,71,0.15)',
  borderBottom: '1px solid rgba(212,168,71,0.35)',
  color: '#F5EDD8',
  fontFamily: "'Jost', sans-serif",
  fontSize: 13,
  outline: 'none',
  width: '100%',
};
const KENTE = 'repeating-linear-gradient(90deg,#C15C3D 0,#C15C3D 20px,#D4A847 20px,#D4A847 40px,#2C1E16 40px,#2C1E16 60px,#485c4f 60px,#485c4f 80px,#D4A847 80px,#D4A847 100px,#C15C3D 100px,#C15C3D 120px,#8B5E3C 120px,#8B5E3C 140px)';
const KENTE_THIN = 'repeating-linear-gradient(90deg,#C15C3D 0,#C15C3D 20px,#D4A847 20px,#D4A847 40px,#2C1E16 40px,#2C1E16 60px,#485c4f 60px,#485c4f 80px)';

/* ── SUB-COMPONENTS ── */
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      padding: '14px 22px', fontSize: '13px', fontWeight: 500,
      fontFamily: "'Jost', sans-serif", letterSpacing: '0.03em',
      borderLeft: `3px solid ${type === 'ok' ? '#D4A847' : '#f87171'}`,
      background: type === 'ok' ? 'rgba(212,168,71,0.1)' : 'rgba(248,113,113,0.1)',
      color: type === 'ok' ? '#D4A847' : '#f87171',
      backdropFilter: 'blur(20px)',
      animation: 'toastIn .3s ease',
    }}>{msg}</div>
  );
}
function Btn({ children, onClick, variant = 'primary', sm, disabled, style }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'warn' | 'success';
  sm?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const colors = {
    primary: { bg: 'linear-gradient(135deg,#D4A847,#C68E5A)', color: '#1A0F08', border: 'none' },
    ghost:   { bg: 'transparent', color: 'rgba(245,237,216,0.5)', border: '1px solid rgba(212,168,71,0.2)' },
    danger:  { bg: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' },
    warn:    { bg: 'rgba(251,191,36,0.08)',  color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)'  },
    success: { bg: 'rgba(52,211,153,0.08)',  color: '#34d399', border: '1px solid rgba(52,211,153,0.2)'  },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: sm ? '6px 14px' : '11px 22px',
      fontSize: sm ? '9px' : '10px',
      fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
      fontFamily: "'Jost', sans-serif",
      background: colors.bg, color: colors.color, border: colors.border,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all .2s',
      ...style,
    }}>{children}</button>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '9px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.4)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

/* ── MAIN ── */
export default function AdminDashboard() {
  const navigate         = useNavigate();
  const { convertPrice } = useCurrency();

  /* ── STATE: tabs ── */
  const [tab, setTab] = useState<'inventory' | 'orders' | 'categories' | 'currencies'>('inventory');

  /* ── STATE: products ── */
  const [products,          setProducts]          = useState<AdminProduct[]>([]);
  const [pLoading,          setPLoading]          = useState(true);
  const [deleteId,          setDeleteId]          = useState<number | null>(null);
  const [editId,            setEditId]            = useState<number | null>(null);
  const [editData,          setEditData]          = useState<Partial<AdminProduct>>({});
  const [showAddForm,       setShowAddForm]       = useState(false);
  const [newProduct,        setNewProduct]        = useState({
    name: '', slug: '', description: '', image_url: '',
    price: '', stock: '', category_id: '',
    is_active: true, is_customisable: false,
    is_on_discount: false, discount_percentage: 0,
  });
  const [addLoading,        setAddLoading]        = useState(false);
  const [uploadLoading,     setUploadLoading]     = useState(false);
  const [editUploadLoading, setEditUploadLoading] = useState(false);
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  /* ── STATE: orders ── */
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [oLoading,    setOLoading]    = useState(false);
  const [orderModal,  setOrderModal]  = useState<Order | null>(null);

  /* ── STATE: categories ── */
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [cLoading,      setCLoading]      = useState(false);
  const [showCatForm,   setShowCatForm]   = useState(false);
  const [newCat,        setNewCat]        = useState({ name: '', slug: '', description: '', image_url: '' });
  const [catAddLoading, setCatAddLoading] = useState(false);
  const [catImgLoading, setCatImgLoading] = useState(false);
  const [editCat,       setEditCat]       = useState<Category | null>(null);
  const [editCatData,   setEditCatData]   = useState<Partial<Category>>({});
  const [editCatLoad,   setEditCatLoad]   = useState(false);
  const [deleteCatId,   setDeleteCatId]   = useState<number | null>(null);
  const [deleteCatName, setDeleteCatName] = useState('');
  const [catImgEditLoad,setCatImgEditLoad]= useState(false);
  const catFileRef     = useRef<HTMLInputElement>(null);
  const catEditFileRef = useRef<HTMLInputElement>(null);

  /* ── STATE: currencies ── */
  const [currencies,     setCurrencies]     = useState<Currency[]>([]);
  const [currLoading,    setCurrLoading]    = useState(false);
  const [showCurrForm,   setShowCurrForm]   = useState(false);
  const [newCurrCode,    setNewCurrCode]    = useState('');
  const [newCurrName,    setNewCurrName]    = useState('');
  const [currAddLoading, setCurrAddLoading] = useState(false);
  const [removingCode,   setRemovingCode]   = useState<string | null>(null);

  /* ── STATE: detail panels ── */
  const [catPanel,      setCatPanel]      = useState<CategoryDetail | null>(null);
  const [catPanelLoad,  setCatPanelLoad]  = useState(false);
  const [prodPanel,     setProdPanel]     = useState<AdminProductDetail | null>(null);
  const [prodPanelLoad, setProdPanelLoad] = useState(false);

  /* ── STATE: toast ── */
  const [toast, setToast] = useState({ msg: '', type: 'ok' as 'ok' | 'err' });

  /* ── HELPERS ── */
  function notify(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 3200);
  }
  function logout() {
    sessionStorage.removeItem('sero_admin_token');
    navigate('/sero-internal/login', { replace: true });
  }
  function slugify(n: string) { return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

  /* ── LOADERS ── */
  const loadProducts   = useCallback(async () => { setPLoading(true);    try { setProducts(await getAdminProducts());   } catch { notify('Could not load products',   'err'); } finally { setPLoading(false);    } }, []);
  const loadOrders     = useCallback(async () => { setOLoading(true);    try { setOrders(await getOrders());             } catch { notify('Could not load orders',     'err'); } finally { setOLoading(false);    } }, []);
  const loadCategories = useCallback(async () => { setCLoading(true);    try { setCategories(await getCategories());     } catch { notify('Could not load categories', 'err'); } finally { setCLoading(false);    } }, []);
  const loadCurrencies = useCallback(async () => { setCurrLoading(true); try { setCurrencies(await getCurrencies());     } catch { notify('Could not load currencies', 'err'); } finally { setCurrLoading(false); } }, []);

  useEffect(() => {
    if (!sessionStorage.getItem('sero_admin_token')) navigate('/sero-internal/login', { replace: true });
  }, []);
  useEffect(() => { loadProducts(); loadCategories(); }, []);
  useEffect(() => { if (tab === 'orders')     loadOrders();     }, [tab]);
  useEffect(() => { if (tab === 'categories') loadCategories(); }, [tab]);
  useEffect(() => { if (tab === 'currencies') loadCurrencies(); }, [tab]);

  /* ── HANDLERS: products ── */
  async function handleToggle(id: number) {
    try { await toggleProduct(id); notify('Visibility updated'); loadProducts(); }
    catch { notify('Toggle failed', 'err'); }
  }
  async function handleDelete() {
    if (!deleteId) return;
    try { await deleteAdminProduct(deleteId); notify('Product deleted'); setDeleteId(null); loadProducts(); }
    catch { notify('Delete failed', 'err'); }
  }
  async function handleEdit() {
    if (!editId) return;
    try { await updateAdminProduct(editId, editData); notify('Product updated'); setEditId(null); setEditData({}); loadProducts(); }
    catch { notify('Update failed', 'err'); }
  }
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return notify('Only JPEG, PNG or WebP allowed', 'err');
    mode === 'add' ? setUploadLoading(true) : setEditUploadLoading(true);
    try {
      const form = new FormData(); form.append('file', file);
      const res  = await fetch('https://sero-leather-africa-2-production.up.railway.app/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${sessionStorage.getItem('sero_admin_token')}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      mode === 'add' ? setNewProduct(p => ({ ...p, image_url: data.url })) : setEditData(d => ({ ...d, image: data.url }));
      notify('Image uploaded ✓');
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Upload failed', 'err'); }
    finally { mode === 'add' ? setUploadLoading(false) : setEditUploadLoading(false); e.target.value = ''; }
  }
  async function handleAddProduct() {
    if (!newProduct.name.trim()) return notify('Name is required',     'err');
    if (!newProduct.price)       return notify('Price is required',    'err');
    if (!newProduct.stock)       return notify('Stock is required',    'err');
    if (!newProduct.category_id) return notify('Category is required', 'err');
    setAddLoading(true);
    try {
      const { createProduct } = await import('../api');
      await createProduct({
        name: newProduct.name.trim(), slug: newProduct.slug || slugify(newProduct.name),
        description: newProduct.description, image_url: newProduct.image_url,
        price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock),
        is_active: newProduct.is_active, is_customisable: newProduct.is_customisable,
        is_on_discount: newProduct.is_on_discount, discount_percentage: newProduct.discount_percentage,
        category_id: parseInt(newProduct.category_id),
      });
      notify('Product added!'); setShowAddForm(false);
      setNewProduct({ name:'',slug:'',description:'',image_url:'',price:'',stock:'',category_id:'',is_active:true,is_customisable:false,is_on_discount:false,discount_percentage:0 });
      loadProducts();
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Create failed', 'err'); }
    finally { setAddLoading(false); }
  }
  async function openProductPanel(id: number) {
    setProdPanelLoad(true); setProdPanel(null);
    try { setProdPanel(await getAdminProductDetail(id)); }
    catch { notify('Could not load product detail', 'err'); }
    finally { setProdPanelLoad(false); }
  }

  /* ── HANDLERS: categories ── */
  async function handleCatImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setCatImgLoading(true);
    try {
      const form = new FormData(); form.append('file', file);
      const res  = await fetch('https://sero-leather-africa-2-production.up.railway.app/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${sessionStorage.getItem('sero_admin_token')}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setNewCat(c => ({ ...c, image_url: data.url })); notify('Image uploaded ✓');
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Upload failed', 'err'); }
    finally { setCatImgLoading(false); e.target.value = ''; }
  }
  async function handleCatEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setCatImgEditLoad(true);
    try {
      const form = new FormData(); form.append('file', file);
      const res  = await fetch('https://sero-leather-africa-2-production.up.railway.app/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${sessionStorage.getItem('sero_admin_token')}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setEditCatData(d => ({ ...d, image_url: data.url })); notify('Image uploaded ✓');
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Upload failed', 'err'); }
    finally { setCatImgEditLoad(false); e.target.value = ''; }
  }
  async function handleAddCategory() {
    if (!newCat.name.trim())        return notify('Name is required',        'err');
    if (!newCat.description.trim()) return notify('Description is required', 'err');
    if (!newCat.image_url)          return notify('Image is required',       'err');
    setCatAddLoading(true);
    try {
      await createCategory({ name: newCat.name.trim(), slug: newCat.slug || slugify(newCat.name), description: newCat.description.trim(), image_url: newCat.image_url });
      notify('Category created!'); setShowCatForm(false);
      setNewCat({ name:'',slug:'',description:'',image_url:'' }); loadCategories();
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Create failed', 'err'); }
    finally { setCatAddLoading(false); }
  }
  async function handleEditCategory() {
    if (!editCat) return;
    setEditCatLoad(true);
    try {
      await updateCategory(editCat.id, editCatData);
      notify('Category updated'); setEditCat(null); setEditCatData({}); loadCategories();
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Update failed', 'err'); }
    finally { setEditCatLoad(false); }
  }
  async function handleDeleteCategory() {
    if (!deleteCatId) return;
    try {
      await deleteCategory(deleteCatId);
      notify('Category deleted'); setDeleteCatId(null); setDeleteCatName(''); loadCategories();
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Delete failed', 'err'); }
  }
  async function openCategoryPanel(id: number) {
    setCatPanelLoad(true); setCatPanel(null);
    try { setCatPanel(await getCategoryDetail(id)); }
    catch { notify('Could not load category detail', 'err'); }
    finally { setCatPanelLoad(false); }
  }

  /* ── HANDLERS: currencies ── */
  async function handleAddCurrency() {
    if (!newCurrCode.trim()) return notify('Currency code is required', 'err');
    if (!newCurrName.trim()) return notify('Currency name is required', 'err');
    setCurrAddLoading(true);
    try {
      await addCurrency(newCurrCode.trim().toUpperCase(), newCurrName.trim());
      notify(`${newCurrCode.toUpperCase()} added — rates refresh on next server cycle`);
      setNewCurrCode(''); setNewCurrName(''); setShowCurrForm(false); loadCurrencies();
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Failed', 'err'); }
    finally { setCurrAddLoading(false); }
  }
  async function handleRemoveCurrency(code: string) {
    setRemovingCode(code);
    try { await removeCurrency(code); notify(`${code} removed`); loadCurrencies(); }
    catch (e: unknown) { notify(e instanceof Error ? e.message : 'Failed', 'err'); }
    finally { setRemovingCode(null); }
  }

  /* ── HANDLERS: orders ── */
  async function handleOrderStatus(id: number, status: string) {
    try { await updateOrderStatus(id, status); notify(`Order #${id} → ${status}`); loadOrders(); }
    catch { notify('Status update failed', 'err'); }
  }

  /* ── DERIVED ── */
  const pending = orders.filter(o => o.status === 'Pending').length;
  const statCards = [
    { label: 'Total Products', value: products.length,                          color: '#F5EDD8' },
    { label: 'Live in Store',  value: products.filter(p => p.available).length, color: '#34d399' },
    { label: 'Total Orders',   value: orders.length,                            color: '#D4A847' },
    { label: 'Pending',        value: pending,                                  color: '#fbbf24' },
  ];

  return (
    <div style={S.root}>
      <Toast msg={toast.msg} type={toast.type} />
      <div style={{ height: 4, background: KENTE, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }} />

      {/* ── NAV ── */}
      <nav style={{ ...S.nav, paddingTop: 4 }}>
        <div style={S.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/logo1.webp" alt="Sero" style={{ height: 32, opacity: .9 }} onError={e => (e.currentTarget.style.display = 'none')} />
            <div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, color: '#D4A847', letterSpacing: '.1em' }}>Sero Leather Africa</p>
              <p style={{ fontSize: 8, letterSpacing: '.4em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.3)' }}>Studio Dashboard</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '.15em', color: '#34d399' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live
            </div>
            <a href="/" style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.35)', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#D4A847')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,216,0.35)')}>
              View Store
            </a>
            <button onClick={() => navigate('/sero-internal/change-password')} style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.35)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#D4A847')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,216,0.35)')}>
              Change Password
            </button>
            <button onClick={logout} style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.35)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,216,0.35)')}>
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO BAND ── */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/landing_page.webp)', backgroundSize: 'cover', backgroundPosition: 'center 30%', filter: 'brightness(0.45) sepia(0.2)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,5,2,0.3) 0%, rgba(26,15,8,1) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 40px 32px', maxWidth: 1400, margin: '0 auto' }}>
          <p style={{ fontSize: 9, letterSpacing: '.5em', textTransform: 'uppercase', color: '#D4A847', marginBottom: 8 }}>Welcome back</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, color: '#F5EDD8', lineHeight: 1 }}>
            Your <em style={{ color: '#D4A847', fontStyle: 'italic' }}>Studio</em>
          </h1>
        </div>
      </div>

      <div style={S.body}>

        {/* ── STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 40 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: 'rgba(44,30,22,0.6)', border: '1px solid rgba(212,168,71,0.1)', padding: '28px 24px', position: 'relative', overflow: 'hidden', transition: 'border-color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,168,71,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(212,168,71,0.1)')}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${s.color},transparent)`, opacity: .4 }} />
              <p style={{ fontSize: 8, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.35)', marginBottom: 12, fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2.8rem', fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(212,168,71,0.1)', marginBottom: 24 }}>
          {(['inventory', 'orders', 'categories', 'currencies'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '14px 32px', fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase',
              fontFamily: "'Jost',sans-serif", border: 'none', background: 'none',
              color: tab === t ? '#D4A847' : 'rgba(245,237,216,0.3)',
              borderBottom: tab === t ? '2px solid #D4A847' : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer', transition: 'all .2s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {t === 'orders' ? `Orders${pending > 0 ? ` (${pending})` : ''}` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── INVENTORY TAB ── */}
        {tab === 'inventory' && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid rgba(212,168,71,0.08)' }}>
              <p style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.5)', fontWeight: 600 }}>Inventory</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="ghost" sm onClick={loadProducts}>↻ Refresh</Btn>
                <Btn sm onClick={() => setShowAddForm(s => !s)}>{showAddForm ? '✕ Cancel' : '+ Add Product'}</Btn>
              </div>
            </div>
            {showAddForm && (
              <div style={{ padding: 28, background: 'rgba(44,30,22,0.4)', borderBottom: '1px solid rgba(212,168,71,0.08)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {([['Product Name *','name','text',newProduct.name],['Slug (auto)','slug','text',newProduct.slug],['Price (KES) *','price','number',newProduct.price],['Stock *','stock','number',newProduct.stock],['Description','description','text',newProduct.description]] as [string,string,string,string][]).map(([label,key,type,val]) => (
                    <Field key={key} label={label}>
                      <input type={type} value={val} placeholder={label.replace(' *', '')} style={inputStyle}
                        onChange={e => setNewProduct(p => ({ ...p, [key]: e.target.value }))} />
                    </Field>
                  ))}
                  <Field label="Category *">
                    <select value={newProduct.category_id} style={inputStyle}
                      onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))}>
                      <option value="">— select —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  {newProduct.image_url && <img src={newProduct.image_url} style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid rgba(212,168,71,0.2)' }} />}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => handleImageUpload(e, 'add')} />
                  <Btn variant="ghost" sm onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}>
                    {uploadLoading ? 'Uploading…' : newProduct.image_url ? '↺ Change Image' : '📁 Pick Image'}
                  </Btn>
                  {newProduct.image_url && <Btn variant="danger" sm onClick={() => setNewProduct(p => ({ ...p, image_url: '' }))}>✕</Btn>}
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
                  {([['is_active','Active'],['is_customisable','Customisable'],['is_on_discount','On Discount']] as [keyof typeof newProduct,string][]).map(([key,label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(245,237,216,0.5)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={newProduct[key] as boolean} style={{ accentColor: '#D4A847' }}
                        onChange={e => setNewProduct(p => ({ ...p, [key]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Btn onClick={handleAddProduct} disabled={addLoading}>{addLoading ? 'Saving…' : 'Save Product'}</Btn>
                </div>
              </div>
            )}
            {pLoading ? (
              <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,237,216,0.3)', fontSize: 12, letterSpacing: '.2em' }}>Loading inventory…</div>
            ) : products.length === 0 ? (
              <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,237,216,0.2)', fontSize: 12, letterSpacing: '.2em' }}>No products yet</div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 130px 70px 100px 180px', gap: 16, padding: '14px 28px', borderBottom: '1px solid rgba(212,168,71,0.08)', background: 'rgba(44,30,22,0.3)' }}>
                  {['ID','Product','Price','Stock','Status','Actions'].map(h => (
                    <span key={h} style={{ fontSize: 8, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.25)', fontWeight: 600 }}>{h}</span>
                  ))}
                </div>
                {products.map(p => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 130px 70px 100px 180px', gap: 16, padding: '16px 28px', borderBottom: '1px solid rgba(212,168,71,0.05)', alignItems: 'center', transition: 'background .15s', cursor: 'pointer' }}
                    onClick={() => openProductPanel(p.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,71,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontSize: 11, color: 'rgba(245,237,216,0.3)', fontFamily: 'monospace' }}>#{p.id}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      {p.image && <img src={p.image} style={{ width: 38, height: 38, objectFit: 'cover', border: '1px solid rgba(212,168,71,0.1)', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#F5EDD8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                        <p style={{ fontSize: 10, color: 'rgba(245,237,216,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description || '—'}</p>
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', color: '#D4A847' }}>{convertPrice(p.price)}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#F5EDD8' }}>{p.qty}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '4px 10px', letterSpacing: '.15em', textTransform: 'uppercase', background: p.available ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: p.available ? '#34d399' : '#f87171' }}>
                      {p.available ? 'Live' : 'Hidden'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant={p.available ? 'warn' : 'success'} sm onClick={() => handleToggle(p.id)}>{p.available ? 'Hide' : 'Show'}</Btn>
                      <Btn variant="ghost" sm onClick={() => { setEditId(p.id); setEditData({ ...p }); }}>Edit</Btn>
                      <Btn variant="danger" sm onClick={() => setDeleteId(p.id)}>Del</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid rgba(212,168,71,0.08)' }}>
              <p style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.5)', fontWeight: 600 }}>All Orders</p>
              <Btn variant="ghost" sm onClick={loadOrders}>↻ Refresh</Btn>
            </div>
            {oLoading ? (
              <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,237,216,0.3)', fontSize: 12, letterSpacing: '.2em' }}>Loading orders…</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,237,216,0.2)', fontSize: 12, letterSpacing: '.2em' }}>No orders yet</div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 130px 120px 100px 180px', gap: 16, padding: '14px 28px', borderBottom: '1px solid rgba(212,168,71,0.08)', background: 'rgba(44,30,22,0.3)' }}>
                  {['ID','Customer','Phone','Total','Items','Status'].map(h => (
                    <span key={h} style={{ fontSize: 8, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.25)', fontWeight: 600 }}>{h}</span>
                  ))}
                </div>
                {orders.map(o => (
                  <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 130px 120px 100px 180px', gap: 16, padding: '16px 28px', borderBottom: '1px solid rgba(212,168,71,0.05)', alignItems: 'center', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,71,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div>
                      <p style={{ fontSize: 11, color: 'rgba(245,237,216,0.4)', fontFamily: 'monospace' }}>#{o.id}</p>
                      <p style={{ fontSize: 9, color: 'rgba(245,237,216,0.2)', marginTop: 3, letterSpacing: '.05em' }}>{new Date(o.created).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#F5EDD8' }}>{o.customer}</p>
                      <p style={{ fontSize: 10, color: 'rgba(245,237,216,0.3)' }}>{o.address}</p>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(245,237,216,0.4)', fontFamily: 'monospace' }}>{o.phone}</span>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', color: '#D4A847' }}>{convertPrice(o.total)}</span>
                    <button onClick={() => setOrderModal(o)} style={{ fontSize: 10, color: '#D4A847', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontWeight: 600, padding: 0, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                      {o.items.length} item{o.items.length !== 1 ? 's' : ''} →
                    </button>
                    <select value={o.status} onChange={e => handleOrderStatus(o.id, e.target.value)} style={{ ...inputStyle, fontSize: 10, padding: '8px 12px', cursor: 'pointer' }}>
                      {['Pending','Confirmed','Out for delivery','Delivered','Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CATEGORIES TAB ── */}
        {tab === 'categories' && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid rgba(212,168,71,0.08)' }}>
              <p style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.5)', fontWeight: 600 }}>Categories</p>
              <Btn sm onClick={() => setShowCatForm(s => !s)}>{showCatForm ? '✕ Cancel' : '+ New Category'}</Btn>
            </div>
            {showCatForm && (
              <div style={{ padding: 28, background: 'rgba(44,30,22,0.4)', borderBottom: '1px solid rgba(212,168,71,0.08)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {([['Name *','name',newCat.name],['Slug (auto)','slug',newCat.slug],['Description *','description',newCat.description]] as [string,string,string][]).map(([label,key,val]) => (
                    <Field key={key} label={label}>
                      <input type="text" value={val} placeholder={label.replace(' *', '')} style={inputStyle}
                        onChange={e => setNewCat(c => ({ ...c, [key]: e.target.value }))} />
                    </Field>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  {newCat.image_url && <img src={newCat.image_url} style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid rgba(212,168,71,0.2)' }} />}
                  <input ref={catFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleCatImageUpload} />
                  <Btn variant="ghost" sm onClick={() => catFileRef.current?.click()} disabled={catImgLoading}>
                    {catImgLoading ? 'Uploading…' : newCat.image_url ? '↺ Change Image' : '📁 Pick Image'}
                  </Btn>
                  {newCat.image_url && <Btn variant="danger" sm onClick={() => setNewCat(c => ({ ...c, image_url: '' }))}>✕</Btn>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Btn onClick={handleAddCategory} disabled={catAddLoading}>{catAddLoading ? 'Saving…' : 'Save Category'}</Btn>
                </div>
              </div>
            )}
            {cLoading ? (
              <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,237,216,0.3)', fontSize: 12, letterSpacing: '.2em' }}>Loading…</div>
            ) : categories.length === 0 ? (
              <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,237,216,0.2)', fontSize: 12, letterSpacing: '.2em' }}>No categories yet</div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '60px 64px 1fr 1fr 1fr 140px', gap: 16, padding: '14px 28px', borderBottom: '1px solid rgba(212,168,71,0.08)', background: 'rgba(44,30,22,0.3)' }}>
                  {['ID','','Name','Slug','Description',''].map((h, i) => (
                    <span key={i} style={{ fontSize: 8, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.25)', fontWeight: 600 }}>{h}</span>
                  ))}
                </div>
                {categories.map(c => (
                  <div key={c.id} onClick={() => openCategoryPanel(c.id)} style={{ display: 'grid', gridTemplateColumns: '60px 64px 1fr 1fr 1fr 140px', gap: 16, padding: '16px 28px', borderBottom: '1px solid rgba(212,168,71,0.05)', alignItems: 'center', transition: 'background .15s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,71,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontSize: 11, color: 'rgba(245,237,216,0.3)', fontFamily: 'monospace' }}>#{c.id}</span>
                    <img src={c.image_url} style={{ width: 48, height: 48, objectFit: 'cover', border: '1px solid rgba(212,168,71,0.1)' }} onError={e => (e.currentTarget.style.display = 'none')} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#F5EDD8' }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(245,237,216,0.3)', fontFamily: 'monospace' }}>{c.slug}</span>
                    <span style={{ fontSize: 12, color: 'rgba(245,237,216,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</span>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <Btn variant="ghost" sm onClick={() => { setEditCat(c); setEditCatData({ name: c.name, slug: c.slug, description: c.description, image_url: c.image_url }); }}>Edit</Btn>
                      <Btn variant="danger" sm onClick={() => { setDeleteCatId(c.id); setDeleteCatName(c.name); }}>Del</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CURRENCIES TAB ── */}
        {tab === 'currencies' && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid rgba(212,168,71,0.08)' }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.5)', fontWeight: 600 }}>Active Currencies</p>
                <p style={{ fontSize: 10, color: 'rgba(245,237,216,0.2)', marginTop: 4 }}>Rates auto-refresh every 24 hrs from live market data</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="ghost" sm onClick={loadCurrencies}>↻ Refresh</Btn>
                <Btn sm onClick={() => setShowCurrForm(s => !s)}>{showCurrForm ? '✕ Cancel' : '+ Add Currency'}</Btn>
              </div>
            </div>
            {showCurrForm && (
              <div style={{ padding: 28, background: 'rgba(44,30,22,0.4)', borderBottom: '1px solid rgba(212,168,71,0.08)' }}>
                <p style={{ fontSize: 9, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.25)', marginBottom: 20 }}>
                  Add a currency code — the live exchange rate populates automatically
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 20 }}>
                  <Field label="Currency Code *">
                    <input type="text" maxLength={4} value={newCurrCode} placeholder="e.g. EUR"
                      style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '.15em' }}
                      onChange={e => setNewCurrCode(e.target.value.toUpperCase())} />
                  </Field>
                  <Field label="Currency Name *">
                    <input type="text" value={newCurrName} placeholder="e.g. Euro" style={inputStyle}
                      onChange={e => setNewCurrName(e.target.value)} />
                  </Field>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 10, color: 'rgba(245,237,216,0.2)', maxWidth: 360, lineHeight: 1.6 }}>
                    Use standard ISO 4217 codes: USD, EUR, GBP, AED, CAD… The rate will be 1.0 until the next server refresh cycle (up to 24 hrs).
                  </p>
                  <Btn onClick={handleAddCurrency} disabled={currAddLoading}>{currAddLoading ? 'Adding…' : 'Add Currency'}</Btn>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 160px 120px', gap: 16, padding: '14px 28px', borderBottom: '1px solid rgba(212,168,71,0.08)', background: 'rgba(44,30,22,0.3)' }}>
              {['Code','Name','Rate (to KES)','Last Updated',''].map((h, i) => (
                <span key={i} style={{ fontSize: 8, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.25)', fontWeight: 600 }}>{h}</span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 160px 120px', gap: 16, padding: '16px 28px', borderBottom: '1px solid rgba(212,168,71,0.05)', alignItems: 'center', background: 'rgba(212,168,71,0.02)' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#D4A847', letterSpacing: '.1em' }}>KES</span>
              <span style={{ fontSize: 13, color: '#F5EDD8' }}>Kenyan Shilling</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'rgba(245,237,216,0.4)' }}>1.000000</span>
              <span style={{ fontSize: 10, color: 'rgba(245,237,216,0.2)' }}>Base currency</span>
              <span style={{ fontSize: 9, padding: '4px 10px', letterSpacing: '.15em', textTransform: 'uppercase', background: 'rgba(52,211,153,0.1)', color: '#34d399', display: 'inline-block' }}>Base</span>
            </div>
            {currLoading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'rgba(245,237,216,0.3)', fontSize: 12, letterSpacing: '.2em' }}>Loading…</div>
            ) : currencies.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'rgba(245,237,216,0.2)', fontSize: 12, letterSpacing: '.2em' }}>No currencies added yet — add one above</div>
            ) : currencies.map(c => (
              <div key={c.code} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 160px 120px', gap: 16, padding: '16px 28px', borderBottom: '1px solid rgba(212,168,71,0.05)', alignItems: 'center', transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,71,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#D4A847', letterSpacing: '.1em' }}>{c.code}</span>
                <span style={{ fontSize: 13, color: '#F5EDD8' }}>{c.name}</span>
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'rgba(245,237,216,0.7)' }}>{Number(c.rate_to_kes).toFixed(6)}</span>
                  <span style={{ fontSize: 9, color: 'rgba(245,237,216,0.2)', marginLeft: 8 }}>per KES</span>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(245,237,216,0.25)' }}>
                  {c.last_updated ? new Date(c.last_updated).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending refresh'}
                </span>
                <Btn variant="danger" sm disabled={removingCode === c.code} onClick={() => handleRemoveCurrency(c.code)}>
                  {removingCode === c.code ? '…' : 'Remove'}
                </Btn>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── MODAL: EDIT CATEGORY ── */}
      {editCat && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: 520 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,#D4A847,transparent)' }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 300, color: '#F5EDD8', marginBottom: 24 }}>Edit Category</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label="Name">
                <input type="text" value={editCatData.name ?? ''} style={inputStyle}
                  onChange={e => setEditCatData(d => ({ ...d, name: e.target.value }))} />
              </Field>
              <Field label="Slug">
                <input type="text" value={editCatData.slug ?? ''} style={inputStyle}
                  onChange={e => setEditCatData(d => ({ ...d, slug: e.target.value }))} />
              </Field>
              <Field label="Description">
                <input type="text" value={editCatData.description ?? ''} style={inputStyle}
                  onChange={e => setEditCatData(d => ({ ...d, description: e.target.value }))} />
              </Field>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              {editCatData.image_url && <img src={editCatData.image_url} style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid rgba(212,168,71,0.2)' }} />}
              <input ref={catEditFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleCatEditImageUpload} />
              <Btn variant="ghost" sm onClick={() => catEditFileRef.current?.click()} disabled={catImgEditLoad}>
                {catImgEditLoad ? 'Uploading…' : editCatData.image_url ? '↺ Change Image' : '📁 Pick Image'}
              </Btn>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => { setEditCat(null); setEditCatData({}); }}>Cancel</Btn>
              <Btn onClick={handleEditCategory} disabled={editCatLoad}>{editCatLoad ? 'Saving…' : 'Save Changes'}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CATEGORY ── */}
      {deleteCatId !== null && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,#f87171,transparent)' }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 300, color: '#F5EDD8', marginBottom: 8 }}>Remove Category?</h3>
            <p style={{ fontSize: 12, color: 'rgba(245,237,216,0.4)', marginBottom: 28, lineHeight: 1.6 }}>
              This permanently removes <strong style={{ color: '#F5EDD8' }}>{deleteCatName}</strong> from your store.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => { setDeleteCatId(null); setDeleteCatName(''); }}>Cancel</Btn>
              <Btn variant="danger" onClick={handleDeleteCategory}>Remove</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE PRODUCT ── */}
      {deleteId !== null && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,#D4A847,transparent)' }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 300, color: '#F5EDD8', marginBottom: 8 }}>Remove Product?</h3>
            <p style={{ fontSize: 12, color: 'rgba(245,237,216,0.4)', marginBottom: 28, lineHeight: 1.6 }}>This permanently removes the product from your store.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Btn>
              <Btn variant="danger" onClick={handleDelete}>Remove</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT PRODUCT ── */}
      {editId !== null && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: 560 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,#D4A847,transparent)' }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 300, color: '#F5EDD8', marginBottom: 24 }}>Edit Product</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {([['Name','name','text',editData.name??''],['Description','description','text',editData.description??''],['Price (KES)','price','number',editData.price??''],['Stock','qty','number',editData.qty??'']] as [string,string,string,string|number][]).map(([label,key,type,val]) => (
                <Field key={key as string} label={label}>
                  <input type={type} value={val as string} style={inputStyle}
                    onChange={e => setEditData(d => ({ ...d, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value }))} />
                </Field>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              {editData.image && <img src={editData.image} style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid rgba(212,168,71,0.2)' }} />}
              <input ref={editFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => handleImageUpload(e, 'edit')} />
              <Btn variant="ghost" sm onClick={() => editFileInputRef.current?.click()} disabled={editUploadLoading}>
                {editUploadLoading ? 'Uploading…' : editData.image ? '↺ Change Image' : '📁 Pick Image'}
              </Btn>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(245,237,216,0.5)', cursor: 'pointer', marginBottom: 24 }}>
              <input type="checkbox" checked={editData.available ?? false} style={{ accentColor: '#D4A847' }}
                onChange={e => setEditData(d => ({ ...d, available: e.target.checked }))} />
              Available in store
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => { setEditId(null); setEditData({}); }}>Cancel</Btn>
              <Btn onClick={handleEdit}>Save Changes</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ORDER ITEMS ── */}
      {orderModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: 520 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,#D4A847,transparent)' }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 300, color: '#F5EDD8', marginBottom: 20 }}>Order #{orderModal.id}</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {orderModal.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(212,168,71,0.08)' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#F5EDD8' }}>{item.name}</p>
                    <p style={{ fontSize: 10, color: 'rgba(245,237,216,0.3)', marginTop: 3 }}>Qty: {item.quantity}</p>
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', color: '#D4A847' }}>{convertPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', borderTop: '1px solid rgba(212,168,71,0.1)', marginTop: 4 }}>
              <span style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.4)' }}>Total</span>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.4rem', color: '#D4A847' }}>{convertPrice(orderModal.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <Btn variant="ghost" onClick={() => setOrderModal(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── PANEL: PRODUCT DETAIL ── */}
      {(prodPanel || prodPanelLoad) && (
        <div onClick={() => setProdPanel(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,5,2,0.5)', backdropFilter: 'blur(2px)' }} />
      )}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201, width: prodPanel || prodPanelLoad ? 420 : 0, minWidth: prodPanel || prodPanelLoad ? 420 : 0, background: '#1A0F08', borderLeft: '1px solid rgba(212,168,71,0.15)', overflow: 'hidden', transition: 'width .35s cubic-bezier(.4,0,.2,1), min-width .35s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 3, flexShrink: 0, background: KENTE_THIN }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(212,168,71,0.08)', flexShrink: 0 }}>
          <p style={{ fontSize: 9, letterSpacing: '.4em', textTransform: 'uppercase', color: '#D4A847', fontWeight: 600 }}>Product Detail</p>
          <button onClick={() => setProdPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,237,216,0.3)', fontSize: 18, lineHeight: 1, padding: 0, transition: 'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5EDD8')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,216,0.3)')}>✕</button>
        </div>
        {prodPanelLoad && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,237,216,0.2)', fontSize: 11, letterSpacing: '.2em' }}>Loading…</div>
        )}
        {prodPanel && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 40px' }}>
            {prodPanel.image_url && (
              <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                <img src={prodPanel.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55) sepia(0.2)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #1A0F08 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 300, color: '#F5EDD8', lineHeight: 1.2, marginBottom: 6 }}>{prodPanel.name}</h2>
                  <span style={{ fontSize: 9, padding: '3px 10px', letterSpacing: '.15em', textTransform: 'uppercase', background: prodPanel.is_active ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)', color: prodPanel.is_active ? '#34d399' : '#f87171' }}>
                    {prodPanel.is_active ? 'Live' : 'Hidden'}
                  </span>
                </div>
              </div>
            )}
            <div style={{ padding: '24px 24px 0' }}>
              <p style={{ fontSize: 12, color: 'rgba(245,237,216,0.4)', lineHeight: 1.7, marginBottom: 24 }}>{prodPanel.description}</p>
              <div style={{ background: 'rgba(212,168,71,0.06)', border: '1px solid rgba(212,168,71,0.15)', padding: '16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 8, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.3)', marginBottom: 6 }}>Price (KES)</p>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.8rem', color: '#D4A847', lineHeight: 1 }}>{Number(prodPanel.price).toLocaleString()}</p>
                </div>
                {prodPanel.is_on_discount && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 8, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.3)', marginBottom: 6 }}>After Discount</p>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.8rem', color: '#34d399', lineHeight: 1 }}>{Number(prodPanel.final_price).toLocaleString()}</p>
                    <p style={{ fontSize: 9, color: 'rgba(245,237,216,0.3)', marginTop: 4 }}>{prodPanel.discount_percentage}% off</p>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Initial Stock', value: prodPanel.initial_stock ?? '—', color: '#F5EDD8' },
                  { label: 'Current Stock', value: prodPanel.stock, color: prodPanel.stock < 5 ? '#f87171' : '#F5EDD8' },
                  { label: 'Units Sold', value: prodPanel.initial_stock != null ? Math.max(0, prodPanel.initial_stock - prodPanel.stock) : '—', color: '#D4A847' },
                  { label: 'Created', value: new Date(prodPanel.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }), color: 'rgba(245,237,216,0.5)' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'rgba(44,30,22,0.6)', border: '1px solid rgba(212,168,71,0.08)', padding: '14px 14px' }}>
                    <p style={{ fontSize: 8, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.3)', marginBottom: 8, fontWeight: 500 }}>{stat.label}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 300, color: stat.color as string, lineHeight: 1 }}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Customisable', active: prodPanel.is_customisable },
                  { label: 'On Discount',  active: prodPanel.is_on_discount  },
                  { label: 'Live',         active: prodPanel.is_active        },
                ].map(f => (
                  <span key={f.label} style={{ fontSize: 9, padding: '5px 12px', letterSpacing: '.15em', textTransform: 'uppercase', background: f.active ? 'rgba(212,168,71,0.1)' : 'rgba(245,237,216,0.04)', color: f.active ? '#D4A847' : 'rgba(245,237,216,0.2)', border: `1px solid ${f.active ? 'rgba(212,168,71,0.2)' : 'rgba(245,237,216,0.06)'}` }}>{f.label}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PANEL: CATEGORY DETAIL ── */}
      {(catPanel || catPanelLoad) && (
        <div onClick={() => setCatPanel(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,5,2,0.5)', backdropFilter: 'blur(2px)' }} />
      )}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201, width: catPanel || catPanelLoad ? 420 : 0, minWidth: catPanel || catPanelLoad ? 420 : 0, background: '#1A0F08', borderLeft: '1px solid rgba(212,168,71,0.15)', overflow: 'hidden', transition: 'width .35s cubic-bezier(.4,0,.2,1), min-width .35s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 3, flexShrink: 0, background: KENTE_THIN }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(212,168,71,0.08)', flexShrink: 0 }}>
          <p style={{ fontSize: 9, letterSpacing: '.4em', textTransform: 'uppercase', color: '#D4A847', fontWeight: 600 }}>Category Detail</p>
          <button onClick={() => setCatPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,237,216,0.3)', fontSize: 18, lineHeight: 1, padding: 0, transition: 'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5EDD8')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,216,0.3)')}>✕</button>
        </div>
        {catPanelLoad && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,237,216,0.2)', fontSize: 11, letterSpacing: '.2em' }}>Loading…</div>
        )}
        {catPanel && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 40px' }}>
            {catPanel.image_url && (
              <div style={{ position: 'relative', height: 180, overflow: 'hidden', flexShrink: 0 }}>
                <img src={catPanel.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6) sepia(0.2)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #1A0F08 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 300, color: '#F5EDD8', lineHeight: 1.1 }}>{catPanel.name}</h2>
                </div>
              </div>
            )}
            <div style={{ padding: '24px 24px 0' }}>
              <p style={{ fontSize: 12, color: 'rgba(245,237,216,0.4)', lineHeight: 1.7, marginBottom: 24 }}>{catPanel.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {[
                  { label: 'Created',              value: new Date(catPanel.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'Products',             value: catPanel.products.length },
                  { label: 'Total Initial Stock',  value: catPanel.products.reduce((s, p) => s + (p.initial_stock ?? 0), 0) },
                  { label: 'Current Stock',        value: catPanel.products.reduce((s, p) => s + p.stock, 0) },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'rgba(44,30,22,0.6)', border: '1px solid rgba(212,168,71,0.1)', padding: '16px 14px' }}>
                    <p style={{ fontSize: 8, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.3)', marginBottom: 8, fontWeight: 500 }}>{stat.label}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 300, color: '#F5EDD8', lineHeight: 1 }}>{stat.value}</p>
                  </div>
                ))}
              </div>
              {(() => {
                const totalInitial = catPanel.products.reduce((s, p) => s + (p.initial_stock ?? 0), 0);
                const sold = totalInitial - catPanel.products.reduce((s, p) => s + p.stock, 0);
                return sold > 0 ? (
                  <div style={{ background: 'rgba(212,168,71,0.06)', border: '1px solid rgba(212,168,71,0.15)', padding: '14px 16px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 9, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.4)' }}>Units Sold</p>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.4rem', color: '#D4A847' }}>{sold}</p>
                  </div>
                ) : null;
              })()}
              <p style={{ fontSize: 9, letterSpacing: '.35em', textTransform: 'uppercase', color: 'rgba(245,237,216,0.25)', marginBottom: 12, fontWeight: 600 }}>Products</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {catPanel.products.map(p => {
                  const sold = (p.initial_stock ?? 0) - p.stock;
                  return (
                    <div key={p.id} style={{ background: 'rgba(44,30,22,0.4)', border: '1px solid rgba(212,168,71,0.08)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#F5EDD8', marginBottom: 4 }}>{p.name}</p>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontSize: 9, color: 'rgba(245,237,216,0.3)' }}>Started: {p.initial_stock ?? '—'}</span>
                          <span style={{ fontSize: 9, color: 'rgba(245,237,216,0.3)' }}>Now: {p.stock}</span>
                          {sold > 0 && <span style={{ fontSize: 9, color: '#D4A847' }}>Sold: {sold}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 9, padding: '3px 8px', letterSpacing: '.1em', textTransform: 'uppercase', background: p.is_active ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: p.is_active ? '#34d399' : '#f87171' }}>
                        {p.is_active ? 'Live' : 'Hidden'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse   { 0%,100%{opacity:1}50%{opacity:.4} }
        @keyframes toastIn { from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}