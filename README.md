# 🍽️ The Gourmet AI - Smart Restaurant Management System

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Version](https://img.shields.io/badge/Version-1.0-blue)
![Tech Stack](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-orange)
![Database](https://img.shields.io/badge/Database-Firebase%20Firestore-yellow)
![AI](https://img.shields.io/badge/AI-Google%20Gemini%20API-brightgreen)

**The Gourmet AI** คือ Web Application สำหรับจัดการร้านอาหารแบบครบวงจร (Full-Stack POS & KDS) ที่ยกระดับประสบการณ์การสั่งอาหารด้วยผู้ช่วย AI และระบบ Real-time Database ที่ทำให้ทุกภาคส่วนของร้าน (ลูกค้า, ห้องครัว, ผู้จัดการ) ทำงานประสานกันได้อย่างไร้รอยต่อ

---

## ✨ ฟีเจอร์เด่น (Core Features)

### 📱 1. ฝั่งลูกค้า (Customer Ordering System)
* **🤖 AI Waiter:** ขับเคลื่อนด้วย **Google Gemini API** ช่วยแนะนำอาหารตามความต้องการของลูกค้าแบบชาญฉลาด (เช่น แนะนำเมนูแคลอรี่ต่ำ, เมนูสำหรับเด็ก)
* **🛒 Smart Cart & Dynamic Options:** ลูกค้าสามารถเลือก Options เสริมของอาหาร (เช่น ระดับความสุก, หั่น/ไม่หั่น) และระบุหมายเหตุพิเศษได้ 
* **🔄 Real-time Update:** เมนูและราคาอัปเดตตรงจาก Cloud ทันทีโดยไม่ต้องรีเฟรชหน้าเว็บ
* **📜 Order History:** ระบบเรียกดูประวัติการสั่งอาหารของโต๊ะตัวเอง (แสดงเฉพาะบิลปัจจุบันที่ยังไม่ถูกเช็คบิล)

### 👨‍🍳 2. ฝั่งห้องครัว (Kitchen Display System - KDS)
* **⚡ Real-time Order Radar:** ออเดอร์เด้งเข้าหน้าจอเชฟทันทีระดับมิลลิวินาที (ใช้ Firebase `onSnapshot`)
* **🔔 Status Management:** เชฟสามารถกดรับออเดอร์ (กำลังทำ) และกดเสิร์ฟได้ 
* **📜 Daily History:** ระบบเรียกดูประวัติการเสิร์ฟเฉพาะ "วันปัจจุบัน" เพื่อลดความผิดพลาดและกันการเสิร์ฟซ้ำ รีเซ็ตอัตโนมัติเมื่อข้ามวัน

### 💼 3. ฝั่งแคชเชียร์และผู้จัดการ (Admin POS & Analytics)
* **☁️ Cloud Menu Management:** ระบบ CRUD เมนูอาหารและตั้งค่าตัวเลือกพิเศษ (Dynamic Options) ยิงตรงขึ้น Firebase
* **💰 Table Billing:** ระบบคำนวณยอดเงินรวมของแต่ละโต๊ะ และกด "เช็คบิล" เพื่อเปลี่ยนสถานะออเดอร์ (ใช้เทคนิค `Firebase Batch Commit`)
* **📈 Sales Analytics:** ระบบบันทึกประวัติยอดขายถาวรแยกตามเดือนและวัน พร้อมระบบ Auto-reset ยอดรายวันเมื่อข้ามวันใหม่ สามารถกางดูรายละเอียดบิลย้อนหลังได้ตลอดชีพ

---

## 🛠️ สถาปัตยกรรมและเทคโนโลยี (Tech Stack)

* **Frontend:** HTML5, CSS3 (Flexbox/Grid, Responsive Media Queries), Vanilla JavaScript (ES6+)
* **Backend (BaaS):** Firebase Cloud Firestore (NoSQL Database)
* **AI Integration:** Google Generative AI (Gemini 2.5 Flash Model)
* **Architecture Pattern:** 3-Tier Architecture (Client-Side Rendering)

---

## 🚀 วิธีการเข้าใช้งานและทดสอบระบบ (Usage & Testing)

ระบบนี้ออกแบบการเข้าสู่ระบบของลูกค้าไว้ 2 รูปแบบ เพื่อรองรับทั้งการใช้งานจริงในร้านและการทดสอบของนักพัฒนา:

### 📸 รูปแบบที่ 1: การใช้งานจริงผ่าน QR Code (Production Mode)
เมื่อนำไปใช้ในร้านอาหาร ลูกค้าไม่ต้องพิมพ์เลขโต๊ะเอง ระบบจะดึงข้อมูลผ่าน URL Parameter โดยอัตโนมัติ
1. นำลิงก์ของเว็บไซต์ไปสร้าง QR Code โดยระบุเลขโต๊ะไว้ด้านหลัง เช่น `https://[your-domain]/welcome.html?table=1`
2. ลูกค้านำมือถือสแกน QR Code ที่ตั้งอยู่บนโต๊ะ
3. ระบบจะทำการ **Auto-Login** อ่านค่า `?table=1` จาก URL บันทึกลงระบบ แล้วพาลูกค้าข้ามหน้า Welcome เข้าสู่หน้าสั่งอาหาร (`index.html`) ทันที
*(สามารถดูตัวอย่างรูปภาพ QR Code สำหรับใช้ทดสอบได้ที่โฟลเดอร์ `assets/qrcodes/`)*

### 💻 รูปแบบที่ 2: การจำลองทดสอบระบบ (Manual Testing Mode)
สำหรับนักพัฒนาหรือผู้ดูแลระบบที่ต้องการทดสอบการทำงานของแต่ละโต๊ะด้วยตนเอง
1. เปิด Web Browser เข้าไปที่หน้าหลักของแอปพลิเคชัน (`welcome.html`) โดยไม่ต้องใส่ Parameter ใดๆ
2. ระบบจะแสดงหน้าจอให้ **"กรอกเลขโต๊ะด้วยตนเอง"** (Manual Entry)
3. พิมพ์เลขโต๊ะที่ต้องการทดสอบ (เช่น 5) แล้วกดปุ่ม "เริ่มสั่งอาหาร" ระบบจะบันทึกเลขโต๊ะและพาเข้าสู่หน้าสั่งอาหาร

### 🔗 ลิงก์สำหรับผู้ดูแลระบบ (Admin & Kitchen)
* **หน้าห้องครัว (KDS):** เข้าไปที่ `/kitchen.html`
* **หน้าจัดการร้านและแคชเชียร์ (Admin/POS):** เข้าไปที่ `/admin.html`

---

## 🔮 แผนการพัฒนาในอนาคต (Future Enhancements)
- [ ] 🔒 ระบบ Authentication ล็อกอินสำหรับพนักงานและผู้จัดการ (Firebase Auth)
- [ ] 🖨️ ระบบเชื่อมต่อเครื่องพิมพ์ใบเสร็จความร้อน (Thermal Printer)
- [ ] 📊 แดชบอร์ดสรุปยอดขายแบบกราฟแท่ง/กราฟวงกลม (Chart.js)

---
*Developed with ❤️ and Passion for clean code.*
