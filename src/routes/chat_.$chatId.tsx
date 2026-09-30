import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Send, Loader2 } from "lucide-react";

export const Route = createFileRoute("/chat_/$chatId")({
  component: ChatDetailPage,
});

interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

function ChatDetailPage() {
  const { chatId } = Route.useParams();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("แชทกับร้านค้า");

  useEffect(() => {
    if (!user || !chatId) return;

    // 1. ดึงชื่อห้องแชท, ข้อความเก่า และเคลียร์ unread_count เป็น 0 เมื่อกดเข้ามา
    async function fetchChatData() {
      setLoading(true);
      const roomRes = await supabase
        .from("chat_rooms")
        .select("store_name")
        .eq("id", chatId)
        .single();

      if (roomRes.data) {
        setStoreName(roomRes.data.store_name);
      }

      const msgRes = await supabase
        .from("messages")
        .select("*")
        .eq("chat_room_id", chatId)
        .order("created_at", { ascending: true });

      if (msgRes.data) {
        setMessages(msgRes.data);
      }

      // เคลียร์แจ้งเตือน unread_count ให้เป็น 0 ทันทีที่เปิดอ่าน
      await supabase
        .from("chat_rooms")
        .update({ unread_count: 0 })
        .eq("id", chatId);

      setLoading(false);
    }

    fetchChatData();

    // 2. ตั้งค่า Realtime ฟังข้อความใหม่ๆ ในห้องนี้
    const channel = supabase
      .channel(`room-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, chatId]);

  // 3. ฟังก์ชันส่งข้อความ
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const messageText = inputText;
    setInputText("");

    const { error } = await supabase.from("messages").insert({
      chat_room_id: chatId,
      sender_id: user.id,
      message: messageText,
    });

    if (!error) {
      await supabase
        .from("chat_rooms")
        .update({
          last_message: messageText,
          last_time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", chatId);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      <TopBar title={storeName} />

      {/* พื้นที่แสดงข้อความ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-12">ยังไม่มีข้อความ เริ่มสนทนาได้เลย</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-xs shadow-card ${
                    isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-foreground rounded-bl-none"
                  }`}
                >
                  <p>{msg.message}</p>
                  <span className={`block text-[9px] mt-1 text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ช่องพิมพ์ข้อความด้านล่าง */}
      <form onSubmit={handleSendMessage} className="p-3 bg-card border-t border-border flex items-center gap-2 fixed bottom-0 w-full max-w-md">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="flex-1 bg-secondary text-xs px-4 py-2.5 rounded-full outline-none focus:ring-1 focus:ring-primary"
        />
        <button type="submit" className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shrink-0 hover:opacity-90">
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}