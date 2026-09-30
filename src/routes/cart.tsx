import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, Check } from "lucide-react";
import { AppShell, TopBar } from "@/components/AppShell";
import { ConditionBadge } from "@/components/ProductCard";
import { baht } from "@/lib/shop-data";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "รถเข็นสินค้า | Flukeshop" },
      {
        name: "description",
        content: "ตรวจสอบสินค้าในรถเข็น ปรับจำนวน เลือกรายการที่ต้องการ และสั่งซื้อได้ทันที",
      },
      { property: "og:title", content: "รถเข็นสินค้า | Flukeshop" },
      { property: "og:description", content: "ตรวจสอบสินค้าในรถเข็นและสั่งซื้อได้ทันที" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, toggle, remove, selectedTotal } = useCart();
  const navigate = useNavigate();
  const discount = selectedTotal > 0 ? 500 : 0;
  const shipping = selectedTotal >= 1000 || selectedTotal === 0 ? 0 : 35;

  return (
    <AppShell header={<TopBar title={`รถเข็น (${items.length})`} />}>
      {items.length === 0 ? (
        <div className="p-16 text-center">
          <p className="text-sm text-muted-foreground">ยังไม่มีสินค้าในรถเข็น</p>
          <Link to="/" className="mt-4 inline-block text-sm font-bold text-primary">
            เลือกซื้อสินค้า
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-2 p-3">
            {items.map(({ product, qty, selected }) => (
              <li key={product.id} className="flex gap-2 rounded-xl bg-card p-3 shadow-card">
                <button
                  aria-label="เลือกสินค้า"
                  onClick={() => toggle(product.id)}
                  className={`mt-1 grid size-6 shrink-0 place-items-center rounded-md border-2 ${
                    selected ? "border-primary bg-primary" : "border-border"
                  }`}
                >
                  {selected && <Check className="size-4 text-primary-foreground" />}
                </button>
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
                    className="line-clamp-2 text-xs leading-tight"
                  >
                    {product.name}
                  </Link>
                  <div className="mt-1">
                    <ConditionBadge condition={product.condition} />
                  </div>
                  <p className="mt-1 text-sm font-bold text-primary">{baht(product.price)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      aria-label="ลดจำนวน"
                      onClick={() => setQty(product.id, qty - 1)}
                      className="grid size-9 place-items-center rounded-lg border border-border active:bg-secondary"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{qty}</span>
                    <button
                      aria-label="เพิ่มจำนวน"
                      onClick={() => setQty(product.id, qty + 1)}
                      className="grid size-9 place-items-center rounded-lg border border-border active:bg-secondary"
                    >
                      <Plus className="size-4" />
                    </button>
                    <button
                      aria-label="ลบสินค้า"
                      onClick={() => remove(product.id)}
                      className="ml-auto grid size-9 place-items-center rounded-lg text-muted-foreground active:bg-secondary"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <section className="mx-3 space-y-2 rounded-xl bg-card p-4 text-sm shadow-card">
            <div className="flex justify-between">
              <span className="text-muted-foreground">รวมทั้งหมด</span>
              <span className="font-bold text-primary">{baht(selectedTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ส่วนลด</span>
              <span className="text-success">-{baht(discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ค่าจัดส่ง</span>
              <span>{baht(shipping)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">(ส่งฟรีเมื่อสั่งครบ 1,000.-)</p>
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <span className="font-semibold">ยอดสุทธิ</span>
              <span className="font-extrabold text-primary">
                {baht(Math.max(0, selectedTotal - discount + shipping))}
              </span>
            </div>
          </section>

          <div className="p-3">
            <button
              disabled={selectedTotal === 0}
              onClick={() => navigate({ to: "/checkout" })}
              className="min-h-13 w-full rounded-full bg-primary text-base font-bold text-primary-foreground disabled:opacity-50 active:scale-[0.98]"
            >
              สั่งซื้อทั้งหมด
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
} 