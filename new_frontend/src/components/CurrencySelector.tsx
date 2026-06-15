import { useCurrency } from '../context/CurrencyContext';

const SYMBOLS: Record<string, string> = {
  KES: 'KSh', USD: '$', EUR: '€', GBP: '£',
  CAD: 'CA$', AUD: 'AU$', INR: '₹', AED: 'AED',
  ZAR: 'R',   NGN: '₦',
};

export default function CurrencySelector() {
  const { currency, setCurrency, currencies } = useCurrency();

  return (
    <select
      className="currency-select"
      value={currency}
      onChange={e => setCurrency(e.target.value)}
      aria-label="Select currency"
    >
      {currencies.map(c => (
        <option key={c.code} value={c.code}>
          {SYMBOLS[c.code] ?? c.code} {c.code}
        </option>
      ))}
    </select>
  );
}
