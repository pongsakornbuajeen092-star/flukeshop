import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Plus, Trash2, Edit3, MapPin, Loader2 } from "lucide-react";
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
import { supabase } from "@/lib/supabase"; // ปรับ path ตามไฟล์ supabase client ของคุณ
import { useAuth } from "@/lib/auth"; // ดึง user_id จาก Auth Context

export const Route = createFileRoute("/addresses")({
  component: AddressesPage,
});

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  zipcode: string;
  is_default?: boolean;
}

function AddressesPage() {
  const { user } = useAuth();
  const [addressList, setAddressList] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    zipcode: "",
  });

  // 1. ดึงข้อมูลที่เอกจาก Supabase
  const fetchAddresses = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching addresses:", error);
    } else {
      setAddressList(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  // 2. ฟังก์ชันลบที่อยู่จาก Supabase
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting address:", error);
    } else {
      setAddressList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // 3. ฟังก์ชันเพิ่มที่อยู่ใหม่ลง Supabase
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name || !formData.phone || !formData.address) return;

    setIsSubmitting(true);
    const newAddress = {
      user_id: user.id,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      zipcode: formData.zipcode,
      is_default: addressList.length === 0,
    };

    const { data, error } = await supabase
      .from("addresses")
      .insert([newAddress])
      .select()
      .single();

    if (error) {
      console.error("Error adding address:", error);
    } else if (data) {
      setAddressList((prev) => [data, ...prev]);
      setFormData({ name: "", phone: "", address: "", zipcode: "" });
      setIsOpen(false);
    }
    setIsSubmitting(false);
  };

  return (
    <AppShell title="ที่อยู่ในการจัดส่ง">
      <div className="p-4 space-y-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : addressList.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">
            ยังไม่มีข้อมูลที่อยู่ในการจัดส่ง
          </p>
        ) : (
          addressList.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3 relative"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({item.phone})
                    </span>
                  </div>
                </div>
                {item.is_default && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    เริ่มต้น
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.address} {item.zipcode}
              </p>

              <div className="flex justify-end items-center gap-3 border-t border-border/50 pt-2 text-xs">
                <button
                  type="button"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit3 className="size-3.5" /> แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1 text-destructive hover:opacity-80 transition-opacity"
                >
                  <Trash2 className="size-3.5" /> ลบ
                </button>
              </div>
            </div>
          ))
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="w-full py-3 border-2 border-dashed border-primary/40 rounded-2xl text-primary font-medium text-xs flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
              <Plus className="size-4" /> เพิ่มที่อยู่ใหม่
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-xs sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-5 text-primary" /> เพิ่มที่อยู่ใหม่
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAddress} className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label className="text-xs">ชื่อ-นามสกุล / ชื่อสถานที่</Label>
                <Input
                  required
                  placeholder="เช่น คุณสมชาย ใจดี (บ้าน)"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">เบอร์โทรศัพท์</Label>
                <Input
                  required
                  placeholder="081-234-5678"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">ที่อยู่โดยละเอียด</Label>
                <Input
                  required
                  placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">รหัสไปรษณีย์</Label>
                <Input
                  required
                  placeholder="10110"
                  value={formData.zipcode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipcode: e.target.value })
                  }
                  className="text-xs"
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
                  {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : "บันทึกที่อยู่"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}