import { createFileRoute } from "@tanstack/react-router";
import { AppShell, TopBar } from "@/components/AppShell";
import { HelpCircle, ChevronDown, MessageSquare, Phone } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "ศูนย์ช่วยเหลือ | Flukeshop" }] }),
  component: HelpPage,
});

function HelpPage() {
  const [openId, setOpenId] = useState<number | null>(1);

  const faqs = [
    {
      id: 1,
      q: "การจัดส่งสินค้าใช้เวลากี่วัน?",
      a: "ปกติใช้เวลาจัดส่ง 1-3 วันทำการสำหรับกรุงเทพฯ และปริมณฑล และ 2-4 วันสำหรับต่างจังหวัด",
    },
    {
      id: 2,
      q: "สามารถขอคืนเงินหรือคืนสินค้าได้หรือไม่?",
      a: "สามารถทำได้ภายใน 7 วันหลังจากได้รับสินค้า ในกรณีสินค้าชำรุดหรือไม่ตรงตามรายละเอียด",
    },
    {
      id: 3,
      q: "ชำระเงินทางไหนได้บ้าง?",
      a: "รองรับการชำระเงินปลายทาง (COD), สแกน QR PromptPay และบัตรเครดิต/เดบิต",
    },
  ];

  return (
    <AppShell header={<TopBar title="ศูนย์ช่วยเหลือ" />}>
      <div className="p-4 space-y-4">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary flex items-center gap-3">
          <HelpCircle className="size-8 shrink-0" />
          <div>
            <h3 className="text-sm font-bold">มีข้อสงสัยหรือต้องการความช่วยเหลือ?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">ทีมงานพร้อมดูแลคุณตลอด 24 ชั่วโมง</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground px-1">คำถามที่พบบ่อย (FAQ)</h4>
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-card rounded-2xl shadow-card overflow-hidden">
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full p-4 flex justify-between items-center text-xs font-bold text-left"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${openId === faq.id ? "rotate-180" : ""}`} />
              </button>
              {openId === faq.id && (
                <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-2 grid grid-cols-2 gap-3">
          <button className="p-3 bg-card rounded-2xl shadow-card flex items-center justify-center gap-2 text-xs font-bold text-primary">
            <MessageSquare className="size-4" /> แชทกับเรา
          </button>
          <button className="p-3 bg-card rounded-2xl shadow-card flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground">
            <Phone className="size-4" /> โทรหาคอลเซ็นเตอร์
          </button>
        </div>
      </div>
    </AppShell>
  );
}