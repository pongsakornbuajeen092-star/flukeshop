import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, TopBar } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Loader2, PackageX } from "lucide-react";

export const Route = createFileRoute("/categories")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      cat: (search.cat as string) || "mobile",
    };
  },
  component: CategoriesPage,
});

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  description?: string;
  category?: string;
  created_at?: string;
}

const CATEGORIES = [
  { id: "mobile", name: "มือถือ & แท็บเล็ต", keywords: ["โฟน", "มือถือ", "แท็บเล็ต", "phone", "ipad"] },
  { id: "fashion", name: "แฟชั่น", keywords: ["รองเท้า", "เสื้อ", "กางเกง", "กระเป๋า", "แฟชั่น"] },
  { id: "electronics", name: "เครื่องใช้ไฟฟ้า", keywords: ["หม้อ", "ตู้เย็น", "พัดลม", "ทีวี", "หูฟัง", "คีย์บอร์ด", "แป้นพิมพ์", "keyboard", "เมาส์", "mouse", "จอ", "คอม", "notebook", "laptop"] },
  { id: "beauty", name: "ความงาม & สุขภาพ", keywords: ["ครีม", "น้ำหอม", "ลิป", "สกินแคร์"] },
  { id: "home", name: "กีฬา & แอคทิวิตี้", keywords: ["วิ่ง", "จักรยาน", "บอล", "ออกกำลัง", "แบด", "ไม้แบด", "badminton", "racket"] },
  { id: "mom_kids", name: "แม่และเด็ก", keywords: ["นม", "ผ้าอ้อม", "คาร์ซีท"] },
  { id: "toys", name: "ของเล่น & สินค้าเด็ก", keywords: ["ของเล่น", "โมเดล", "การ์ด"] },
  { id: "motors", name: "ยานยนต์ & อุปกรณ์", keywords: ["หมวกกันน็อค", "ยาง", "น้ำมันเครื่อง", "รถ"] },
];

function CategoriesPage() {
  const searchParams = Route.useSearch();
  const [activeCategory, setActiveCategory] = useState(searchParams.cat || "mobile");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.cat) {
      setActiveCategory(searchParams.cat);
    }
  }, [searchParams.cat]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);

      // ดึงสินค้าทั้งหมดเรียงตามลำดับล่าสุด
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const currentCat = CATEGORIES.find((c) => c.id === activeCategory);

        const filtered = data.filter((item) => {
          // 1. ถ้า item มี category ตรงกับที่เลือก ให้แสดงทันที
          if (item.category && item.category === activeCategory) {
            return true;
          }

          // 2. เผื่อกรณีข้อมูลเก่าใน Supabase ไม่มี category ให้ใช้ Keyword ช่วยค้นหาจากชื่อหรือรายละเอียด
          if (currentCat && !item.category) {
            const title = item.title?.toLowerCase() || "";
            const desc = item.description?.toLowerCase() || "";
            return currentCat.keywords.some(
              (kw) => title.includes(kw) || desc.includes(kw)
            );
          }

          return false;
        });

        setProducts(filtered);
      } else {
        setProducts([]);
      }

      setLoading(false);
    }

    fetchProducts();
  }, [activeCategory]);

  return (
    <AppShell header={<TopBar title="หมวดหมู่" />}>
      <div className="flex h-[calc(100vh-110px)] max-w-md mx-auto bg-background">
        {/* เมนูเลือกหมวดหมู่ด้านซ้าย */}
        <aside className="w-28 shrink-0 bg-muted/30 border-r border-border overflow-y-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full p-3 text-left text-xs font-semibold transition-all border-l-2 ${
                activeCategory === cat.id
                  ? "bg-card text-primary border-primary font-bold shadow-sm"
                  : "border-transparent text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </aside>

        {/* พื้นที่แสดงรายการสินค้าด้านขวา */}
        <main className="flex-1 overflow-y-auto p-3 pb-20">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <PackageX className="size-10 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-muted-foreground">
                ไม่พบสินค้าในหมวดหมู่นี้
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
                      <h3 className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight">
                        {product.title}
                      </h3>
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
        </main>
      </div>
    </AppShell>
  );
}