import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderStatus, type OrderStatusResponse } from '../api/index';

const POLL_INTERVAL = 3000;
const MAX_POLLS     = 40;

// ─── ORDER CONFIRMATION ───────────────────────────────────────────────────────
export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate    = useNavigate();
  const [status,   setStatus]   = useState<OrderStatusResponse | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let pollCount = 0;
    const interval = setInterval(async () => {
      try {
        const data = await getOrderStatus(Number(orderId));
        setStatus(data);
        pollCount++;
        if (pollCount >= MAX_POLLS) { clearInterval(interval); setTimedOut(true); }
        if (data.payment_status === 'paid' || data.payment_status === 'failed') clearInterval(interval);
      } catch { clearInterval(interval); }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [orderId]);

  const isPaid    = status?.payment_status === 'paid';
  const isFailed  = status?.payment_status === 'failed';
  const isPending = !isPaid && !isFailed && !timedOut;

  return (
    <div className="oc-root">
      <div className="oc-wrap">

        {/* ─── PAID ─────────────────────────────────────────────────────────── */}
        {isPaid && (
          <>
            <div className="oc-icon oc-icon--success">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--savannah)" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="oc-eyebrow">Payment Received</p>
            <h1 className="oc-title">Order<br /><em>Confirmed</em></h1>
            <div className="oc-details">
              <div className="oc-detail-row"><span>Item</span><span>{status?.items?.length ? (status.items.length > 1 ? `${status.items[0]} + ${status.items.length - 1} more` : status.items[0]) : 'your order'}</span></div>
              <div className="oc-detail-row"><span>Amount Paid</span><span>KSh {status ? Number(status.total_price).toLocaleString() : ''}</span></div>
              <div className="oc-detail-row"><span>Payment</span><span className="oc-paid-badge">M-Pesa ✓</span></div>
            </div>
            <p className="oc-note">A confirmation has been recorded. Your order is now being prepared. Our team will be in touch shortly.</p>
            <div className="oc-actions">
              <button className="btn-savannah" onClick={() => navigate('/products')}>Continue Shopping</button>
            </div>
          </>
        )}

        {/* ─── FAILED ───────────────────────────────────────────────────────── */}
        {isFailed && (
          <>
            <div className="oc-icon oc-icon--fail">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ember)" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <p className="oc-eyebrow">Payment Unsuccessful</p>
            <h1 className="oc-title">Payment<br /><em>Failed</em></h1>
            <p className="oc-note">The M-Pesa payment for {status?.items?.length ? (status.items.length > 1 ? `${status.items[0]} + ${status.items.length - 1} more` : status.items[0]) : 'your order'} was not completed. No charges were made. Please try again.</p>
            <div className="oc-actions">
              <button className="btn-savannah" onClick={() => navigate('/checkout')}>Try Again</button>
              <button className="oc-secondary-btn" onClick={() => navigate('/cart')}>Back to Bag</button>
            </div>
          </>
        )}

        {/* ─── TIMED OUT ────────────────────────────────────────────────────── */}
        {timedOut && !isPaid && !isFailed && (
          <>
            <div className="oc-icon oc-icon--warn">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--savannah)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="oc-eyebrow">Taking Longer Than Expected</p>
            <h1 className="oc-title">Still<br /><em>Waiting</em></h1>
            <p className="oc-note">We haven't received payment confirmation yet for {status?.items?.length ? (status.items.length > 1 ? `${status.items[0]} + ${status.items.length - 1} more` : status.items[0]) : 'your order'}. Check your M-Pesa messages. If you were charged, please contact us and we'll sort it out immediately.</p>
            <div className="oc-actions">
              <button className="btn-savannah" onClick={() => navigate('/')}>Return Home</button>
            </div>
          </>
        )}

        {/* ─── PENDING / POLLING ────────────────────────────────────────────── */}
        {isPending && (
          <>
            <div className="oc-spinner-wrap">
              <div className="oc-spinner" />
              <div className="oc-spinner-ring" />
            </div>
            <p className="oc-eyebrow">Awaiting Confirmation</p>
            <h1 className="oc-title">Check Your<br /><em>Phone</em></h1>
            <p className="oc-note">An M-Pesa prompt has been sent to your phone. Enter your PIN to complete the payment.</p>
            <div className="oc-pulse-row">
              <span className="oc-pulse-dot" />
              <span className="oc-pulse-label">Listening for payment · {status?.items?.length ? (status.items.length > 1 ? `${status.items[0]} + ${status.items.length - 1} more` : status.items[0]) : 'your order'}</span>
            </div>
          </>
        )}

      </div>
      <div className="kente-border oc-kente" aria-hidden="true" />
    </div>
  );
}