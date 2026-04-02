let cart = []; // เก็บของในตะกร้า

// เช็คเลขโต๊ะ
const currentTable = localStorage.getItem('customerTable');
if (!currentTable) window.location.href = 'welcome.html';
else document.getElementById('display-table').innerText = 'โต๊ะ ' + currentTable;

// วาดเมนู
function renderMenu(categoryToShow = 'all') {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = ''; 
    let filteredMenu = categoryToShow === 'all' ? menuData : menuData.filter(i => i.category === categoryToShow);

    filteredMenu.forEach(item => {
        menuList.innerHTML += `
            <div class="menu-card">
                <img src="${item.image}" class="menu-img">
                <div class="menu-info">
                    <div>
                        <div class="menu-name">${item.name}</div>
                        <div style="font-size: 0.8rem; color: #777;">${item.desc}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="menu-price">฿ ${item.price}</div>
                        <button class="add-btn" onclick="addToCart(${item.id})">+ เพิ่ม</button>
                    </div>
                </div>
            </div>`;
    });
}

function filterMenu(category, btn) {
    renderMenu(category);
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// 🎯 ระบบเพิ่มลงตะกร้าแบบฉลาด (รวมของซ้ำ)
function addToCart(id) {
    const item = menuData.find(i => i.id === id);
    const existingItem = cart.find(cartItem => cartItem.id === id);
    
    if(existingItem) {
        existingItem.qty += 1; // ถ้ามีอยู่แล้วให้บวกจำนวน
    } else {
        cart.push({ ...item, qty: 1 }); // ถ้ายังไม่มีให้เพิ่มใหม่ กำหนดจำนวน = 1
    }
    updateFloatingCart();
    renderCartModal(); // อัปเดตหน้าต่างจัดการด้วย
}

// 🎯 จัดการหน้าต่างตะกร้า (เปิด/ปิด)
function openCart() { document.getElementById('cart-modal').style.display = 'flex'; }
function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

// อัปเดตแถบสีดำด้านล่าง
function updateFloatingCart() {
    const floating = document.getElementById('floating-cart');
    const summary = document.getElementById('cart-summary');
    
    if (cart.length > 0) {
        floating.style.display = 'flex';
        let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        let totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        summary.innerHTML = `<i class="fa-solid fa-basket-shopping"></i> ดูตะกร้า (${totalItems} ชิ้น) <span style="margin-left:auto; font-weight:bold;">฿ ${totalPrice} </span>`;
    } else {
        floating.style.display = 'none';
        closeCart(); // ถ้าของหมดตะกร้าให้ปิดหน้าต่างไปเลย
    }
}

// 🎯 วาดรายการในหน้าต่างจัดการตะกร้า (โชว์ปุ่ม + - ลบ)
function renderCartModal() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
    
    let totalPrice = 0;
    
    cart.forEach((item, index) => {
        totalPrice += (item.price * item.qty);
        container.innerHTML += `
            <div class="cart-item">
                <div style="flex:1;">
                    <div style="font-weight:bold;">${item.name}</div>
                    <div style="color:#0A66C2;">฿ ${item.price * item.qty}</div>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn del" onclick="changeQty(${index}, -1)">-</button>
                    <span style="font-weight:bold; width:20px; text-align:center;">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>`;
    });
    
    document.getElementById('cart-total-price').innerText = `฿ ${totalPrice}`;
}

// 🎯 ฟังก์ชันเพิ่ม/ลด/ลบ อาหาร
function changeQty(index, amount) {
    cart[index].qty += amount;
    // ถ้าจำนวนเหลือน้อยกว่า 1 (คือ 0) ให้ลบออกจากตะกร้าเลย
    if(cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateFloatingCart();
    renderCartModal();
}

// ส่งออเดอร์
function submitOrder() {
    alert("ส่งออเดอร์เข้าครัวเรียบร้อยแล้ว! (จำลอง)");
    cart = []; // ล้างตะกร้า
    updateFloatingCart();
    closeCart();
}
// ฟังก์ชันส่งออเดอร์ (ของจริง)
function submitOrder() {
    if (cart.length === 0) return;

    // 1. ดึงออเดอร์ทั้งหมดที่มีในระบบมาก่อน
    let allActiveOrders = JSON.parse(localStorage.getItem('activeOrders')) || [];

    // 2. สร้างก้อนข้อมูลออเดอร์ใหม่
    const newOrder = {
        orderId: Date.now(), // ใช้เวลาเป็น ID เพื่อไม่ให้ซ้ำ
        table: localStorage.getItem('customerTable'),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
        status: 'new',
        time: new Date().toLocaleTimeString('th-TH')
    };

    // 3. บันทึกลงไป
    allActiveOrders.push(newOrder);
    localStorage.setItem('activeOrders', JSON.stringify(allActiveOrders));

    alert("ส่งออเดอร์เข้าครัวเรียบร้อยแล้ว!");
    cart = []; // ล้างตะกร้า (แต่ประวัติยังอยู่)
    updateFloatingCart();
    closeCart();
}

// ฟังก์ชันดูประวัติการสั่ง (เฉพาะโต๊ะตัวเอง)
function showHistory() {
    let allActiveOrders = JSON.parse(localStorage.getItem('activeOrders')) || [];
    let myTable = localStorage.getItem('customerTable');
    let myOrders = allActiveOrders.filter(o => o.table === myTable);

    if (myOrders.length === 0) return alert("ยังไม่มีประวัติการสั่งครับ");

    let historyText = `--- ประวัติการสั่งโต๊ะ ${myTable} ---\n`;
    myOrders.forEach(order => {
        historyText += `\nเวลา: ${order.time}\n`;
        order.items.forEach(i => historyText += `- ${i.name} x${i.qty}\n`);
    });
    
    alert(historyText);
}
renderMenu();

// ==========================================
// 🤖 ระบบ AI Waiter (เชื่อมต่อ Google Gemini)
// ==========================================
async function askAI() {
    const inputField = document.getElementById('ai-input-text');
    const responseBox = document.getElementById('ai-response-box');
    const userMessage = inputField.value;

    if (userMessage.trim() === "") return alert("กรุณาพิมพ์บอก AI ก่อนครับว่าอยากทานแนวไหน");

    responseBox.style.display = 'block';
    responseBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> พนักงาน AI กำลังคิดเมนูให้คุณ...';

    // 🔴 1. กุญแจ API ของคุณ (ใส่ให้แล้ว)
    const API_KEY = "AIzaSyBOekzsR947obi8IUqFslUO91WMhpIVt1M"; 
    
    // 🎯 2. อัปเดตใช้ชื่อรุ่นล่าสุดที่เซิร์ฟเวอร์ Google รองรับ (gemini-2.5-flash)
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const prompt = `
        คุณคือพนักงานเสิร์ฟอัจฉริยะของร้าน The Gourmet AI 
        นี่คือข้อมูลเมนูทั้งหมดในร้านของเรา: ${JSON.stringify(menuData)}
        
        ลูกค้าบอกความต้องการว่า: "${userMessage}"
        
        คำสั่ง: ให้คุณเลือกแนะนำเมนู 1-2 อย่างที่เหมาะสมกับลูกค้าที่สุดจากข้อมูลเมนูที่มี 
        ตอบกลับเป็นภาษาไทยที่สุภาพ เป็นกันเอง สั้นๆ กระชับ และบอกเหตุผลสั้นๆ ว่าทำไมถึงแนะนำ (ใช้ emoji ประกอบได้)
    `;

    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // 🎯 3. ระบบดักจับ Error: ถ้า Google ส่ง Error กลับมา ให้โชว์บนหน้าเว็บเลย (จะได้ไม่ต้องงมใน Console)
        if (data.error) {
            console.error("Google API Error:", data.error.message);
            responseBox.innerHTML = `❌ ระบบ AI ขัดข้องจากฝั่ง Google: <br><span style="color: #dc3545;">${data.error.message}</span>`;
            return;
        }

        // ดึงข้อความถ้าทำงานสำเร็จ
        const aiReply = data.candidates[0].content.parts[0].text;
        responseBox.innerHTML = `<strong>🤖 AI แนะนำ:</strong><br><br>${aiReply.replace(/\n/g, '<br>')}`;
        
    } catch (error) {
        console.error("System Error:", error);
        responseBox.innerHTML = '❌ ขออภัยครับ ระบบเครือข่ายขัดข้อง ลองใหม่อีกครั้งนะครับ';
    }
}
