import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function PayPalReturn() {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Confirming your payment...');

  useEffect(() => {
    const orderId = sessionStorage.getItem('paypal_order_id');
    if (!orderId) { navigate('/checkout'); return; }

    fetch(`${import.meta.env.VITE_API_BASE || "`http://${window.location.hostname}:8000`/api"}/orders/${orderId}/paypal/capture`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'paid') {
          sessionStorage.removeItem('paypal_order_id');
          clearCart();
          setStatus('success');
          setTimeout(() => navigate(`/order-confirmation/${orderId}`), 1500);
        } else {
          setStatus('error');
          setMessage('Payment was not completed. Please try again.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong confirming your payment.');
      });
  }, []);

  return (
    <div className="section-inner" style={{ paddingTop: 120, textAlign: 'center' }}>
      {status === 'processing' && (
        <>
          <p className="eyebrow">Please wait</p>
          <h1 className="cart-hero-title">Confirming<br /><em>Payment</em></h1>
          <p className="cart-hero-sub">{message}</p>
        </>
      )}
      {status === 'success' && (
        <>
          <p className="eyebrow">Success</p>
          <h1 className="cart-hero-title">Payment<br /><em>Confirmed</em></h1>
          <p className="cart-hero-sub">Redirecting you to your order...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="eyebrow">Error</p>
          <h1 className="cart-hero-title">Payment<br /><em>Failed</em></h1>
          <p className="cart-hero-sub">{message}</p>
          <button className="btn-savannah" onClick={() => navigate('/checkout')} style={{ marginTop: 32 }}>
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
