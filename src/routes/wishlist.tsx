import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag } from "lucide-react";
import { AppShell, TopBar } from "@/components/AppShell";
import { ConditionBadge } from "@/components/ProductCard";
import { baht } from "@/lib/shop-data";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useEffect } from "react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "สินค้าที่ถูกใจ | Flukeshop" },
      {
        name: "description",
        content: "รายการสินค้าที่คุณถูกใจ จัดเก็บไว้เพื่อให้คุณกลับมาเลือกซื้อได้ง่ายขึ้น",
      },
      { property: "og:title", content: "สินค้าที่ถูกใจ | Flukeshop" },
      { property: "og:description", content: "รายการสินค้าที่คุณถูกใจทั้งหมด" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { items, fetchWishlist, toggleWishlist } = useWishlist();
  const { add: addToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return (
    <AppShell header={<TopBar title={`สินค้าที่ถูกใจ (${items.length})`} />}>
      {items.length === 0 ? (
        <div className="p-16 text-center">
          <p className="text-sm text-muted-foreground">ยังไม่มีสินค้าที่ถูกใจ</p>
          <Link to="/" className="mt-4 inline-block text-sm font-bold text-primary">
            เลือกซื้อสินค้า
          </Link>
        </div>
      ) : (
        <ul className="space-y-2 p-3">
          {items.map((product) => (
            <li key={product.id} className="flex gap-3 rounded-xl bg-card p-3 shadow-card">
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                width={768}
                height={768}
                className="size-20 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <Link
                  to="/product/$id"
                  params={{ id: product.id }}
                  className="line-clamp-2 text-xs leading-tight font-medium"
                >
                  {product.name}
                </Link>
                <div className="mt-1">
                  <ConditionBadge condition={product.condition} />
                </div>
                <p className="mt-1 text-sm font-bold text-primary">{baht(product.price)}</p>
              </div>
              <div className="flex flex-col justify-between items-end shrink-0">
                <button
                  aria-label="ลบออกจากรายการโปรด"
                  onClick={() => toggleWishlist(product)}
                  className="grid size-9 place-items-center rounded-lg text-muted-foreground active:bg-secondary"
                >
                  <Trash2 className="size-4 text-destructive" />
                </button>
                <button
                  aria-label="เพิ่มลงรถเข็น"
                  onClick={() => addToCart(product)}
                  className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground active:scale-95"
                >
                  <ShoppingBag className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}