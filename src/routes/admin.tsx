import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, ClipboardCheck, ExternalLink, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, TopBar } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  component: AdminReviewPage,
});

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string;
  description?: string;
  condition?: string;
  category?: string;
  seller_id: string;
  created_at: string;
};

type Evidence = {
  product_id: string;
  evidence_description: string;
  evidence_url: string | null;
  seller_declaration: boolean;
  created_at: string;
};

function AdminReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [evidence, setEvidence] = useState<Record<string, Evidence>>({});
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        setCheckingAccess(false);
        return;
      }
      const { data, error } = await supabase.rpc("is_flukeshop_admin");
      if (!active) return;
      setIsAdmin(!error && data === true);
      setCheckingAccess(false);
    }
    if (!authLoading) checkAdmin();
    return () => { active = false; };
  }, [user, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    async function loadQueue() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id,title,price,image_url,description,condition,category,seller_id,created_at")
        .eq("moderation_status", "pending")
        .order("created_at", { ascending: true });
      if (error) {
        toast.error("โหลดคิวตรวจสอบไม่สำเร็จ: " + error.message);
        setProducts([]);
        setLoading(false);
        return;
      }
      const queue = (data || []) as Product[];
      if (active) setProducts(queue);
      if (queue.length) {
        const { data: evidenceRows, error: evidenceError } = await supabase
          .from("product_review_evidence")
          .select("product_id,evidence_description,evidence_url,seller_declaration,created_at")
          .in("product_id", queue.map((product) => product.id));
        if (active && !evidenceError) {
          setEvidence(Object.fromEntries((evidenceRows || []).map((row) => [row.product_id, row as Evidence])));
        }
      } else if (active) {
        setEvidence({});
      }
      if (active) setLoading(false);
    }
    loadQueue();
    return () => { active = false; };
  }, [isAdmin]);

  const review = async (productId: string, status: "approved" | "rejected") => {
    const note = notes[productId]?.trim() || "";
    if (status === "rejected" && !note) {
      toast.error("กรุณาระบุเหตุผลก่อนปฏิเสธสินค้า");
      return;
    }
    if (!user) return;
    setBusyId(productId);
    const { data, error } = await supabase
      .from("products")
      .update({
        moderation_status: status,
        moderation_note: note || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", productId)
      .eq("moderation_status", "pending")
      .select("id")
      .maybeSingle();
    setBusyId(null);
    if (error || !data) {
      toast.error(error?.message || "รายการนี้ถูกดำเนินการไปแล้ว กรุณาโหลดหน้าใหม่");
      return;
    }
    setProducts((current) => current.filter((product) => product.id !== productId));
    toast.success(status === "approved" ? "อนุมัติสินค้าแล้ว" : "ปฏิเสธสินค้าแล้ว");
  };

  if (authLoading || checkingAccess) {
    return <AppShell header={<TopBar title="ตรวจสอบสินค้า" />}><div className="flex h-64 items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div></AppShell>;
  }

  if (!user || !isAdmin) {
    return (
      <AppShell header={<TopBar title="ตรวจสอบสินค้า" />}>
        <div className="mx-4 mt-8 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <ShieldAlert className="mx-auto size-12 text-amber-500" />
          <h2 className="mt-3 text-base font-bold">หน้านี้สำหรับผู้ดูแลระบบ</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">บัญชีนี้ไม่มีสิทธิ์เข้าถึงคิวตรวจสอบสินค้า</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell header={<TopBar title="ตรวจสอบสินค้าก่อนเผยแพร่" />}>
      <div className="space-y-4 p-4 pb-24">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 font-bold"><ClipboardCheck className="size-5 text-primary" /> คิวรอตรวจสอบ ({products.length})</div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">ตรวจสอบภาพ รายละเอียด และหลักฐานที่ผู้ขายให้ไว้ก่อนอนุมัติ การตรวจด้วยเอกสารไม่สามารถยืนยันความแท้หรือที่มาได้อย่างแน่นอน หากมีข้อสงสัยให้ปฏิเสธหรือขอข้อมูลเพิ่มจากผู้ขาย</p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-card"><BadgeCheck className="mx-auto size-10 text-emerald-600" /><p className="mt-3 text-sm font-semibold">ไม่มีสินค้ารอตรวจสอบ</p></div>
        ) : products.map((product) => {
          const itemEvidence = evidence[product.id];
          return (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="flex gap-3 p-3">
                <img src={product.image_url} alt={product.title} className="size-24 shrink-0 rounded-xl bg-muted object-cover" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold">{product.title}</h2>
                  <p className="mt-1 text-sm font-bold text-primary">฿{Number(product.price).toLocaleString("th-TH")}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">ผู้ขาย: {product.seller_id}</p>
                  <p className="text-[10px] text-muted-foreground">ส่งตรวจ: {new Date(product.created_at).toLocaleString("th-TH")}</p>
                </div>
              </div>
              {product.description && <p className="px-3 pb-3 text-xs leading-relaxed">{product.description}</p>}
              <div className="mx-3 rounded-xl bg-muted/50 p-3 text-xs">
                <p className="font-bold">หลักฐานและคำรับรองผู้ขาย</p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">{itemEvidence?.evidence_description || "ไม่พบหลักฐานประกอบ กรุณาตรวจสอบหรือปฏิเสธ"}</p>
                {itemEvidence?.evidence_url && <a href={itemEvidence.evidence_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-primary">เปิดหลักฐาน <ExternalLink className="size-3" /></a>}
                <p className="mt-2 text-[10px] text-muted-foreground">{itemEvidence?.seller_declaration ? "ผู้ขายรับรองว่ามีสิทธิ์ขายและสินค้าไม่ได้มาจากการโจรกรรม" : "ไม่มีคำรับรองจากผู้ขาย"}</p>
              </div>
              <div className="space-y-2 p-3">
                <textarea
                  value={notes[product.id] || ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [product.id]: event.target.value }))}
                  placeholder="หมายเหตุถึงผู้ขาย (จำเป็นเมื่อปฏิเสธ)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={busyId === product.id} onClick={() => review(product.id, "approved")} className="flex h-10 items-center justify-center gap-1 rounded-full bg-emerald-600 text-xs font-bold text-white disabled:opacity-50"><BadgeCheck className="size-4" /> อนุมัติและเผยแพร่</button>
                  <button disabled={busyId === product.id} onClick={() => review(product.id, "rejected")} className="flex h-10 items-center justify-center gap-1 rounded-full bg-destructive text-xs font-bold text-destructive-foreground disabled:opacity-50"><X className="size-4" /> ปฏิเสธ</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
