import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // ดึง Session ตั้งต้น
    async function initAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth session error:", error);
        }
        if (mounted) {
          setSession(data.session ?? null);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        console.error("Unexpected auth error:", err);
      } finally {
        if (mounted) {
          setLoading(false); // ป้องกันการค้าง loading ถาวร
        }
      }
    }

    initAuth();

    // ฟัง Event การเปลี่ยนสถานะ Auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Safety Timeout: หากผ่านไป 2 วินาทีแล้ว Auth ยังดึงไม่เสร็จ ให้ปลด loading ทันทีเพื่อไม่ให้หน้าจอหมุนค้าง
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);