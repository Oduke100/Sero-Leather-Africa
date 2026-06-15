import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface CartItem {
  product_id: number;
  variant_id?: number;
  name:        string;
  image:       string;
  price:       number;   // effective price at time of add (discount already applied)
  quantity:    number;
}

interface CartContextType {
  items:      CartItem[];
  addItem:    (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (product_id: number, variant_id?: number) => void;
  updateQty:  (product_id: number, variant_id: number | undefined, qty: number) => void;
  clearCart:  () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);
const CART_KEY   = 'sero-cart';

const key = (product_id: number, variant_id?: number) =>
  `${product_id}-${variant_id ?? 'none'}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'>, qty: number = 1) =>
    setItems(prev => {
      const exists = prev.find(i => key(i.product_id, i.variant_id) === key(item.product_id, item.variant_id));
      return exists
        ? prev.map(i => key(i.product_id, i.variant_id) === key(item.product_id, item.variant_id)
            ? { ...i, quantity: i.quantity + qty } : i)
        : [...prev, { ...item, quantity: qty }];
    });

  const removeItem = (product_id: number, variant_id?: number) =>
    setItems(prev => prev.filter(i => key(i.product_id, i.variant_id) !== key(product_id, variant_id)));

  const updateQty = (product_id: number, variant_id: number | undefined, qty: number) => {
    if (qty <= 0) { removeItem(product_id, variant_id); return; }
    setItems(prev => prev.map(i =>
      key(i.product_id, i.variant_id) === key(product_id, variant_id) ? { ...i, quantity: qty } : i
    ));
  };

  const clearCart  = () => setItems([]);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
