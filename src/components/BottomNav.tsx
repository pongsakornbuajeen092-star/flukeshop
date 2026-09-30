import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, Search, ShoppingCart, MessageCircle, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const items = [
  { to: "/", label: "หน้าหลัก", icon: Home, exact: true },
  { to: "/categories", label: "หมวดหมู่", icon: LayoutGrid },
  { to: "/search", label: "ค้นหา", icon: Search },
  { to: "/cart", label: "ตระกร้า", icon: ShoppingCart, badgeKey: "cart" },
  { to: "/chat", label: "ข้อความ", icon: MessageCircle, badgeKey: "chat" },
  { to: "/profile", label: "บัญชี", icon: User },
] as const;

export default function BottomNav() {
  const { count } = useCart();
  const { user } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadChatCount(0);
      return;
    }

    // 1. ดึงจำนวนข้อความที่ยังไม่ได้อ่านเฉพาะของ user ที่ล็อกอินอยู่
    async function fetchUnreadCount() {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id) // กรองเฉพาะข้อความที่ส่งมาหา user นี้
        .eq("is_read", false);

      if (!error && count !== null) {
        setUnreadChatCount(count);
      } else {
        setUnreadChatCount(0);
      }
    }

    fetchUnreadCount();

    // 2. Realtime คอยฟังเมื่อมีข้อความใหม่ส่งมาหา user นี้โดยเฉพาะ
    const channel = supabase
      .channel(`bottom-nav-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`, // กรองเฉพาะที่ receiver_id ตรงกับ user ปัจจุบัน
        },
        (payload) => {
          if (payload.new.is_read === false) {
            setUnreadChatCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card shadow-nav">
      <div className="mx-auto flex max-w-lg items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          
          let badge = 0;
          if ("badgeKey" in item) {
            if (item.badgeKey === "cart") badge = count;
            if (item.badgeKey === "chat") badge = unreadChatCount;
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: "exact" in item ? item.exact : false }}
              className="group relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <span className="relative">
                <Icon className="size-6" strokeWidth={2} />
                {!!badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground">
                    {badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="safe-bottom" />
    </nav>
  );
}