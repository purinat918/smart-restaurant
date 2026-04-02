// เมนูเริ่มต้น (Default)
const defaultMenu = [
    { id: 1, name: "สลัดอกไก่อะโวคาโด", desc: "โปรตีนสูง คาร์บต่ำ", price: 180, category: "healthy", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800" },
    { id: 2, name: "สเต็กแซลมอน", desc: "แซลมอนย่างพรีเมียม", price: 350, category: "main", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800" },
    { id: 3, name: "สปาเก็ตตี้เพสโต้กุ้ง", desc: "ซอสโหระพาและกุ้งตัวโต", price: 280, category: "main", image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800" },
    { id: 4, name: "ควินัวโบลว์รวมมิตร", desc: "ธัญพืชและผักออร์แกนิก", price: 220, category: "healthy", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800" }
];

// 🌟 ดึงข้อมูลจาก LocalStorage ถ้าไม่มีให้ใช้ defaultMenu
let menuData = JSON.parse(localStorage.getItem('restaurantMenu')) || defaultMenu;

// ฟังก์ชันสำหรับเซฟข้อมูลลง LocalStorage (ใช้ในฝั่ง Admin)
function saveMenuData() {
    localStorage.setItem('restaurantMenu', JSON.stringify(menuData));
}