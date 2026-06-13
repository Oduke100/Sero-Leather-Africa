import { createContext, useContext, useState, ReactNode } from 'react';

const RATES: Record<string, number> = {
  KES: 1, USD: 0.0077, EUR: 0.0071, GBP: 0.0061,
  CAD: 0.0105, AUD: 0.0118, INR: 0.64, AED: 0.0283,
  ZAR: 0.143, NGN: 12.1,
};

const SYMBOLS: Record<string, string> = {
  KES: 'KSh', USD: '$', EUR: '€', GBP: '£',
  CAD: 'CA$', AUD: 'AU$', INR: '₹', AED: 'AED',
  ZAR: 'R', NGN: '₦',
};

const HIGH_VALUE = ['KES', 'NGN', 'INR', 'ZAR'];

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  convertPrice: (kes: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(
    () => localStorage.getItem('sero-currency') || 'KES'
  );

  const setCurrency = (c: string) => {
    localStorage.setItem('sero-currency', c);
    setCurrencyState(c);
  };

  const convertPrice = (kes: number): string => {
    const rate      = RATES[currency] ?? 1;
    const symbol    = SYMBOLS[currency] ?? currency;
    const converted = Math.floor(kes * rate) + 0.99;
    const formatted = HIGH_VALUE.includes(currency)
      ? converted.toLocaleString()
      : converted.toFixed(2);
    return `${symbol} ${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
