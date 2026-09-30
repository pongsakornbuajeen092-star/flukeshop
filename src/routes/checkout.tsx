import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { baht } from "@/lib/shop-data";
import { TopBar } from "@/components/AppShell";
import { MapPin, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { RealPromptPayQR } from "@/components/RealPromptPayQR";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

interface Address {
  id: string;
  name: string;
  phone: string;
  address_detail: string;
  province: string;
  district: string;
  sub_district: string;
  postal_code: string;
  is_default?: boolean;
}

function CheckoutPage() {
  const { user } = useAuth();
  const { items, selectedTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"promptpay" | "cod">("promptpay");
  const [showQR, setShowQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (data && data.length > 0) {
        setAddress(data[0]);
      }
    };
    fetchAddress();
  }, [user]);

  const selectedItems = items.filter((item) => item.selected);
  const discount = selectedTotal > 0 ? 500 : 0;
  const shipping = selectedTotal >= 1000 || selectedTotal === 0 ? 0 : 35;
  const grandTotal = Math.max(0, selectedTotal - discount + shipping);

  // ฟังก์ชันบันทึกออเดอร์และสร้างแจ้งเตือนลง Supabase
  const saveOrderToDatabase = async () => {
    if (!user || selectedItems.length === 0) return;
    setIsSubmitting(true);

    const productIds = selectedItems.map(({ product }) => product.id);
    const { data: approvedProducts, error: moderationError } = await supabase
      .from("products")
      .select("id")
      .in("id", productIds)
      .eq("moderation_status", "approved");
    if (moderationError || approvedProducts?.length !== productIds.length) {
      setIsSubmitting(false);
      setShowQR(false);
      alert("มีสินค้าบางรายการไม่ผ่านการตรวจสอบหรือไม่พร้อมจำหน่าย กรุณาตรวจสอบตะกร้าของคุณ");
      return;
    }

    const orderCode = "#" + Math.floor(100000000 + Math.random() * 900000000);

    const newOrder = {
      user_id: user.id,
      order_code: orderCode,
      total_amount: grandTotal,
      payment_method: paymentMethod === "promptpay" ? "QR PromptPay" : "ชำระเงินปลายทาง (COD)",
      items: selectedItems,
      shipping_address: address || {},
      status: "กำลังจัดส่ง",
    };

    const { error } = await supabase.from("orders").insert([newOrder]);

    if (error) {
      setIsSubmitting(false);
      console.error("Error saving order:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ");
      return;
    }

    // เพิ่มข้อมูลการแจ้งเตือนอัตโนมัติหลังจากสั่งซื้อสำเร็จ
    await supabase.from("notifications").insert([
      {
        user_id: user.id,
        title: "พัสดุของคุณกำลังจัดส่ง",
        message: `คำสั่งซื้อ ${orderCode} อยู่ระหว่างการขนส่ง`,
        type: "order",
        is_read: false,
      },
    ]);

    setIsSubmitting(false);
    setShowQR(false);
    clearCart?.();
    navigate({ to: "/orders" });
  };

  const handleConfirmOrder = async () => {
    if (selectedItems.length === 0) return;

    setIsSubmitting(true);
    const productIds = selectedItems.map(({ product }) => product.id);
    const { data: approvedProducts, error } = await supabase
      .from("products")
      .select("id")
      .in("id", productIds)
      .eq("moderation_status", "approved");
    setIsSubmitting(false);

    if (error || approvedProducts?.length !== productIds.length) {
      alert("มีสินค้าบางรายการยังไม่ผ่านการตรวจสอบหรือไม่พร้อมจำหน่าย กรุณานำออกจากตะกร้าแล้วเลือกสินค้าใหม่");
      return;
    }

    if (paymentMethod === "promptpay") {
      setShowQR(true); // เปิด QR ให้สแกนก่อน
    } else {
      saveOrderToDatabase(); // ถ้าเก็บเงินปลายทาง บันทึกทันที
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 max-w-md mx-auto relative">
      <TopBar title="ยืนยันการสั่งซื้อ" />

      <div className="space-y-3 p-3">
        {/* ที่อยู่จัดส่ง */}
        <div className="rounded-xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between font-bold text-primary text-sm">
            <span className="flex items-center gap-2">
              <MapPin className="size-4" /> ที่อยู่ในการจัดส่ง
            </span>
            <button 
              onClick={() => navigate({ to: "/addresses" })}
              className="text-xs text-muted-foreground font-normal hover:underline"
            >
              เปลี่ยน
            </button>
          </div>
          {address ? (
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {address.name} ({address.phone})<br />
              {address.address_detail} ต.{address.sub_district} อ.{address.district} จ.{address.province} {address.postal_code}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">ยังไม่มีที่อยู่จัดส่ง</p>
          )}
        </div>

        {/* รายการสินค้า */}
        <div className="rounded-xl bg-card p-4 shadow-card space-y-3">
          <h3 className="text-sm font-bold border-b border-border pb-2">
            รายการสินค้าที่เลือก ({selectedItems.length})
          </h3>
          {selectedItems.map(({ product, qty }) => (
            <div key={product.id} className="flex gap-3 items-center text-xs">
              <img src={product.images[0]} alt={product.name} className="size-12 rounded-lg object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-medium">{product.name}</p>
                <p className="text-muted-foreground mt-0.5">จำนวน: {qty}</p>
              </div>
              <span className="font-bold text-primary shrink-0">{baht(product.price * qty)}</span>
            </div>
          ))}
        </div>

        {/* วิธีชำระเงิน */}
        <div className="rounded-xl bg-card p-4 shadow-card space-y-3">
          <div className="flex items-center gap-2 font-bold text-primary text-sm">
            <CreditCard className="size-4" /> วิธีการชำระเงิน
          </div>
          <div className="space-y-2">
            <div 
              onClick={() => setPaymentMethod("promptpay")}
              className={`flex items-center justify-between text-xs p-3 rounded-xl border cursor-pointer ${
                paymentMethod === "promptpay" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <span className="font-medium">ชำระเงินผ่าน QR PromptPay</span>
              {paymentMethod === "promptpay" && <CheckCircle2 className="size-4 text-primary" />}
            </div>
            <div 
              onClick={() => setPaymentMethod("cod")}
              className={`flex items-center justify-between text-xs p-3 rounded-xl border cursor-pointer ${
                paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <span className="font-medium">ชำระเงินปลายทาง (COD)</span>
              {paymentMethod === "cod" && <CheckCircle2 className="size-4 text-primary" />}
            </div>
          </div>
        </div>

        {/* สรุปยอด */}
        <div className="rounded-xl bg-card p-4 shadow-card space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>ราคารวมสินค้า</span><span>{baht(selectedTotal)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>ส่วนลด</span><span className="text-success">-{baht(discount)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>ค่าจัดส่ง</span><span>{baht(shipping)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>ยอดชำระสุทธิ</span>
            <span className="text-primary">{baht(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* ปุ่มกดสั่งซื้อ */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 bg-card border-t border-border shadow-2xl flex items-center justify-between gap-4 z-50">
        <div>
          <p className="text-[11px] text-muted-foreground">ยอดชำระทั้งหมด</p>
          <p className="text-lg font-extrabold text-primary">{baht(grandTotal)}</p>
        </div>
        <button
          disabled={selectedItems.length === 0 || isSubmitting}
          onClick={handleConfirmOrder}
          className="min-h-12 px-6 rounded-full bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {paymentMethod === "promptpay" ? "ชำระเงินผ่าน PromptPay" : "ยืนยันการสั่งซื้อ"}
        </button>
      </div>

      {/* Dialog แสดง QR PromptPay */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-2xl p-4 z-[60]">
          <DialogHeader>
            <DialogTitle className="text-center text-sm font-bold">ชำระเงินผ่าน PromptPay</DialogTitle>
          </DialogHeader>
          <RealPromptPayQR promptPayID="0926922795" amount={grandTotal} />
          <button
            disabled={isSubmitting}
            onClick={saveOrderToDatabase}
            className="w-full mt-3 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            ฉันชำระเงินเรียบร้อยแล้ว
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}