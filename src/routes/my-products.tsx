import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, TopBar } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Loader2, Package, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/my-products")({
  component: MyProductsPage,
});

interface Product {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  created_at: string;
  moderation_status?: "pending" | "approved" | "rejected";
  moderation_note?: string;
}

function MyProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyProducts() {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (err: any) {
        console.error("Error fetching products:", err.message);
        setError("ไม่สามารถโหลดข้อมูลสินค้าได้");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchMyProducts();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <AppShell header={<TopBar title="สินค้าของฉัน" />}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell header={<TopBar title="สินค้าของฉัน" />}>
      <div className="p-4 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            รายการสินค้าทั้งหมด ({products.length})
          </span>
          <Link
            to="/create-product" 
            className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" /> เพิ่มสินค้า
          </Link>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-16 space-y-3 bg-card rounded-2xl shadow-card p-6">
            <Package className="size-12 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">คุณยังไม่มีสินค้าที่ลงขาย</p>
            <p className="text-xs text-muted-foreground">เริ่มลงขายสินค้าชิ้นแรกของคุณได้เลย</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-card shadow-card gap-3"
              >
                <div className="size-16 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package className="size-6 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold truncate text-foreground">
                    {product.title}
                  </h3>
                  <p className="text-xs font-bold text-primary mt-0.5">
                    ฿{product.price?.toLocaleString()}
                  </p>
                  <p className={`mt-1 text-[10px] font-semibold ${product.moderation_status === "approved" ? "text-emerald-600" : product.moderation_status === "rejected" ? "text-destructive" : "text-amber-600"}`}>
                    {product.moderation_status === "approved" ? "อนุมัติแล้ว · แสดงบนหน้าร้าน" : product.moderation_status === "rejected" ? `ไม่อนุมัติ${product.moderation_note ? `: ${product.moderation_note}` : ""}` : "รอแอดมินตรวจสอบ"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}