const fs = require('fs');
const path = require('path');

const bundleFile = 'bundle-all-code.txt';

if (!fs.existsSync(bundleFile)) {
  console.log(`❌ ไม่พบไฟล์ ${bundleFile} ในโฟลเดอร์นี้ กรุณาตรวจสอบว่าเซฟไฟล์ไว้ชื่อตรงกันหรือไม่`);
  process.exit(1);
}

const content = fs.readFileSync(bundleFile, 'utf8');

// แยกบล็อกไฟล์ด้วยรูปแบบเส้นกั้น ==================== FILE: ... ====================
const blocks = content.split(/={10,}\r?\nFILE:\s*(.+?)\r?\n={10,}/gi);

let count = 0;

// blocks[0] คือข้อความก่อนถึงไฟล์แรก (ถ้ามี)
// บล็อกถัดๆ ไปจะจับเป็นคู่อยู่ในรูปแบบ: [1]=filePath, [2]=fileContent, [3]=filePath, [4]=fileContent...
for (let i = 1; i < blocks.length; i += 2) {
  const filePath = blocks[i].trim();
  const fileContent = blocks[i + 1] ? blocks[i + 1].replace(/^\r?\n/, '') : '';

  if (filePath) {
    // สร้างโฟลเดอร์รองรับหากยังไม่มี
    const dir = path.dirname(filePath);
    if (dir && dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // เขียนไฟล์ลงดิสก์
    fs.writeFileSync(filePath, fileContent);
    count++;
    console.log(`[${count}] Extracted: ${filePath}`);
  }
}

if (count === 0) {
  console.log("⚠️ ไม่พบโครงสร้างไฟล์ที่ถูกต้อง กรุณาตรวจสอบว่าในไฟล์ bundle-all-code.txt มีสัญลักษณ์ ==================== FILE: อยู่หรือไม่");
} else {
  console.log(`\n✅ สำเร็จ! แตกไฟล์ออกมาได้ทั้งหมด ${count} ไฟล์เรียบร้อยแล้ว`);
}