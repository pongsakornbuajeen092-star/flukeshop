import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppShell, TopBar } from "@/components/AppShell";
import {
  Package,
  LogOut,
  ChevronRight,
  User as UserIcon,
  Loader2,
  MapPin,
  CreditCard,
  Heart,
  HelpCircle,
  ShieldCheck,
  Truck,
  Wallet,
  Clock,
  Star,
  Bell,
  ClipboardList,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "บัญชีของฉัน | Flukeshop" },
      { name: "description", content: "จัดการข้อมูลส่วนตัวและคำสั่งซื้อ" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase.rpc("is_flukeshop_admin").then(({ data, error }) => {
      setIsAdmin(!error && data === true);
    });
  }, [user]);

  if (loading) {
    return (
      <AppShell header={<TopBar title="บัญชีของฉัน" />}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell header={<TopBar title="บัญชีของฉัน" />}>
        <div className="p-8 text-center space-y-4">
          <UserIcon className="size-16 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">กรุณาเข้าสู่ระบบเพื่อใช้งานหน้าบัญชี</p>
          <Link
            to="/login"
            className="inline-block bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-full text-sm shadow-md"
          >
            เข้าสู่ระบบ / สมัครสมาชิก
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell header={<TopBar title="บัญชีของฉัน" />}>
      <div className="p-4 space-y-4 pb-24">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-card shadow-card">
          <div className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-xl shadow-md">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold truncate">{user.email}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">สมาชิกทั่วไป</p>
            <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">
              ID: {user.id.slice(0, 12)}...
            </p>
          </div>
        </div>

        {/* Order Status Tracker Quick Shortcuts */}
        <div className="rounded-2xl bg-card p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">การสั่งซื้อของฉัน</span>
            <Link to="/orders" className="text-xs text-primary font-medium flex items-center">
              ดูประวัติการสั่งซื้อทั้งหมด <ChevronRight className="size-3.5 ml-0.5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <Link to="/orders" search={{ status: "unpaid" }} className="flex flex-col items-center gap-1.5 p-1 rounded-lg hover:bg-secondary transition-colors">
              <Wallet className="size-5 text-amber-500" />
              <span className="text-[11px] text-muted-foreground">ที่ต้องชำระ</span>
            </Link>
            <Link to="/orders" search={{ status: "shipping" }} className="flex flex-col items-center gap-1.5 p-1 rounded-lg hover:bg-secondary transition-colors">
              <Clock className="size-5 text-blue-500" />
              <span className="text-[11px] text-muted-foreground">ที่ต้องจัดส่ง</span>
            </Link>
            <Link to="/orders" search={{ status: "delivering" }} className="flex flex-col items-center gap-1.5 p-1 rounded-lg hover:bg-secondary transition-colors">
              <Truck className="size-5 text-primary" />
              <span className="text-[11px] text-muted-foreground">ที่ต้องได้รับ</span>
            </Link>
            <Link to="/orders" search={{ status: "completed" }} className="flex flex-col items-center gap-1.5 p-1 rounded-lg hover:bg-secondary transition-colors">
              <Star className="size-5 text-yellow-500" />
              <span className="text-[11px] text-muted-foreground">ให้คะแนน</span>
            </Link>
          </div>
        </div>

        {/* Personal Details Section */}
        <div className="rounded-2xl bg-card p-2 shadow-card space-y-0.5">
          <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            ข้อมูลและการตั้งค่า
          </div>
          
          {/* เพิ่มเมนูสินค้าของฉันตรงนี้ */}
          <Link to="/my-products" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <Package className="size-5 text-primary" />
              <span className="text-xs font-medium">สินค้าของฉัน</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          {isAdmin && (
            <Link to="/admin" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
              <div className="flex items-center gap-3">
                <ClipboardList className="size-5 text-primary" />
                <span className="text-xs font-medium">ตรวจสอบสินค้าก่อนเผยแพร่</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          )}

          <Link to="/addresses" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-primary" />
              <span className="text-xs font-medium">ที่อยู่ในการจัดส่ง</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <Link to="/payment-methods" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-primary" />
              <span className="text-xs font-medium">บัญชีธนาคาร / บัตรเครดิต</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <Link to="/wishlist" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <Heart className="size-5 text-primary" />
              <span className="text-xs font-medium">สินค้าที่ถูกใจ (Wishlist)</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <Link to="/notifications" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="size-5 text-primary" />
              <span className="text-xs font-medium">การแจ้งเตือน</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Support & Security */}
        <div className="rounded-2xl bg-card p-2 shadow-card space-y-0.5">
          <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            ช่วยเหลือและเกี่ยวกับแอป
          </div>

          <Link to="/help" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <HelpCircle className="size-5 text-muted-foreground" />
              <span className="text-xs font-medium">ศูนย์ช่วยเหลือ / คำถามที่พบบ่อย</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <Link to="/privacy-policy" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-muted-foreground" />
              <span className="text-xs font-medium">นโยบายความเป็นส่วนตัว</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Logout Button */}
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-destructive/10 hover:bg-destructive/15 text-destructive font-bold text-xs transition-colors mt-2"
        >
          <LogOut className="size-4" /> ออกจากระบบ
        </button>
      </div>
    </AppShell>
  );
}