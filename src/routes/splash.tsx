
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/splash")({
  head: () => ({
    meta: [
      { title: "เริ่มช้อปปิ้ง | Flukeshop" },
      { name: "description", content: "เปิดแอป Flukeshop ช้อปอย่างมั่นใจ สินค้าผ่านการตรวจสอบก่อนเผยแพร่" },
      { property: "og:title", content: "เริ่มช้อปปิ้ง | Flukeshop" },
      { property: "og:description", content: "ของแท้ ราคาดี ส่งไว ถึงมือคุณ" },
    ],
  }),
  component: Splash,
});

function Splash() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-between bg-primary-soft px-6 text-center">
      <div className="safe-top" />
      <div className="page-fade flex flex-1 flex-col items-center justify-center gap-6">
        <div className="grid size-28 place-items-center rounded-3xl bg-primary shadow-card">
          <ShoppingCart className="size-14 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-primary">Flukeshop</h1>
          <p className="text-sm text-muted-foreground">ของแท้ ราคาดี ส่งไว ถึงมือคุณ</p>
        </div>
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          <span className="size-2 rounded-full bg-primary/30" />
          <span className="size-2 rounded-full bg-primary/30" />
        </div>
      </div>
      <div className="w-full max-w-sm pb-8">
        <Link
          to="/"
          className="flex min-h-13 w-full items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-card active:scale-[0.98]"
        >
          เริ่มช้อปเลย
        </Link>
        <div className="safe-bottom" />
      </div>
    </div>
  );
}

