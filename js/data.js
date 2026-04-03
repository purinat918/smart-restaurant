// ==========================================
// 🔥 1. เชื่อมต่อฐานข้อมูล Firebase
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDsMhvvCPkTgOvWDJX_cLBbs3w9AjqDB3Kc",
    authDomain: "smart-restuarant-f9f4f.firebaseapp.com",
    projectId: "smart-restuarant-f9f4f",
    storageBucket: "smart-restuarant-f9f4f.firebasestorage.app",
    messagingSenderId: "994196085276",
    appId: "1:994196085276:web:6cacac18ae2e45d3011dd9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// 🍔 2. ระบบจัดการเมนูอาหาร (Cloud Sync)
// ==========================================
let menuData = []; // สร้างเป็นอาเรย์ว่างไว้รอรับข้อมูลจาก Cloud

// 🎯 ฟังก์ชันดักฟังเมนูจาก Cloud แบบ Real-time
function listenToMenu(callback) {
    db.collection("menu").onSnapshot((snapshot) => {
        menuData = [];
        snapshot.forEach((doc) => {
            menuData.push({ id: doc.id, ...doc.data() });
        });
        console.log("🍏 อัปเดตเมนูจาก Cloud เรียบร้อย!", menuData);
        
        // ถ้ามีฟังก์ชันที่อยากให้ทำงานต่อหลังจากโหลดเมนูเสร็จ (เช่น renderMenu) ให้ใส่ใน callback
        if (callback) callback(menuData);
    });
}

// 🎯 ฟังก์ชันสำหรับ Admin: เพิ่มหรือแก้ไขเมนูขึ้น Cloud
async function saveMenuToCloud(itemData) {
    try {
        if (itemData.id) {
            // ถ้ามี ID เดิมอยู่แล้ว ให้ "อัปเดต"
            const id = itemData.id;
            delete itemData.id; // ลบ id ออกก่อนบันทึกเพื่อไม่ให้ซ้ำซ้อนใน data
            await db.collection("menu").doc(id).update(itemData);
        } else {
            // ถ้าไม่มี ID ให้ "เพิ่มใหม่"
            await db.collection("menu").add(itemData);
        }
    } catch (error) {
        console.error("Error saving menu: ", error);
    }
}

// 🎯 ฟังก์ชันสำหรับ Admin: ลบเมนูออกจาก Cloud
async function deleteMenuFromCloud(id) {
    try {
        await db.collection("menu").doc(id).delete();
    } catch (error) {
        console.error("Error deleting menu: ", error);
    }
}