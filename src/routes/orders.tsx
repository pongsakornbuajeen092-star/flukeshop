import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { TopBar } from "@/components/AppShell";
import { baht } from "@/lib/shop-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Loader2, Wallet, Clock, Truck, Star } from "lucide-react";

interface OrdersSearch {
  status?: string;
}

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  validateSearch: (search: Record<string, unknown>): OrdersSearch => {
    return {
      status: (search.status as string) || "all",
    };
  },
});

interface OrderItem {
  id: string;
  order_code: string;
  total_amount: number;
  status: string;
  items: Array<{ product: { name: string }; qty: number }>;
  created_at: string;
}

const tabs = [
  { key: "unpaid", label: "ที่ต้องชำระ", icon: Wallet },
  { key: "shipping", label: "ที่ต้องจัดส่ง", icon: Clock },
  { key: "received", label: "ที่ต้องได้รับ", icon: Truck },
  { key: "rated", label: "ให้คะแนน", icon: Star },
];

function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/orders" }) as OrdersSearch;
  const currentStatus = search.status || "unpaid";

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  // ฟังก์ชันจับคู่สถานะภาษาไทยใน DB กับปุ่ม Tab
  const filterOrders = orders.filter((order) => {
    const s = order.status;
    if (currentStatus === "unpaid") return s === "ที่ต้องชำระ" || s === "ยังไม่ชำระ";
    if (currentStatus === "shipping") return s === "กำลังจัดส่ง" || s === "ที่ต้องจัดส่ง";
    if (currentStatus === "received") return s === "ที่ต้องได้รับ" || s === "จัดส่งสำเร็จ";
    if (currentStatus === "rated") return s === "ให้คะแนน" || s === "สำเร็จ";
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-28 max-w-md mx-auto">
      <TopBar title="ประวัติการสั่งซื้อ" />

      {/* แถบเมนูด้านบน */}
      <div className="flex border-b border-border bg-card sticky top-0 z-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate({ to: "/orders", search: { status: tab.key } })}
              className={`flex-1 flex flex-col items-center py-3 text-[11px] font-medium transition-colors relative ${
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4 mb-1" />
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : filterOrders.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-12">
            ไม่มีรายการในหมวดหมู่นี้
          </p>
        ) : (
          filterOrders.map((order) => (
            <div key={order.id} className="bg-card p-4 rounded-xl shadow-card space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="font-bold font-mono text-primary">{order.order_code}</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {order.status}
                </span>
              </div>
              <div className="text-muted-foreground space-y-1">
                <p>วันที่สั่งซื้อ: {new Date(order.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}</p>
                <p>จำนวน: {order.items?.reduce((acc, i) => acc + i.qty, 0) || 1} รายการ</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border font-bold">
                <span>ยอดรวมสุทธิ</span>
                <span className="text-primary text-sm">{baht(order.total_amount)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}