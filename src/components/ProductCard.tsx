import { Link } from "@tanstack/react-router";

interface Product {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  image?: string;
  condition?: "new" | "used" | string;
}

export function ConditionBadge({ condition, title }: { condition?: string; title?: string }) {
  // เช็คว่าเป็นมือสองจาก field condition หรือมีคำว่า "มือสอง" / "มือ 2" ในชื่อสินค้า
  const isUsed =
    condition === "used" ||
    (title && (title.includes("มือสอง") || title.includes("มือ 2")));

  return (
    <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] font-medium text-muted-foreground">
      {isUsed ? "มือ 2" : "มือ 1"}
    </span>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  if (!product || !product.id) return null;

  const imageUrl =
    product.image_url || product.image || "https://placehold.co/300x300?text=No+Image";

  return (
    <Link
      to="/product/$id"
      params={{ id: String(product.id) }}
      className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col justify-between hover:shadow-sm transition-shadow"
    >
      <div>
        <div className="aspect-square bg-muted relative overflow-hidden">
          <img
            src={imageUrl}
            alt={product.title || "สินค้า"}
            className="size-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/300x300?text=No+Image";
            }}
          />
        </div>
        <div className="p-2.5 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
            <ConditionBadge condition={product.condition} title={product.title} />
          </div>
          <h4 className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
            {product.title || "ไม่มีชื่อสินค้า"}
          </h4>
        </div>
      </div>

      <div className="p-2.5 pt-0">
        <p className="text-xs font-bold text-primary">
          ฿ {Number(product.price || 0).toLocaleString("th-TH")}
        </p>
      </div>
    </Link>
  );
}