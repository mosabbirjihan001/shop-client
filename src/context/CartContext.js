import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const CART_KEY = "shopapp_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // Cart still works for this session if browser storage is blocked.
    }
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    setItems((current) => {
      const stock = product.stock_quantity == null ? null : Number(product.stock_quantity || 0);
      const requested = Math.max(1, Number(quantity || 1));
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: stock != null ? Math.min(stock, item.quantity + requested) : item.quantity + requested }
            : item
        );
      }
      return [...current, { ...product, quantity: stock != null ? Math.min(stock, requested) : requested }];
    });
  };

  const updateQuantity = (id, quantity) => {
    setItems((current) =>
      current
        .map((item) => {
          if (item.id !== id) return item;
          const stock = item.stock_quantity == null ? null : Number(item.stock_quantity || 0);
          const nextQuantity = Math.max(1, Number(quantity || 1));
          return { ...item, quantity: stock != null ? Math.min(stock, nextQuantity) : nextQuantity };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const clearCart = () => setItems([]);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
    return { items, count, subtotal, addToCart, updateQuantity, removeFromCart, clearCart };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
