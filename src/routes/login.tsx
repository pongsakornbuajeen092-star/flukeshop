import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppShell, TopBar } from "@/components/AppShell";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErrorMsg(error.message);
      else alert("สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
      else navigate({ to: "/profile" });
    }
    setLoading(false);
  };

  return (
    <AppShell header={<TopBar title={isSignUp ? "สมัครสมาชิก" : "เข้าสู่ระบบ"} />}>
      <form onSubmit={handleAuth} className="p-4 space-y-4 max-w-sm mx-auto mt-6">
        {errorMsg && <p className="text-xs text-destructive text-center bg-destructive/10 p-2 rounded-lg">{errorMsg}</p>}
        <div>
          <label className="text-xs font-bold text-muted-foreground">อีเมล</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mt-1 rounded-xl border border-border bg-card text-sm"
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground">รหัสผ่าน</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mt-1 rounded-xl border border-border bg-card text-sm"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
        >
          {loading ? "กำลังดำเนินการ..." : isSignUp ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-4">
          {isSignUp ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"}{" "}
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-bold underline">
            {isSignUp ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>
        </p>
      </form>
    </AppShell>
  );
}