import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type CartValue = { 
  items: string[]; 
  add: (id: string) => void; 
  remove: (id: string) => void; 
  toggle: (id: string) => void;
  setAll: (ids: string[]) => void;
  clear: () => void;
};
const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('yuzersef.cart') || '[]') as string[];
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  });
  useEffect(() => localStorage.setItem('yuzersef.cart', JSON.stringify(items)), [items]);
  const value = useMemo(() => ({
    items,
    add: (id: string) => setItems((current) => current.includes(id) ? current : [...current, id]),
    remove: (id: string) => setItems((current) => current.filter((item) => item !== id)),
    toggle: (id: string) => setItems((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    setAll: (ids: string[]) => setItems(ids),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
