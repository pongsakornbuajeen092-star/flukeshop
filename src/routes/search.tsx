import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search as SearchIcon, Store, Loader2, PackageX } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  description?: string;
  seller_id?: string;
}

interface StoreItem {
  id: string;
  email: string;
  store_name?: string;
  avatar_url?: string;
}

function SearchPage() {
  const [tab, setTab] = useState<"all" | "stores" | "used">("all");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      if (tab === "stores") {
        // ดึงข้อมูลร้านค้า/ผู้ขายจาก Supabase
        const { data, error } = await supabase
          .from("profiles")
          .select("*");

        if (!error && data && data.length > 0) {
          setStores(data);
        } else {
          // หากยังไม่ได้ทำตาราง profiles ให้ดึง seller_id ที่มีอยู่ออกมาแสดงเป็นร้านค้าจำลอง
          const { data: pData } = await supabase
            .from("products")
            .select("seller_id")
            .eq("moderation_status", "approved");
          if (pData) {
            const uniqueSellers = Array.from(new Set(pData.map((p) => p.seller_id))).filter(Boolean);
            setStores(
              uniqueSellers.map((id, index) => ({
                id: id as string,
                email: `seller_${index + 1}@shop.com`,
                store_name: `ร้านค้าผู้ขาย #${index + 1}`,
              }))
            );
          }
        }
      } else {
        // ดึงรายการสินค้า
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("moderation_status", "approved")
          .order("created_at", { ascending: false });

        if (!error && data) {
          let filtered = data;

          // กรองคำค้นหา
          if (query.trim()) {
            filtered = filtered.filter((p) =>
              p.title.toLowerCase().includes(query.toLowerCase())
            );
          }

          // กรองสินค้ามือสอง
          if (tab === "used") {
            filtered = filtered.filter(
              (p) =>
                p.title.includes("มือสอง") ||
                p.description?.includes("มือสอง")
            );
          }

          setProducts(filtered);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [tab, query]);

  return (
    <AppShell>
      <div className="max-w-md mx-auto p-4 space-y-4 pb-20">
        {/* ช่องค้นหา */}
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-muted/50 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* แถบเลือกประเภท */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              tab === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setTab("stores")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              tab === "stores"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            ร้านค้า
          </button>
          <button
            onClick={() => setTab("used")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              tab === "used"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            สินค้ามือสอง
          </button>
        </div>

        {/* แสดงผลรายการ */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : tab === "stores" ? (
          /* รายการร้านค้าจริง */
          stores.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              ไม่พบร้านค้าในระบบ
            </div>
          ) : (
            <div className="space-y-2.5">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="p-3.5 bg-card rounded-2xl border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      <Store className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        {store.store_name || "ร้านค้าสมาชิก"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {store.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/store/$id"
                    params={{ id: store.id }}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                  >
                    เข้าสู่ร้านค้า
                  </Link>
                </div>
              ))}
            </div>
          )
        ) : (
          /* รายการสินค้า */
          products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <PackageX className="size-10 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-muted-foreground">
                ไม่พบสินค้าที่คุณค้นหา
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to="/product/$id"
                  params={{ id: product.id }}
                  className="p-2.5 bg-card rounded-2xl border border-border flex items-center gap-3 hover:shadow-sm transition-all"
                >
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="size-20 rounded-xl object-cover bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-foreground line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-xs font-extrabold text-primary mt-1">
                      ฿ {product.price.toLocaleString("th-TH")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}