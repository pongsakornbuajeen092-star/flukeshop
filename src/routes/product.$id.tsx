import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Share2, Star, ShieldCheck, Minus, Plus, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, TopBar } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
});

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  description: string;
  condition?: string;
  created_at?: string;
  store?: string;
  seller_id?: string;
}

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .eq("moderation_status", "approved")
          .single();

        if (isMounted) {
          if (!error && data) {
            setProduct(data);
          } else {
            setProduct(null);
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        if (isMounted) setProduct(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <AppShell header={<TopBar title="รายละเอียดสินค้า" />}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell header={<TopBar title="ไม่พบสินค้า" />}>
        <div className="p-10 text-center text-sm text-muted-foreground">
          ไม่พบสินค้าชิ้นนี้
          <div className="mt-4">
            <Link to="/search" className="font-bold text-primary">
              กลับหน้าค้นหา
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const liked = isWishlisted(product.id);

  const cartProduct = {
    id: product.id,
    name: product.title,
    price: product.price,
    images: [product.image_url],
    store: product.store || "ร้านค้าแนะนำ",
  };

  const isUsed =
    product.condition === "used" ||
    product.title?.includes("มือสอง") ||
    product.title?.includes("มือ 2");

  const handleChat = () => {
    const searchParams = new URLSearchParams({
      seller_id: product.seller_id || "admin",
      product_id: product.id,
      store: product.store || "ร้านค้าทางการ",
      title: product.title,
    }).toString();

    navigate({
      to: `/chat?${searchParams}` as any,
    });
  };

  return (
    <AppShell
      header={
        <TopBar
          title="รายละเอียดสินค้า"
          right={
            <>
              <button
                aria-label="ถูกใจ"
                onClick={() => {
                  toggleWishlist(cartProduct as any);
                  toast.success(
                    liked ? "นำออกจากสินค้าที่ถูกใจแล้ว" : "เพิ่มในสินค้าที่ถูกใจแล้ว"
                  );
                }}
                className="grid size-10 place-items-center rounded-full active:bg-secondary"
              >
                <Heart className={`size-5 ${liked ? "fill-primary text-primary" : ""}`} />
              </button>
              <button
                aria-label="แชร์"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("คัดลอกลิงก์เรียบร้อย");
                }}
                className="grid size-10 place-items-center rounded-full active:bg-secondary"
              >
                <Share2 className="size-5" />
              </button>
            </>
          }
        />
      }
    >
      <div className="mx-auto max-w-lg pb-36">
        <div className="page-fade">
          <div className="relative bg-card">
            <img
              src={product.image_url}
              alt={product.title}
              width={768}
              height={768}
              className="aspect-square w-full object-cover"
            />
          </div>

          <section className="mt-2 space-y-2 bg-card p-4">
            <h1 className="text-base font-bold text-foreground">{product.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <ShieldCheck className="size-3.5" /> ผ่านการตรวจสอบก่อนลงขาย
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground">
                {isUsed ? "มือ 2" : "มือ 1"}
              </span>
            </div>

            <div className="flex items-end gap-2 pt-1">
              <p className="text-2xl font-extrabold text-primary">
                ฿ {product.price.toLocaleString("th-TH")}
              </p>
            </div>
          </section>

          <section className="mt-2 flex items-center gap-3 bg-card p-4">
            <span className="text-sm text-muted-foreground">จำนวน</span>
            <div className="ml-auto flex items-center gap-2">
              <button
                aria-label="ลดจำนวน"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid size-10 place-items-center rounded-lg border border-border active:bg-secondary"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button
                aria-label="เพิ่มจำนวน"
                onClick={() => setQty((q) => q + 1)}
                className="grid size-10 place-items-center rounded-lg border border-border active:bg-secondary"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </section>

          <section className="mt-2 flex items-center gap-3 bg-card p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
              ร้าน
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{product.store || "ร้านค้าทางการ"}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3 fill-primary text-primary" /> 4.8 • ผู้ขายแนะนำ
              </p>
            </div>
            <button
              onClick={handleChat}
              className="shrink-0 rounded-full border border-primary px-3 py-2 text-xs font-bold text-primary active:scale-95 transition-transform"
            >
              แชทกับร้าน
            </button>
          </section>

          <section className="mt-2 bg-card p-4">
            <h2 className="mb-1 text-sm font-bold">รายละเอียดสินค้า</h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {product.description || "ไม่มีรายละเอียดสินค้า"}
            </p>
          </section>
        </div>
      </div>

      {/* Floating Bottom Bar บังคับเช็กผ่าน Supabase ล้วนๆ */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-card shadow-nav">
        <div className="mx-auto flex max-w-lg gap-2 p-3">
          <button
            onClick={async () => {
              const { data: { user }, error } = await supabase.auth.getUser();

              if (error || !user) {
                toast.error("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า");
                navigate({ to: "/login" });
                return;
              }

              add(cartProduct as any, qty);
              toast.success("เพิ่มลงตระกร้าแล้ว");
            }}
            className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-primary text-sm font-bold text-primary active:scale-[0.98]"
          >
            <ShoppingCart className="size-5" /> เพิ่มใส่ตระกร้า
          </button>
          <button
            onClick={async () => {
              const { data: { user }, error } = await supabase.auth.getUser();

              if (error || !user) {
                toast.error("กรุณาเข้าสู่ระบบก่อนทำการซื้อสินค้า");
                navigate({ to: "/login" });
                return;
              }

              add(cartProduct as any, qty);
              navigate({ to: "/checkout" });
            }}
            className="min-h-12 flex-1 rounded-full bg-primary text-sm font-bold text-primary-foreground active:scale-[0.98]"
          >
            ซื้อเลย
          </button>
        </div>
        <div className="safe-bottom" />
      </div>
    </AppShell>
  );
}