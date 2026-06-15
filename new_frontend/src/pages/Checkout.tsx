import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { createOrder } from '../api/index';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0'))   return '254' + digits.slice(1);
  return digits;
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { convertPrice } = useCurrency();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    delivery_address: '', payment_method: 'mpesa',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // ─────────────────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.customer_name.trim())    { setError('Please enter your full name');        return; }
    if (!form.customer_email.trim())   { setError('Please enter your email');            return; }
    if (!form.customer_phone.trim())   { setError('Please enter your phone number');     return; }
    if (!form.delivery_address.trim()) { setError('Please enter your delivery address'); return; }
    setError(null); setLoading(true);
    try {
      const order = await createOrder({
        ...form,
        customer_phone: normalizePhone(form.customer_phone),
        currency: 'KES',
        items: items.map(i => ({ product_id: (i as any).product_id ?? (i as any).id, variant_id: i.variant_id, quantity: i.quantity })),
      });
      if (form.payment_method === 'paypal') {
        const apiBase = import.meta.env.VITE_API_BASE || ("http://" + window.location.hostname + ":8000");
        const res  = await fetch(apiBase + "/api/orders/" + order.id + "/paypal/create", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'PayPal error');
        sessionStorage.setItem('paypal_order_id', String(order.id));
        window.location.href = data.approval_url;
        return;
      }
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e) || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  if (items.length === 0) return (
    <>
      <div className="cart-hero">
        <div className="section-inner">
          <p className="eyebrow">Checkout</p>
          <h1 className="cart-hero-title">Nothing<br /><em>to Check Out</em></h1>
          <p className="cart-hero-sub">Your bag is empty.</p>
        </div>
      </div>
      <div className="section-inner cart-empty">
        <p className="cart-empty-sub">Add some pieces first.</p>
        <button className="btn-savannah" onClick={() => navigate('/products')}>Explore Collections</button>
      </div>
    </>
  );

  const FIELDS = [
    { label: 'Full Name',     name: 'customer_name',  type: 'text',  placeholder: 'Jane Wanjiru'   },
    { label: 'Email Address', name: 'customer_email', type: 'email', placeholder: 'jane@email.com' },
    { label: 'Phone No.',     name: 'customer_phone', type: 'tel',   placeholder: '0712 345 678'   },
  ] as { label: string; name: keyof typeof form; type: string; placeholder: string }[];

  const PAYMENT_OPTS = [
    { val: 'mpesa',  label: 'M-Pesa', sub: 'STK Push to your phone', color: '#4ade80', bg: 'rgba(0,166,81,0.12)',   border: 'rgba(0,166,81,0.4)'   },
    { val: 'paypal', label: 'PayPal', sub: 'Pay via PayPal',          color: '#60cfff', bg: 'rgba(24,160,251,0.12)', border: 'rgba(24,160,251,0.4)' },
  ] as { val: string; label: string; sub: string; color: string; bg: string; border: string }[];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── HERO ── */}
      <div className="cart-hero">
        <div className="section-inner">
          <p className="eyebrow reveal">Almost There</p>
          <h1 className="cart-hero-title reveal" style={{ transitionDelay: '.1s' }}>Complete Your<br /><em>Order</em></h1>
          <p className="cart-hero-sub reveal" style={{ transitionDelay: '.2s' }}>Fill in your details and choose a payment method</p>
        </div>
      </div>

      <div className="kente-border" aria-hidden="true" />

      <div className="section-inner co-grid">

        {/* ── FORM ── */}
        <div className="co-form-col">
          <div className="co-section-label">Your Details</div>
          <div className="co-fields">
            {FIELDS.map(f => (
              <div key={f.name} className="co-field">
                <label className="co-label">{f.label}</label>
                <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder} className="co-input" disabled={loading} />
              </div>
            ))}
            <div className="co-field co-field--full">
              <label className="co-label">Delivery Address</label>
              <textarea name="delivery_address" value={form.delivery_address} onChange={handleChange} placeholder="Kilimani, Nairobi — Near Junction Mall" rows={3} className="co-input co-textarea" disabled={loading} />
            </div>
            <div className="co-field co-field--full">
              <label className="co-label">Payment Method</label>
              <div className="co-payment-opts">
                {PAYMENT_OPTS.map(p => (
                  <label key={p.val} className={`co-payment-opt${form.payment_method === p.val ? ' co-payment-opt--active' : ''}`} style={form.payment_method === p.val ? { background: p.bg, borderColor: p.border } : {}}>
                    <input type="radio" name="payment_method" value={p.val} checked={form.payment_method === p.val} onChange={handleChange} className="sr-only" />
                    <span className="co-payment-name" style={{ color: form.payment_method === p.val ? p.color : undefined }}>{p.label}</span>
                    <span className="co-payment-sub">{p.sub}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="co-error">{error}</p>}
          <button className="co-submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Placing Order…' : 'Place Order'}
            {!loading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
          </button>
          <p className="co-note">
            {form.payment_method === 'mpesa' ? "Final price confirmed server-side. You'll receive an M-Pesa prompt on your phone." : "You'll be redirected to PayPal to complete your payment securely."}
          </p>
        </div>

        {/* ── SUMMARY ── */}
        <div className="co-summary-col">
          <div className="glass co-summary-box">
            <h2 className="co-summary-title">Order Summary</h2>
            <div className="co-summary-items">
              {items.map(item => (
                <div key={`${item.product_id}-${item.variant_id ?? 'none'}`} className="co-summary-item">
                  <div className="co-summary-item-img">
                    {item.image && <img src={item.image} alt={item.name} />}
                  </div>
                  <div className="co-summary-item-info">
                    <p className="co-summary-item-name">{item.name}</p>
                    <p className="co-summary-item-qty">Qty: {item.quantity}</p>
                  </div>
                  <span className="co-summary-item-price">{convertPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="co-summary-divider" />
            <div className="co-summary-row">
              <span>Subtotal</span>
              <span className="co-summary-val">{convertPrice(totalPrice)}</span>
            </div>
            <div className="co-summary-row">
              <span>Delivery</span>
              <span className="co-summary-delivery">On delivery</span>
            </div>
            <div className="co-summary-total-row">
              <span className="co-summary-total-label">Total</span>
              <span className="co-summary-total-val">{convertPrice(totalPrice)}</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}