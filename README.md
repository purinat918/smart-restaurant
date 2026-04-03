# smart-restaurant
# 🍽️ The Gourmet AI - Smart Restaurant Management System

![Project Banner](https://img.shields.io/badge/Status-Completed-success) ![Tech Stack](https://img.shields.io/badge/Tech_Stack-HTML_|_CSS_|_Vanilla_JS-blue) ![AI](https://img.shields.io/badge/AI_Integration-Google_Gemini-orange)

ระบบจัดการร้านอาหารอัจฉริยะแบบครบวงจร (Web Application) ที่จำลองการทำงานตั้งแต่ฝั่งลูกค้าเข้ามารับประทานอาหาร จนถึงระบบจัดการหลังบ้านของผู้จัดการร้าน พร้อมไฮไลท์พิเศษคือการนำ AI มาช่วยแนะนำเมนูอาหารให้กับลูกค้า

🚀 **Live Demo:** [คลิกที่นี่เพื่อทดลองใช้งานระบบ](https://purinat918.github.io/smart-restaurant/welcome.html)

---

## 🎯 ฟีเจอร์หลัก (Key Features)

ระบบถูกแบ่งออกเป็น 3 ส่วนหลัก เพื่อรองรับการทำงานของ User ที่แตกต่างกัน:

### 1. 📱 Customer Facing (หน้าร้านสำหรับลูกค้า)
* **Smart Menu:** ระบบตะกร้าสินค้า (Cart System) คำนวณราคาสินค้าและอัปเดตจำนวนแบบ Real-time
* **🤖 AI Waiter:** เชื่อมต่อกับ **Google Gemini API** เพื่อทำหน้าที่เป็นพนักงานเสิร์ฟอัจฉริยะ ลูกค้าสามารถพิมพ์ความต้องการ (เช่น "อยากคุมน้ำหนัก" หรือ "มีงบ 200 บาท") แล้ว AI จะประมวลผลจากฐานข้อมูลเมนูเพื่อแนะนำอาหารที่เหมาะสมที่สุด

### 2. 👨‍🍳 Kitchen Display System - KDS (ระบบหลังครัว)
* **Real-time Order Management:** รับออเดอร์จากหน้าลูกค้าทันที (จำลองการส่งข้อมูล)
* **Status Tracking:** อัปเดตสถานะอาหาร (ใหม่ -> กำลังทำ -> เสิร์ฟแล้ว) พร้อมระบบแยกสีเพื่อให้เชฟดูง่าย

### 3. ⚙️ Admin Dashboard (ระบบจัดการหลังร้าน / POS)
* **Table & Billing Management:** สรุปยอดสั่งอาหารของแต่ละโต๊ะ และกดปุ่มเช็คบิลเพื่อรับเงิน
* **Menu CRUD:** ระบบเพิ่ม แก้ไข และลบ เมนูอาหาร พร้อมระบบหมวดหมู่แบบ Dynamic (Datalist)
* **📊 Data Analytics & Audit:** เก็บประวัติยอดขายแยกตามรายเดือนและรายวัน พร้อมความสามารถในการกดดู "บิลย้อนหลัง" เพื่อตรวจสอบรายการอาหารและเวลาสั่งของบิลแต่ละใบได้

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **AI Integration:** Google Gemini API (`gemini-2.5-flash`)
* **State Management & Storage:** `localStorage` (สำหรับการจำลอง Database ในฝั่ง Client-side)

---

## 💡 System Architecture Note (ทำไมถึงใช้ localStorage?)
*โปรเจกต์นี้ถูกออกแบบมาเพื่อเป็น **Live Demo (Static Web App)** ที่สามารถรันบน GitHub Pages ได้ทันทีโดยไม่ต้องพึ่งพาเซิร์ฟเวอร์หลังบ้าน จึงตัดสินใจใช้ `localStorage` ในการจำลองฐานข้อมูล (Mock Database) เพื่อให้ผู้ทดสอบสามารถเห็น Flow การทำงานแบบ Real-time ได้*

*ในกรณีที่พัฒนาเพื่อใช้งานจริง (Production) โครงสร้างนี้สามารถถูกนำไปเชื่อมต่อกับ Backend (เช่น Node.js / Express) และ Database (เช่น MongoDB / PostgreSQL) เพื่อแชร์ State ระหว่าง Client หลายๆ เครื่องได้อย่างง่ายดาย*

---
