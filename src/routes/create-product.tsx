import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/create-product")({
  component: CreateProductPage,
});

function CreateProductPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sellerName, setSellerName] = useState("");
  const [phone, setPhone] = useState("");
  const [lineId, setLineId] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<"new" | "used">("new");
  const [category, setCategory] = useState("mobile");
  const [description, setDescription] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [sellerDeclaration, setSellerDeclaration] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const categoriesList = [
    { id: "mobile", name: "มือถือ & แท็บเล็ต" },
    { id: "fashion", name: "แฟชั่น" },
    { id: "electronics", name: "เครื่องใช้ไฟฟ้า" },
    { id: "beauty", name: "ความงาม & สุขภาพ" },
    { id: "home", name: "กีฬา & แก็ดเจ็ต" },
    { id: "kids", name: "แม่และเด็ก" },
    { id: "toys", name: "ของเล่น & สินค้าเด็ก" },
    { id: "motors", name: "ยานยนต์ & อุปกรณ์" },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) {
        alert("อัปโหลดรูปไม่สำเร็จ: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
      alert("อัปโหลดรูปภาพสำเร็จ!");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูป");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนลงขายสินค้า");
      navigate({ to: "/login" });
      return;
    }
    if (!title || !price) {
      alert("กรุณากรอกชื่อสินค้าและราคา");
      return;
    }
    if (!evidenceDescription.trim() || !sellerDeclaration) {
      alert("กรุณาระบุหลักฐานที่มาของสินค้าและยืนยันสิทธิ์ในการขาย");
      return;
    }

    setLoading(true);

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        title,
        price: parseFloat(price),
        condition,
        category,
        description,
        image_url: imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        seller_id: user.id,
        moderation_status: "pending",
      })
      .select("id")
      .single();

    if (!error && product) {
      const { error: evidenceError } = await supabase.from("product_review_evidence").insert({
        product_id: product.id,
        seller_id: user.id,
        evidence_description: evidenceDescription.trim(),
        evidence_url: evidenceUrl.trim() || null,
        seller_declaration: true,
      });
      if (evidenceError) {
        await supabase.from("products").delete().eq("id", product.id);
        setLoading(false);
        alert("บันทึกหลักฐานไม่สำเร็จ กรุณาลองอีกครั้ง: " + evidenceError.message);
        return;
      }
    }

    setLoading(false);

    if (error) {
      alert("เกิดข้อผิดพลาดในการลงขายสินค้า: " + error.message);
    } else {
      alert("ส่งสินค้าให้แอดมินตรวจสอบแล้ว จะแสดงบนหน้าร้านเมื่อได้รับอนุมัติ");
      navigate({ to: "/my-products" });
    }
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto bg-card min-h-screen pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border flex items-center gap-3 px-4 h-12">
          <button onClick={() => navigate({ to: "/" })} className="text-foreground">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-sm font-bold">ลงขายสินค้า</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5 text-xs">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
            สินค้าจะยังไม่แสดงบนหน้าร้านจนกว่าแอดมินจะตรวจสอบข้อมูลและหลักฐานประกอบ
          </div>
          {/* Section 1: ข้อมูลผู้ขาย */}
          <div className="space-y-3">
            <h2 className="font-bold text-primary text-xs">1. ข้อมูลผู้ขาย (สำหรับติดต่อ)</h2>
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">ชื่อ-นามสกุล หรือชื่อร้านค้า *</label>
              <input
                type="text"
                placeholder="เช่น คุณสมชาย ใจดี"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">เบอร์โทรศัพท์ติดต่อ *</label>
                <input
                  type="text"
                  placeholder="เช่น 0891234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Line ID (ถ้ามี)</label>
                <input
                  type="text"
                  placeholder="เช่น @somchai"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 2: ข้อมูลสินค้า */}
          <div className="space-y-3">
            <h2 className="font-bold text-primary text-xs">2. ข้อมูลสินค้า</h2>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">ชื่อสินค้า *</label>
              <input
                type="text"
                placeholder="เช่น เสื้อกันหนาวมือสอง สภาพดี"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            {/* เลือกสภาพสินค้า มือ 1 / มือ 2 */}
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">สภาพสินค้า *</label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCondition("new")}
                  className={`h-10 rounded-lg font-bold transition-all border ${
                    condition === "new"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  มือ 1 (สินค้าใหม่)
                </button>
                <button
                  type="button"
                  onClick={() => setCondition("used")}
                  className={`h-10 rounded-lg font-bold transition-all border ${
                    condition === "used"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  มือ 2 (ผ่านการใช้งาน)
                </button>
              </div>
            </div>

            {/* เลือกหมวดหมู่สินค้า */}
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">หมวดหมู่สินค้า *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">ราคา (บาท) *</label>
              <input
                type="number"
                placeholder="เช่น 350"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            {/* อัปโหลดรูปภาพ */}
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">รูปภาพสินค้า</label>
              <div className="border border-dashed border-border rounded-xl p-4 text-center space-y-3 bg-muted/20">
                <p className="text-[11px] text-muted-foreground">อัปโหลดรูปภาพสินค้าเข้า Supabase Storage</p>
                <div className="flex justify-center gap-2">
                  <label className="h-9 px-4 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:opacity-90">
                    <ImageIcon className="size-4" />
                    เลือกรูปภาพจากเครื่อง
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                {imageUrl && (
                  <p className="text-[10px] text-emerald-600 font-medium truncate">
                    อัปโหลดแล้ว: {imageUrl}
                  </p>
                )}
              </div>
              <input
                type="text"
                placeholder="หรือวาง URL รูปภาพที่นี่..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[11px] mt-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">รายละเอียดสินค้าเพิ่มเติม</label>
              <textarea
                rows={3}
                placeholder="อธิบายรายละเอียดสินค้า ตำหนิ หรือข้อมูลการจัดส่ง..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
              <h3 className="font-bold text-foreground">ข้อมูลสำหรับตรวจสอบที่มา</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                ระบุแหล่งที่มาและหลักฐาน เช่น ใบเสร็จ/ใบรับประกัน หรือหลักฐานการได้มา ห้ามส่งข้อมูลส่วนบุคคลที่ไม่เกี่ยวข้อง
              </p>
              <textarea
                rows={3}
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                placeholder="อธิบายว่าได้สินค้ามาจากที่ใด มีหลักฐานอะไรให้ตรวจสอบบ้าง *"
                className="w-full rounded-lg border border-border bg-background p-3 resize-none"
                required
              />
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="ลิงก์หลักฐาน (ถ้ามี ควรเป็นลิงก์ที่แอดมินเข้าถึงได้)"
                className="w-full h-10 rounded-lg border border-border bg-background px-3"
              />
              <label className="flex items-start gap-2 leading-relaxed">
                <input
                  type="checkbox"
                  checked={sellerDeclaration}
                  onChange={(e) => setSellerDeclaration(e.target.checked)}
                  className="mt-0.5 accent-primary"
                  required
                />
                <span>ข้าพเจ้ารับรองว่าเป็นเจ้าของหรือมีสิทธิ์จำหน่ายสินค้า และสินค้าไม่ได้มาจากการโจรกรรม *</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary text-primary-foreground rounded-full font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "ยืนยันโพสต์ขายสินค้า"
            )}
          </button>
        </form>
      </div>
    </AppShell>
  );
}