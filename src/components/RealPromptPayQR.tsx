import { useState, useEffect } from "react";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { Loader2, QrCode } from "lucide-react";

interface RealPromptPayQRProps {
  promptPayID: string;
  amount: number;
}

export function RealPromptPayQR({ promptPayID, amount }: RealPromptPayQRProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function generateQR() {
      try {
        setLoading(true);
        const payload = generatePayload(promptPayID, { amount });
        const url = await QRCode.toDataURL(payload, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrImageUrl(url);
      } catch (err) {
        console.error("Failed to generate PromptPay QR:", err);
      } finally {
        setLoading(false);
      }
    }

    if (promptPayID && amount > 0) {
      generateQR();
    }
  }, [promptPayID, amount]);

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-card border border-border rounded-2xl shadow-sm max-w-sm mx-auto space-y-4">
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-semibold">
          <QrCode className="size-4" />
          <span>ชำระเงินผ่าน PromptPay</span>
        </div>
        <p className="text-2xl font-black text-foreground">
          ฿{amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      <div className="p-3 bg-white border border-border/80 rounded-2xl shadow-inner flex items-center justify-center min-w-[200px] min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-xs">กำลังสร้าง QR Code...</span>
          </div>
        ) : qrImageUrl ? (
          <img src={qrImageUrl} alt="PromptPay QR Code" className="w-48 h-48 object-contain" />
        ) : (
          <span className="text-xs text-destructive">ไม่สามารถสร้าง QR Code ได้</span>
        )}
      </div>

      <div className="text-center space-y-0.5">
        <p className="text-xs font-medium text-foreground">
          เปิดแอปพลิเคชันธนาคารเพื่อ <span className="text-primary font-bold">สแกนจ่าย</span>
        </p>
        <p className="text-[11px] text-muted-foreground font-mono">
          พร้อมเพย์: {promptPayID}
        </p>
      </div>
    </div>
  );
}