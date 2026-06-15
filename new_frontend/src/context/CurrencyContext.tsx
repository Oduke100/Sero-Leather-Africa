import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
const API = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000/api`;

interface CurrencyRow {
  code:        string;
  name:        string;
  rate_to_kes: number;
}

interface CurrencyContextType {
  currency:     string;
  setCurrency:  (c: string) => void;
  convertPrice: (kes: number) => string;
  currencies:   CurrencyRow[];
}

const SYMBOLS: Record<string, string> = {
  KES: 'KSh', USD: '$', EUR: '€', GBP: '£',
  CAD: 'CA$', AUD: 'AU$', INR: '₹', AED: 'AED',
  ZAR: 'R',   NGN: '₦',
};

const HIGH_VALUE = ['KES', 'NGN', 'INR', 'ZAR'];

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(
    () => localStorage.getItem('sero-currency') || 'KES'
  );
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([
    { code: 'KES', name: 'Kenyan Shilling', rate_to_kes: 1 }
  ]);

  useEffect(() => {
    fetch(`${API}/currencies`)
      .then(r => r.json())
      .then((data: CurrencyRow[]) => {
        const kes = { code: 'KES', name: 'Kenyan Shilling', rate_to_kes: 1 };
        setCurrencies([kes, ...data.filter(c => c.code !== 'KES')]);
      })
      .catch(() => {}); // silently keep KES as fallback
  }, []);

  const setCurrency = (c: string) => {
    localStorage.setItem('sero-currency', c);
    setCurrencyState(c);
  };

  const convertPrice = (kes: number): string => {
    const row      = currencies.find(c => c.code === currency);
    const rate     = row ? Number(row.rate_to_kes) : 1;
    const symbol   = SYMBOLS[currency] ?? currency;
    const converted = Math.floor(kes * rate) + 0.99;
    const formatted = HIGH_VALUE.includes(currency)
      ? converted.toLocaleString()
      : converted.toFixed(2);
    return `${symbol} ${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, currencies }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
