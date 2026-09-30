import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { type Product } from "./shop-data";

interface WishlistStore {
  items: Product[];
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (product: Product) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlist = create<WishlistStore>()((set, get) => ({
  items: [],

  // ดึงข้อมูลรายการโปรดจาก Supabase
  fetchWishlist: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      const products: Product[] = data.map((item) => item.product_data);
      set({ items: products });
    }
  },

  toggleWishlist: async (product) => {
    const { data: { user } } = await supabase.auth.getUser();
    const exists = get().items.some((item) => item.id === product.id);

    // อัปเดตสถานะในหน้าจอทันที (Optimistic Update)
    set((state) => ({
      items: exists
        ? state.items.filter((item) => item.id !== product.id) // แก้ไขให้เรียกใช้ state.items ได้ถูกต้อง
        : [...state.items, product],
    }));

    if (user) {
      if (exists) {
        // ลบออกจาก Supabase
        await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);
      } else {
        // เพิ่มลง Supabase
        await supabase.from("wishlist_items").insert({
          user_id: user.id,
          product_id: product.id,
          product_data: product,
        });
      }
    }
  },

  isWishlisted: (productId) => {
    return get().items.some((item) => item.id === productId);
  },
}));