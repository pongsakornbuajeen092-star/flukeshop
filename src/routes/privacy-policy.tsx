import { createFileRoute } from "@tanstack/react-router";
import { AppShell, TopBar } from "@/components/AppShell";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [{ title: "นโยบายความเป็นส่วนตัว | Flukeshop" }],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <AppShell header={<TopBar title="นโยบายความเป็นส่วนตัว" />}>
      <div className="p-4 space-y-4 text-xs text-muted-foreground leading-relaxed pb-20">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <ShieldCheck className="size-5 text-primary" />
          <span>นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูล</span>
        </div>
        <p>
          ยินดีต้อนรับสู่ "Flukeshop" เราให้ความสำคัญอย่างยิ่งต่อการคุ้มครองข้อมูลส่วนบุคคลของคุณ
          และปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </p>

        <h4 className="font-bold text-foreground mt-3">1. ข้อมูลที่เราจัดเก็บ</h4>
        <p>
          เราเก็บรวบรวมข้อมูลที่จำเป็น เช่น อีเมล, ชื่อ-นามสกุล, ที่อยู่ในการจัดส่ง และเบอร์โทรศัพท์ เพื่อใช้ในการประมวลผลคำสั่งซื้อ
        </p>

        <h4 className="font-bold text-foreground mt-3">2. การใช้ข้อมูลของคุณ</h4>
        <p>
          ข้อมูลของคุณจะถูกใช้เฉพาะสำหรับการจัดส่งสินค้า การติดต่อสอบถามเรื่องคำสั่งซื้อ และแจ้งข้อมูลข่าวสารที่คุณยินยอมรับเท่านั้น
        </p>

        <h4 className="font-bold text-foreground mt-3">3. ความปลอดภัยของข้อมูล</h4>
        <p>
          เราใช้ระบบรักษาความปลอดภัยระดับมาตรฐานผ่านระบบ Supabase Encryption และจะไม่มีการขายหรือเผยแพร่ข้อมูลของคุณแก่บุคคลภายนอก
        </p>
      </div>
    </AppShell>
  );
}