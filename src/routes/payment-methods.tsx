import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Plus, Trash2, CreditCard, QrCode, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/payment-methods")({
  component: PaymentMethodsPage,
});

interface PaymentCard {
  id: string;
  card_holder_name: string;
  card_number_last4: string;
  expiry_date: string;
  brand: string;
  is_default?: boolean;
}

function PaymentMethodsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cardHolderName: "",
    cardNumber: "",
    expiryDate: "",
  });

  const fetchCards = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment methods:", error);
    } else {
      setCards(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  const handleDeleteCard = async (id: string) => {
    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting card:", error);
    } else {
      setCards((prev) => prev.filter((card) => card.id !== id));
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.cardNumber || !formData.cardHolderName || !formData.expiryDate) return;

    setIsSubmitting(true);
    const rawCardNum = formData.cardNumber.replace(/\s+/g, "");
    const last4 = rawCardNum.slice(-4) || "0000";

    const newCard = {
      user_id: user.id,
      card_holder_name: formData.cardHolderName,
      card_number_last4: last4,
      expiry_date: formData.expiryDate,
      brand: "VISA / Mastercard",
      is_default: cards.length === 0,
    };

    const { data, error } = await supabase
      .from("payment_methods")
      .insert([newCard])
      .select()
      .single();

    if (error) {
      console.error("Error adding card:", error);
    } else if (data) {
      setCards((prev) => [data, ...prev]);
      setFormData({ cardHolderName: "", cardNumber: "", expiryDate: "" });
      setIsOpen(false);
    }
    setIsSubmitting(false);
  };

  return (
    <AppShell title="บัญชีธนาคาร / บัตรเครดิต">
      <div className="p-4 space-y-4 pb-24">
        {/* รายการบัตรเครดิต/เดบิต */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          cards.map((card) => (
            <div
              key={card.id}
              className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{card.brand}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    •••• •••• •••• {card.card_number_last4}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {card.is_default && (
                  <CheckCircle2 className="size-5 text-primary" />
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* ตัวเลือก PromptPay (แสดงสถานะปกติ) */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <QrCode className="size-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">PromptPay / สแกน QR</p>
              <p className="text-xs text-muted-foreground">พร้อมใช้งานในหน้าชำระเงินสั่งซื้อ</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground bg-accent px-2.5 py-1 rounded-full font-medium">
            เปิดใช้งาน
          </span>
        </div>

        {/* ปุ่มผูกบัตรใหม่ */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="w-full py-3 border-2 border-dashed border-primary/40 rounded-2xl text-primary font-medium text-xs flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
              <Plus className="size-4" /> ผูกบัตรเครดิต/เดบิต เพิ่มเติม
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-xs sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-5 text-primary" /> ผูกบัตรเครดิต/เดบิต
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCard} className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label className="text-xs">ชื่อบนบัตร</Label>
                <Input
                  required
                  placeholder="SOMCHAI JAIDEE"
                  value={formData.cardHolderName}
                  onChange={(e) =>
                    setFormData({ ...formData, cardHolderName: e.target.value })
                  }
                  className="text-xs uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">หมายเลขบัตร</Label>
                <Input
                  required
                  maxLength={19}
                  placeholder="4111 2222 3333 4444"
                  value={formData.cardNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, cardNumber: e.target.value })
                  }
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">วันหมดอายุ (MM/YY)</Label>
                <Input
                  required
                  maxLength={5}
                  placeholder="12/28"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 text-xs"
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-1/2 text-xs">
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "บันทึกบัตร"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}