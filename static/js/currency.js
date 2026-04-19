/* ================================================================
   currency.js  —  Sero Leather Africa
   Save to: /static/js/currency.js
   ================================================================ */

const SERO_CURRENCIES = {
  KES: { symbol: 'KES', name: 'Kenyan Shilling',   rate: 1        },
  USD: { symbol: '$',   name: 'US Dollar',          rate: 0.00772  },
  EUR: { symbol: '€',   name: 'Euro',               rate: 0.00713  },
  GBP: { symbol: '£',   name: 'British Pound',      rate: 0.00612  },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar',    rate: 0.01054  },
  AUD: { symbol: 'A$',  name: 'Australian Dollar',  rate: 0.01185  },
  INR: { symbol: '₹',   name: 'Indian Rupee',       rate: 0.64500  },
  AED: { symbol: 'AED', name: 'UAE Dirham',         rate: 0.02835  },
  ZAR: { symbol: 'R',   name: 'South African Rand', rate: 0.14200  },
  NGN: { symbol: '₦',   name: 'Nigerian Naira',     rate: 12.3500  },
};

const CURRENCY_KEY = 'sero-currency';

function getActiveCurrency() {
  return localStorage.getItem(CURRENCY_KEY) || 'KES';
}

function setActiveCurrency(code) {
  if (SERO_CURRENCIES[code]) localStorage.setItem(CURRENCY_KEY, code);
}

function convertPrice(kes) {
  const code = getActiveCurrency();
  const cur  = SERO_CURRENCIES[code];
  if (!cur) return 'KES ' + (Math.floor(kes) + 0.99).toLocaleString();
  const converted = kes * cur.rate;
  if (['KES','NGN','INR','ZAR'].includes(code)) {
    return cur.symbol + ' ' + (Math.floor(converted) + 0.99).toLocaleString();
  }
  return cur.symbol + (Math.floor(converted) + 0.99).toFixed(2);
}

function mountCurrencySwitcher(mountId) {
  const mount = document.getElementById(mountId || 'sero-currency-mount');
  if (!mount) return;

  const active = getActiveCurrency();
  const wrap   = document.createElement('div');
  wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center;';

  const sel = document.createElement('select');
  sel.style.cssText = [
    'appearance:none','-webkit-appearance:none',
    'background:transparent',
    'border:1px solid rgba(212,168,71,0.3)',
    'color:rgba(245,237,216,0.75)',
    'font-family:Jost,sans-serif',
    'font-size:10px','letter-spacing:0.15em',
    'padding:6px 28px 6px 10px',
    'cursor:pointer','outline:none',
    'transition:border-color 0.2s,color 0.2s',
  ].join(';');

  Object.entries(SERO_CURRENCIES).forEach(([code, cur]) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = code + ' — ' + cur.name;
    opt.selected = (code === active);
    opt.style.cssText = 'background:#1A0F08;color:#F5EDD8;';
    sel.appendChild(opt);
  });

  sel.addEventListener('mouseover', () => { sel.style.borderColor='rgba(212,168,71,0.7)'; sel.style.color='#F5EDD8'; });
  sel.addEventListener('mouseout',  () => { sel.style.borderColor='rgba(212,168,71,0.3)'; sel.style.color='rgba(245,237,216,0.75)'; });

  sel.addEventListener('change', () => {
    setActiveCurrency(sel.value);
    if (typeof window.seroRefreshPrices === 'function') window.seroRefreshPrices();
  });

  const chevron = document.createElement('span');
  chevron.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);pointer-events:none;"><path d="M2 3.5L5 6.5L8 3.5" stroke="rgba(212,168,71,0.6)" stroke-width="1.2" stroke-linecap="round"/></svg>';

  wrap.appendChild(sel);
  wrap.appendChild(chevron);
  mount.appendChild(wrap);
}
