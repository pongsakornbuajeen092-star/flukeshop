
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import BottomNav from "./BottomNav";

export function AppShell({
  children,
  header,
  hideNav = false,
}: {
  children: ReactNode;
  header?: ReactNode;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col bg-background">
        {header}
        <main className={`page-fade flex-1 ${hideNav ? "pb-6" : "pb-24"}`}>{children}</main>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export function TopBar({
  title,
  back = "/",
  right,
}: {
  title: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <header className="safe-top sticky top-0 z-40 bg-card shadow-card">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-3">
        <Link
          to={back}
          aria-label="ย้อนกลับ"
          className="grid size-10 shrink-0 place-items-center rounded-full text-foreground active:bg-secondary"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="truncate text-base font-bold">{title}</h1>
        <div className="flex shrink-0 items-center gap-1">{right}</div>
      </div>
    </header>
  );
}

