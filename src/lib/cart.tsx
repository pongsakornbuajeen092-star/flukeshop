import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { type Product } from "./shop-data";

export type CartItem = { product: Product; qty: number; selected: boolean };

type CartContext = {
  items: CartItem[];
  count: number;
  selectedTotal: number;
  add: (product: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  toggle: (id: string) => void;
  clear: () => void;
  lastOrderId: string;
  placeOrder: () => string;
};

const Ctx = createContext<CartContext | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // โหลดข้อมูลเก่าจาก localStorage มาเป็นค่าเริ่มต้น (ถ้ามี) ถ้าไม่มีให้เป็นอาเรย์ว่าง []
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("shopping-cart-items");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  const [lastOrderId, setLastOrderId] = useState("#123456789");

  // บันทึกลง localStorage ทุกครั้งที่ items มีการเปลี่ยนแปลง
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("shopping-cart-items", JSON.stringify(items));
    }
  }, [items]);

  const value = useMemo<CartContext>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const selectedTotal = items
      .filter((i) => i.selected)
      .reduce((s, i) => s + i.qty * i.product.price, 0);

    return {
      items,
      count,
      selectedTotal,
      lastOrderId,
      add: (product, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((i) => i.product.id === product.id);
          if (found)
            return prev.map((i) =>
              i.product.id === product.id ? { ...i, qty: i.qty + qty, selected: true } : i,
            );
          return [...prev, { product, qty, selected: true }];
        }),
      remove: (id) => setItems((prev) => prev.filter((i) => i.product.id !== id)),
      setQty: (id, qty) =>
        setItems((prev) =>
          prev.map((i) => (i.product.id === id ? { ...i, qty: Math.max(1, qty) } : i)),
        ),
      toggle: (id) =>
        setItems((prev) =>
          prev.map((i) => (i.product.id === id ? { ...i, selected: !i.selected } : i)),
        ),
      clear: () => setItems([]),
      placeOrder: () => {
        const id = "#" + Math.floor(100000000 + Math.random() * 899999999);
        setLastOrderId(id);
        setItems((prev) => prev.filter((i) => !i.selected));
        return id;
      },
    };
  }, [items, lastOrderId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}