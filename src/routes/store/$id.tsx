import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, TopBar } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Store, Loader2, PackageX } from "lucide-react";

export const Route = createFileRoute("/store/$id")({
  component: StorePage,
});

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  seller_id?: string;
}

interface StoreProfile {
  id: string;
  email?: string;
  store_name?: string;
  avatar_url?: string;
}

function StorePage() {
  const { id } = Route.useParams();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStoreData() {
      setLoading(true);

      // 1. ดึงข้อมูล Profile ร้านค้า
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileData) {
        setStore(profileData);
      } else {
        setStore({
          id,
          email: "seller@shop.com",
          store_name: `ร้านค้าผู้ขาย`,
        });
      }

      // 2. ดึงสินค้าทั้งหมดที่เป็นของ seller_id นี้
      const { data: productData } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", id)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      if (productData) {
        setProducts(productData);
      }

      setLoading(false);
    }

    fetchStoreData();
  }, [id]);

  return (
    <AppShell header={<TopBar title="ร้านค้า" />}>
      <div className="max-w-md mx-auto p-4 space-y-4 pb-20">
        {/* หัวข้อโปรไฟล์ร้านค้า */}
        <div className="p-4 bg-card rounded-2xl border border-border flex items-center gap-3 shadow-sm">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Store className="size-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {store?.store_name || "หน้าร้านค้า"}
            </h2>
            <p className="text-xs text-muted-foreground">{store?.email}</p>
          </div>
        </div>

        {/* ส่วนแสดงสินค้าของร้านค้า */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground">
            สินค้าทั้งหมดของร้าน ({products.length})
          </h3>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
              <PackageX className="size-10 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-muted-foreground">
                ร้านค้านี้ยังไม่มีสินค้าวางจำหน่าย
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to="/product/$id"
                  params={{ id: product.id }}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full aspect-square object-cover bg-muted"
                    />
                    <div className="p-2 space-y-1">
                      <h4 className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight">
                        {product.title}
                      </h4>
                    </div>
                  </div>
                  <div className="p-2 pt-0">
                    <p className="text-xs font-bold text-primary">
                      ฿ {product.price.toLocaleString("th-TH")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}