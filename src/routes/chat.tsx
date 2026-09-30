import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Send, Store, User, ChevronRight, MessageSquare, Image as ImageIcon, MapPin, Loader2, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppShell, TopBar } from "@/components/AppShell";

interface ChatSearch {
  seller_id?: string;
  store?: string;
  title?: string;
  product_id?: string;
}

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>): ChatSearch => {
    return {
      seller_id: (search.seller_id as string) || "",
      store: (search.store as string) || "",
      title: (search.title as string) || "",
      product_id: (search.product_id as string) || "",
    };
  },
  component: ChatPage,
});

interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  message: string;
  is_read?: boolean;
  created_at: string;
}

interface ChatRoom {
  chat_room_id: string;
  other_user_id: string;
  store: string;
  lastMessage: string;
  updated_at: string;
}

function ChatPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const searchSellerId = search.seller_id;
  const store = search.store || "ร้านค้าทางการ";
  const product_id = search.product_id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [actualSellerId, setActualSellerId] = useState<string>(searchSellerId || "");
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActualSellerId(search.seller_id || "");
  }, [search.seller_id]);

  useEffect(() => {
    async function getSessionUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          setCurrentUserId(user.id);
        } else {
          setCurrentUserId("");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setCurrentUserId("");
      } finally {
        setIsCheckingAuth(false);
      }
    }
    getSessionUser();
  }, []);

  useEffect(() => {
    async function fetchProductOwner() {
      if (!product_id) return;
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", product_id)
          .eq("moderation_status", "approved")
          .single();

        if (!error && data) {
          const ownerId = data.user_id || data.seller_id; 
          if (ownerId) {
            setActualSellerId(ownerId);
            navigate({
              to: "/chat",
              search: { seller_id: ownerId, store: store, product_id: product_id },
              replace: true,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching product owner:", err);
      }
    }
    fetchProductOwner();
  }, [product_id]);

  // ฟังก์ชันสร้าง Room ID กลางระหว่าง 2 ไอดี (เรียงตัวอักษรเพื่อให้อยู่ห้องเดียวกันเสมอไม่ว่าจะสลับฝั่ง)
  const getRoomId = (id1: string, id2: string) => {
    if (!id1 || !id2) return "";
    const sorted = [id1, id2].sort();
    return `room_${sorted[0]}_${sorted[1]}`;
  };

  const targetRoomId = getRoomId(actualSellerId, currentUserId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ดึงรายการกล่องข้อความ (Inbox) ของบัญชีปัจจุบัน
  useEffect(() => {
    if (!currentUserId) return;
    let isMounted = true;

    async function fetchInbox() {
      try {
        // ดึงข้อความทั้งหมดที่ user_id ปัจจุบันเข้าไปเกี่ยวข้องในชื่อห้อง
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`chat_room_id.ilike.%${currentUserId}%`)
          .order("created_at", { ascending: false });

        if (!error && data && isMounted) {
          const roomMap = new Map<string, ChatRoom>();

          data.forEach((msg) => {
            if (msg.chat_room_id && msg.chat_room_id.includes(currentUserId)) {
              if (!roomMap.has(msg.chat_room_id)) {
                let otherUser = "";
                if (msg.chat_room_id.startsWith("room_")) {
                  const parts = msg.chat_room_id.replace("room_", "").split("_");
                  if (parts.length === 2) {
                    const [idA, idB] = parts;
                    if (idA === currentUserId || idB === currentUserId) {
                      otherUser = currentUserId === idA ? idB : idA;
                    }
                  }
                }

                if (otherUser) {
                  roomMap.set(msg.chat_room_id, {
                    chat_room_id: msg.chat_room_id,
                    other_user_id: otherUser,
                    store: "ร้านค้าทางการ",
                    lastMessage: msg.message,
                    updated_at: msg.created_at,
                  });
                }
              }
            }
          });

          setChatRooms(Array.from(roomMap.values()));
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchInbox();
    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  // ดึงข้อความในห้องแชทเฉพาะเจาะจง
  useEffect(() => {
    if (!targetRoomId || !currentUserId) return;

    let isMounted = true;
    async function fetchMessages() {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_room_id", targetRoomId)
          .order("created_at", { ascending: true });

        if (!error && data && isMounted) {
          const uniqueMessages = Array.from(
            new Map(data.map((msg) => [msg.id, msg])).values()
          );
          setMessages(uniqueMessages);

          await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("chat_room_id", targetRoomId)
            .neq("sender_id", currentUserId)
            .eq("is_read", false);
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchMessages();

    const channel = supabase
      .channel(`room-realtime-${targetRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${targetRoomId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            const combined = [...prev, newMsg];
            return Array.from(new Map(combined.map((m) => [m.id, m])).values());
          });

          if (newMsg.sender_id !== currentUserId) {
            await supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [targetRoomId, currentUserId]);

  const sendMessageToSupabase = async (textToSend: string) => {
    if (!textToSend.trim() || !targetRoomId || !currentUserId) return;

    const newMsg = {
      chat_room_id: targetRoomId,
      sender_id: currentUserId,
      message: textToSend.trim(),
      is_read: false,
    };

    const { data, error } = await supabase
      .from("messages")
      .insert(newMsg)
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => {
        const combined = [...prev, data];
        return Array.from(new Map(combined.map((m) => [m.id, m])).values());
      });
    }
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput("");
    await sendMessageToSupabase(text);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetRoomId || !currentUserId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("อัปโหลดรูปภาพไม่สำเร็จ");
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("chat")
        .getPublicUrl(filePath);

      await sendMessageToSupabase(`[img]${publicUrl}`);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        sendMessageToSupabase(`📍 [แชร์โลเคชั่น]\n${mapUrl}`);
      },
      () => {
        alert("ไม่สามารถดึงตำแหน่งของคุณได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง");
      }
    );
  };

  if (isCheckingAuth) {
    return (
      <AppShell header={<TopBar title={store} />}>
        <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center bg-card">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!currentUserId) {
    return (
      <AppShell header={<TopBar title={store} />}>
        <div className="flex min-h-[calc(100dvh-120px)] flex-col items-center justify-center p-6 text-center bg-card space-y-3">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <LogIn className="size-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">กรุณาเข้าสู่ระบบก่อนใช้งานแชท</p>
            <p className="text-xs text-muted-foreground mt-1">ระบบตรวจไม่พบการเข้าสู่ระบบผ่าน Supabase Auth ในหน้าต่างนี้</p>
          </div>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium active:scale-95 transition-transform"
          >
            ไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </AppShell>
    );
  }

  if (!actualSellerId) {
    return (
      <AppShell header={<TopBar title="ข้อความทั้งหมด" />}>
        <div className="flex min-h-[calc(100dvh-120px)] flex-col bg-card p-4 pb-24">
          {chatRooms.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted-foreground space-y-2">
              <MessageSquare className="mx-auto size-10 text-muted-foreground/40" />
              <p className="font-semibold text-foreground text-sm">ยังไม่มีข้อความสนทนา</p>
              <p>คุณสามารถกด "แชทกับร้าน" จากหน้าสินค้าเพื่อเริ่มพูดคุยได้เลยครับ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatRooms.map((room) => (
                <div
                  key={room.chat_room_id}
                  onClick={() => {
                    navigate({
                      to: "/chat",
                      search: { seller_id: room.other_user_id, store: room.store },
                    });
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background active:scale-[0.99] transition-transform cursor-pointer shadow-sm"
                >
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Store className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold truncate text-foreground">{room.store}</h2>
                    <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  const isUserTheSeller = currentUserId === actualSellerId;

  return (
    <AppShell
      header={
        <TopBar
          title={store}
          back=""
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActualSellerId("");
                  navigate({ to: "/chat", search: {} });
                }}
                className="text-xs font-medium text-primary hover:underline px-2 py-1"
              >
                ย้อนกลับ
              </button>
              <span className="text-[9px] text-muted-foreground bg-muted px-2 py-1 rounded">
                {isUserTheSeller ? "🏪 โหมดผู้ขาย" : "🛒 โหมดผู้ซื้อ"} ({currentUserId.slice(0, 4)}...)
              </span>
            </div>
          }
        />
      }
    >
      <div className="flex min-h-[calc(100dvh-120px)] flex-col bg-card">
        <div className="flex-1 space-y-3 p-4 overflow-y-auto pb-24">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground text-sm">เริ่มสนทนากับผู้ขาย</p>
              <p>พิมพ์ข้อความ ส่งรูป หรือแชร์โลเคชั่นได้เลยครับ</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;

              const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              const isImage = msg.message.startsWith("[img]");
              const imageUrl = isImage ? msg.message.replace("[img]", "") : "";

              return (
                <div
                  key={msg.id || Math.random()}
                  className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`size-7 rounded-full flex items-center justify-center shrink-0 mb-1 ${
                      isMe ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isMe ? <User className="size-4" /> : <Store className="size-4" />}
                  </div>

                  <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-wrap ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted text-foreground rounded-tl-none"
                      }`}
                    >
                      {isImage ? (
                        <a href={imageUrl} target="_blank" rel="noreferrer">
                          <img 
                            src={imageUrl} 
                            alt="chat-image" 
                            className="max-w-xs rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-95" 
                          />
                        </a>
                      ) : (
                        msg.message
                      )}
                    </div>
                    <span className={`text-[9px] text-muted-foreground mt-1 px-1 ${isMe ? "text-right" : "text-left"}`}>
                      {timeStr}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="fixed bottom-16 left-0 right-0 z-20 mx-auto max-w-lg border-t border-border bg-card p-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          <form onSubmit={handleSendSubmit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="size-10 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-secondary shrink-0 transition-colors disabled:opacity-50"
              title="ส่งรูปภาพ"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
            </button>

            <button
              type="button"
              onClick={handleSendLocation}
              className="size-10 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-secondary shrink-0 transition-colors"
              title="แชร์โลเคชั่น"
            >
              <MapPin className="size-4" />
            </button>

            <input
              type="text"
              placeholder={isUserTheSeller ? "ตอบกลับในฐานะผู้ขาย..." : "พิมพ์ข้อความสอบถาม..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-10 px-4 rounded-full border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform shrink-0"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}