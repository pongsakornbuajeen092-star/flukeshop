
import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "ค้นหาสินค้า แบรนด์ หรือร้านค้า...",
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex min-h-11 flex-1 items-center gap-2 rounded-full bg-secondary px-4">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

