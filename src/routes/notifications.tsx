import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Tag, ShieldAlert } from "lucide-react";
import { AppShell, TopBar } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!user) return;

    // 1. ดึงข้อมูลแจ้งเตือนเดิมจากฐานข้อมูล
    async function fetchNotifications() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setNotifications(data);
      }
    }

    fetchNotifications();

    // 2. ตั้งค่า Realtime ฟังการเปลี่ยนแปลง (INSERT แจ้งเตือนใหม่ๆ)
    const channel = supabase
      .channel(`realtime-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNoti = payload.new as NotificationItem;
          setNotifications((prev) => [newNoti, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ฟังก์ชันกดคลิกเพื่อเปลี่ยนสถานะเป็นอ่านแล้ว และพาไปหน้าประวัติการสั่งซื้อ
  const handleNotificationClick = async (item: NotificationItem) => {
    // เปลี่ยนสถานะใน UI ทันที
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
    );
    
    // อัปเดตสถานะในฐานข้อมูล
    await supabase.from("notifications").update({ is_read: true }).eq("id", item.id);

    // ถ้าเป็นการแจ้งเตือนเกี่ยวกับคำสั่งซื้อ ให้พาไปหน้า /orders
    if (item.type === "order") {
      navigate({ to: "/orders" });
    }
  };

  return (
    <AppShell header={<TopBar title="การแจ้งเตือน" />}>
      {notifications.length === 0 ? (
        <div className="p-16 text-center text-sm text-muted-foreground">
          ยังไม่มีการแจ้งเตือนในขณะนี้
        </div>
      ) : (
        <ul className="space-y-2 p-3">
          {notifications.map((item) => (
            <li
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`flex gap-3 rounded-xl bg-card p-4 shadow-card transition-all cursor-pointer hover:bg-secondary/50 ${
                !item.is_read ? "border-l-4 border-primary bg-primary/5" : ""
              }`}
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                {item.type === "order" ? (
                  <Package className="size-5" />
                ) : item.type === "promotion" ? (
                  <Tag className="size-5" />
                ) : (
                  <ShieldAlert className="size-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{item.title}</p>
                  {!item.is_read && <span className="size-2 rounded-full bg-primary" />}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p>
                <span className="mt-2 block text-[10px] text-muted-foreground">
                  {new Date(item.created_at).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}