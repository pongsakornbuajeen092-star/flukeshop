export type Condition = "new" | "used";

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  sold: number;
  condition: Condition;
  images: string[];
  category: string;
  store: string;
  freeShipping: boolean;
  description: string;
};

// URL รูปภาพตัวอย่างออนไลน์
const phone = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600";
const shoe = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600";
const fryer = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600";
const headphones = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600";
const earbuds = "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600";

export const products: Product[] = [
  {
    id: "1",
    name: "สมาร์ทโฟน Galaxy X5 256GB สีดำ",
    price: 23900,
    oldPrice: 26900,
    rating: 4.8,
    reviews: 8200,
    sold: 12400,
    condition: "new",
    images: [phone, headphones, earbuds],
    category: "mobile",
    store: "IT Gadget Official",
    freeShipping: true,
    description:
      "สมาร์ทโฟนรุ่นใหม่ หน้าจอ 6.7 นิ้ว กล้องคู่ 50MP แบตเตอรี่ 5000mAh ของแท้ประกันศูนย์ไทย 1 ปี",
  },
  {
    id: "2",
    name: "รองเท้าผ้าใบวิ่ง รุ่น AirRun Pro",
    price: 2490,
    oldPrice: 2990,
    rating: 4.7,
    reviews: 5600,
    sold: 8900,
    condition: "new",
    images: [shoe, shoe],
    category: "fashion",
    store: "Fashion Hub",
    freeShipping: true,
    description: "รองเท้าผ้าใบน้ำหนักเบา พื้นนุ่ม ระบายอากาศดี เหมาะกับการวิ่งและใส่เที่ยว",
  },
  {
    id: "3",
    name: "หม้อทอดไร้น้ำมัน 5.5 ลิตร ดิจิทัล",
    price: 1890,
    oldPrice: 2490,
    rating: 4.6,
    reviews: 3100,
    sold: 4500,
    condition: "new",
    images: [fryer, fryer],
    category: "home",
    store: "Home & Living",
    freeShipping: false,
    description: "หม้อทอดไร้น้ำมันความจุ 5.5 ลิตร ตั้งเวลาได้ 8 โปรแกรม ล้างง่าย ประหยัดไฟ",
  },
  {
    id: "4",
    name: "หูฟังครอบหู Bluetooth ตัดเสียงรบกวน (มือสอง สภาพดี)",
    price: 1290,
    oldPrice: 2590,
    rating: 4.5,
    reviews: 820,
    sold: 1100,
    condition: "used",
    images: [headphones, headphones],
    category: "mobile",
    store: "Sports World",
    freeShipping: true,
    description: "หูฟังมือสองสภาพดี 90% ใช้งานปกติทุกฟังก์ชัน แบตอึด พร้อมกล่องและสายชาร์จ",
  },
  {
    id: "5",
    name: "หูฟังไร้สาย TrueBuds Pro (รุ่นที่ 2)",
    price: 7990,
    oldPrice: 9900,
    rating: 4.8,
    reviews: 12533,
    sold: 25000,
    condition: "new",
    images: [earbuds, earbuds, phone],
    category: "mobile",
    store: "IT Gadget Official",
    freeShipping: true,
    description: "หูฟังไร้สายตัดเสียงรบกวน เสียงรอบทิศทาง กันน้ำ IPX4 ใช้งานต่อเนื่อง 30 ชม.",
  },
  {
    id: "6",
    name: "รองเท้าผ้าใบ Classic (มือสอง ของแท้)",
    price: 890,
    rating: 4.4,
    reviews: 410,
    sold: 620,
    condition: "used",
    images: [shoe],
    category: "fashion",
    store: "Fashion Hub",
    freeShipping: false,
    description: "รองเท้ามือสองของแท้ สภาพ 85% ไซส์ 42 ทำความสะอาดแล้ว พร้อมส่ง",
  },
];

export const categories = [
  { id: "mobile", name: "มือถือ & แท็บเล็ต", icon: "Smartphone", subs: ["สมาร์ทโฟน", "แท็บเล็ต", "หูฟัง", "เคส & ฟิล์ม"] },
  { id: "fashion", name: "แฟชั่น", icon: "Shirt", subs: ["เสื้อผ้าผู้ชาย", "เสื้อผ้าผู้หญิง", "รองเท้า", "กระเป๋า"] },
  { id: "appliance", name: "เครื่องใช้ไฟฟ้า", icon: "Tv", subs: ["ทีวี", "พัดลม", "เครื่องปรับอากาศ", "ไมโครเวฟ"] },
  { id: "home", name: "บ้าน & ของใช้", icon: "Sofa", subs: ["เฟอร์นิเจอร์", "เครื่องครัว", "จัดเก็บของ"] },
  { id: "beauty", name: "ความงาม & สุขภาพ", icon: "Sparkles", subs: ["สกินแคร์", "เมคอัพ", "อาหารเสริม"] },
  { id: "sport", name: "กีฬา & กลางแจ้ง", icon: "Dumbbell", subs: ["ฟิตเนส", "แคมป์ปิ้ง", "จักรยาน"] },
  { id: "toy", name: "ของเล่น & สินค้าเด็ก", icon: "Baby", subs: ["ของเล่นเสริมพัฒนาการ", "ผ้าอ้อม", "รถเข็นเด็ก"] },
  { id: "auto", name: "รถยนต์ & อุปกรณ์", icon: "Car", subs: ["น้ำมันเครื่อง", "อุปกรณ์ตกแต่ง", "กล้องติดรถ"] },
];

export const stores = [
  { id: "s1", name: "IT Gadget Official", rating: 4.8, reviews: "12.5K", note: "ของแท้ 100% • ส่งไว 1-2 วัน" },
  { id: "s2", name: "Fashion Hub", rating: 4.6, reviews: "8.2K", note: "เสื้อผ้าแฟชั่น • ส่งไว 2-3 วัน" },
  { id: "s3", name: "Home & Living", rating: 4.7, reviews: "6.9K", note: "ของใช้ในบ้าน • ส่งไว 1-2 วัน" },
  { id: "s4", name: "Beauty Corner", rating: 4.5, reviews: "5.4K", note: "เครื่องสำอาง • ส่งไว 1-2 วัน" },
  { id: "s5", name: "Sports World", rating: 4.6, reviews: "4.1K", note: "กีฬา & อุปกรณ์ • ส่งไว 2-3 วัน" },
];

export const orders = [
  { id: "#123456789", date: "21 ก.ค. 2569", total: 24780, status: "shipping", items: 3 },
  { id: "#987654321", date: "18 ก.ค. 2569", total: 1990, status: "delivered", items: 1 },
  { id: "#456789123", date: "12 ก.ค. 2569", total: 3490, status: "delivered", items: 2 },
  { id: "#321654987", date: "5 ก.ค. 2569", total: 2390, status: "cancelled", items: 1 },
] as const;

export const chatRooms = [
  { id: "c1", store: "IT Gadget Official", last: "รับทราบครับ จัดส่งพรุ่งนี้เลยครับ", time: "10:26", unread: 2 },
  { id: "c2", store: "Fashion Hub", last: "มีไซส์ 42 พร้อมส่งค่ะ", time: "09:12", unread: 0 },
  { id: "c3", store: "Home & Living", last: "ขอบคุณที่อุดหนุนนะคะ 🙏", time: "เมื่อวาน", unread: 0 },
];

export const baht = (n: number) => "฿ " + n.toLocaleString("th-TH");

export const getProduct = (id: string) => products.find((p) => p.id === id);