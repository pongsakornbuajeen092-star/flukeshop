import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Bell,
  Smartphone,
  Shirt,
  Tv,
  Sofa,
  Sparkles,
  Dumbbell,
  Baby,
  Car,
  ChevronRight,
  PlusCircle,
  Loader2,
  PackageX,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/lib/shop-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const banner = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200";

export const Route = createFileRoute("/")({
  component: Home,
});

const iconMap = { Smartphone, Shirt, Tv, Sofa, Sparkles, Dumbbell, Baby, Car };

const banners = [
  { title: "Flukeshop", sub: "ช้อปอย่างมั่นใจ สินค้าผ่านการตรวจสอบก่อนเผยแพร่" },
  { title: "ลดสูงสุด 50%", sub: "เฉพาะสัปดาห์นี้เท่านั้น" },
  { title: "สินค้ามือสองคัดสภาพ", sub: "ตรวจเช็คทุกชิ้นก่อนส่ง" },
];

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  description?: string;
  seller_id?: string;
  created_at?: string;
}

function Home() {
  const [slide, setSlide] = useState(0);
  const { user } = useAuth();
  const [hasNotification, setHasNotification] = useState(false);
  const [realProducts, setRealProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // เช็คการแจ้งเตือน
  useEffect(() => {
    if (!user) return;

    async function checkNotifications() {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (!error && count && count > 0) {
        setHasNotification(true);
      } else {
        setHasNotification(false);
      }
    }

    checkNotifications();
  }, [user]);

  // ดึงข้อมูลสินค้าจริงจาก Supabase
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRealProducts(data);
      }
      setLoading(false);
    }

    fetchProducts();
  }, []);

  return (
    <AppShell
      header={
        <header className="safe-top sticky top-0 z-40 bg-card shadow-card">
          <div className="flex items-center gap-2 px-3 py-3">
            <SearchBar />
            <Link
              to="/create-product"
              aria-label="ลงขายสินค้า"
              className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-full text-xs font-bold shrink-0 shadow hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="size-4" />
              <span>ขายสินค้า</span>
            </Link>
            <Link
              to="/notifications"
              aria-label="การแจ้งเตือน"
              className="relative grid size-11 shrink-0 place-items-center rounded-full active:bg-secondary"
            >
              <Bell className="size-6" />
              {hasNotification && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
              )}
            </Link>
          </div>
        </header>
      }
    >
      <section className="px-3 pt-3">
        <div className="relative overflow-hidden rounded-2xl shadow-card">
          <img
            src={banner}
            alt="โปรโมชันช้อปปิ้งออนไลน์"
            width={1024}
            height={512}
            className="h-40 w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-center gap-2 p-5 bg-black/20">
            <h2 className="text-2xl font-extrabold text-white drop-shadow">
              {banners[slide].title}
            </h2>
            <p className="text-sm font-medium text-white/90">{banners[slide].sub}</p>
            <Link
              to="/search"
              className="w-fit rounded-full bg-card px-4 py-1.5 text-xs font-bold text-primary shadow"
            >
              ช้อปเลย →
            </Link>
          </div>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                aria-label={`สไลด์ ${i + 1}`}
                onClick={() => setSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  i === slide ? "w-5 bg-card" : "w-2 bg-card/60"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 px-3">
        <div className="grid grid-cols-4 gap-2 rounded-2xl bg-card p-3 shadow-card">
          {categories.map((c) => {
            const Icon = iconMap[c.icon as keyof typeof iconMap];
            return (
              <Link
                key={c.id}
                to="/categories"
                className="flex min-h-20 flex-col items-center gap-1.5 rounded-xl p-1 text-center active:bg-secondary"
              >
                <span className="grid size-11 place-items-center rounded-full bg-primary-soft">
                  {Icon && <Icon className="size-5 text-primary" />}
                </span>
                <span className="text-[10px] leading-tight text-muted-foreground">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-5 px-3 pb-20">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold">สินค้าแนะนำ</h2>
          <Link to="/search" className="flex items-center text-xs font-medium text-primary">
            ดูทั้งหมด <ChevronRight className="size-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : realProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <PackageX className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground font-medium">ไม่พบสินค้าในระบบ</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {realProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}