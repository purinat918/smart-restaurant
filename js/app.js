let cart = []; // เก็บของในตะกร้า
let currentSelectedItem = null; // เก็บข้อมูลว่ากำลังกดดูเมนูไหนอยู่
let editingCartIndex = null;    // เก็บว่ากำลังแก้ไขตะกร้าช่องไหน

// ==========================================
// 1. เช็คเลขโต๊ะ
// ==========================================
const currentTable = localStorage.getItem('customerTable');
if (!currentTable) {
    window.location.href = 'welcome.html';
} else {
    document.getElementById('display-table').innerText = 'โต๊ะ ' + currentTable;
}

// ==========================================
// 🍔 2. ระบบวาดเมนู และหมวดหมู่
// ==========================================
function renderMenu(categoryToShow = 'all') {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = ''; 
    
    let filteredMenu = categoryToShow === 'all' ? menuData : menuData.filter(i => i.category === categoryToShow);

    // ป้องกันกรณีไม่มีเมนูในระบบให้โชว์ข้อความเตือน
    if (filteredMenu.length === 0) {
        menuList.innerHTML = '<p style="text-align:center; color:#777; width:100%; margin-top:50px;">ยังไม่มีรายการอาหารในระบบครับ<br>(กรุณาเพิ่มเมนูในหน้า Admin)</p>';
        return;
    }

    filteredMenu.forEach(item => {
        menuList.innerHTML += `
            <div class="menu-card" onclick="openItemDetail('${item.id}')" style="cursor: pointer;">
                <img src="${item.image}" class="menu-img" onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
                <div class="menu-info">
                    <div>
                        <div class="menu-name">${item.name}</div>
                        <div style="font-size: 0.8rem; color: #777;">${item.desc || ''}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="menu-price">฿ ${item.price}</div>
                        <button class="add-btn">+ เลือก</button>
                    </div>
                </div>
            </div>`;
    });
}

function renderCategoryButtons() {
    const container = document.getElementById('category-buttons-container');
    if (!container) return;

    const categories = [...new Set(menuData.map(item => item.category))];
    let html = `<button class="cat-btn active" onclick="filterMenu('all', this)">ทั้งหมด</button>`;
    
    categories.forEach(cat => {
        if(cat) html += `<button class="cat-btn" onclick="filterMenu('${cat}', this)">${cat}</button>`;
    });
    container.innerHTML = html;
}

function filterMenu(category, btn) {
    renderMenu(category);
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ==========================================
// 🔍 3. ระบบหน้าต่างรายละเอียดอาหาร (Modal)
// ==========================================
function openItemDetail(id) {
    currentSelectedItem = menuData.find(i => i.id === id);
    if (!currentSelectedItem) return;

    editingCartIndex = null; 

    document.getElementById('detail-name').innerText = currentSelectedItem.name;
    document.getElementById('detail-desc').innerText = currentSelectedItem.desc || '';
    document.getElementById('detail-price').innerText = `฿ ${currentSelectedItem.price}`;
    document.getElementById('detail-img').src = currentSelectedItem.image;
    document.getElementById('detail-note').value = ''; 
    
    // 🌟 วาดปุ่มตัวเลือก (Radio Buttons)
    const optionsBox = document.getElementById('detail-dynamic-options');
    optionsBox.innerHTML = '';
    if (currentSelectedItem.options && currentSelectedItem.options.length > 0) {
        currentSelectedItem.options.forEach((opt, optIndex) => {
            let html = `
                <div style="margin-top: 10px; background: #f8f9fa; padding: 10px; border-radius: 8px;">
                    <strong style="display:block; margin-bottom: 5px; color: #121212;">👉 ${opt.name}</strong>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">`;
            
            opt.choices.forEach((choice, choiceIndex) => {
                // เลือกอันแรกไว้เป็นค่าเริ่มต้นเสมอ (checked)
                let isChecked = choiceIndex === 0 ? 'checked' : '';
                html += `
                    <label style="background: white; padding: 6px 12px; border-radius: 20px; border: 1px solid #00B4D8; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                        <input type="radio" name="option_${optIndex}" value="${choice}" ${isChecked}> ${choice}
                    </label>`;
            });
            html += `</div></div>`;
            optionsBox.innerHTML += html;
        });
    }

    document.querySelector('#item-detail-modal .confirm-order-btn').innerText = '+ เพิ่มลงตะกร้า';
    document.getElementById('item-detail-modal').style.display = 'flex';
}

function editCartItem(index) {
    const item = cart[index];
    currentSelectedItem = item; 
    editingCartIndex = index;

    document.getElementById('detail-name').innerText = item.name;
    document.getElementById('detail-desc').innerText = item.desc || '';
    document.getElementById('detail-price').innerText = `฿ ${item.price}`;
    document.getElementById('detail-img').src = item.image;
    document.getElementById('detail-note').value = item.note || '';

    document.querySelector('#item-detail-modal .confirm-order-btn').innerText = '💾 บันทึกการแก้ไข';
    
    closeCart();
    document.getElementById('item-detail-modal').style.display = 'flex';
}

function closeItemDetail() {
    document.getElementById('item-detail-modal').style.display = 'none';
    if (editingCartIndex !== null) openCart(); 
}

// ==========================================
// 🛒 4. ระบบตะกร้าสินค้า
// ==========================================
function confirmAddToCart() {
    let customNote = document.getElementById('detail-note').value.trim();
    
    // 🌟 เก็บค่าจากปุ่มตัวเลือกที่ลูกค้ากด
    let selectedOptions = [];
    if (currentSelectedItem.options) {
        currentSelectedItem.options.forEach((opt, optIndex) => {
            let selectedRadio = document.querySelector(`input[name="option_${optIndex}"]:checked`);
            if (selectedRadio) {
                selectedOptions.push(`${opt.name}: ${selectedRadio.value}`);
            }
        });
    }

    // เอาปุ่มที่เลือก มารวมกับข้อความหมายเหตุ เช่น "หั่นไหม: ไม่หั่น | เผ็ดน้อย"
    let finalNoteText = selectedOptions.join(', ');
    if (customNote) {
        finalNoteText += finalNoteText ? ` | ${customNote}` : customNote;
    }

    if (editingCartIndex !== null) {
        cart[editingCartIndex].note = finalNoteText;
        editingCartIndex = null;
    } else {
        const existingItem = cart.find(c => c.id === currentSelectedItem.id && c.note === finalNoteText);
        if(existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({ ...currentSelectedItem, qty: 1, note: finalNoteText, cartId: Date.now() }); 
        }
    }
    
    document.getElementById('item-detail-modal').style.display = 'none';
    updateFloatingCart();
    openCart(); 
    renderCartModal();
}

function renderCartModal() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
    let totalPrice = 0;
    
    cart.forEach((item, index) => {
        totalPrice += (item.price * item.qty);
        let noteHtml = item.note ? `<div style="font-size: 0.85rem; color: #dc3545; margin-top: 5px;"><i class="fa-solid fa-comment-dots"></i> ${item.note}</div>` : '';
        
        container.innerHTML += `
            <div class="cart-item" style="flex-direction: column; align-items: stretch;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-weight:bold;">${item.name}</div>
                        <div style="font-size: 0.8rem; color: #0A66C2; cursor: pointer; margin-top: 3px;" onclick="editCartItem(${index})">
                            <i class="fa-solid fa-pen"></i> แก้ไขหมายเหตุ
                        </div>
                    </div>
                    <div style="color:#0A66C2; font-weight:bold;">฿ ${item.price * item.qty}</div>
                </div>
                ${noteHtml}
                <div class="qty-controls" style="justify-content: flex-end; margin-top: 10px;">
                    <button class="qty-btn del" onclick="changeQty(${index}, -1)">-</button>
                    <span style="font-weight:bold; width:20px; text-align:center;">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>`;
    });
    
    document.getElementById('cart-total-price').innerText = `฿ ${totalPrice}`;
}

function changeQty(index, amount) {
    cart[index].qty += amount;
    if(cart[index].qty <= 0) cart.splice(index, 1);
    updateFloatingCart();
    renderCartModal();
}

function openCart() { document.getElementById('cart-modal').style.display = 'flex'; }
function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

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
        closeCart(); 
    }
}

// ==========================================
// 🚀 5. ส่งออเดอร์ขึ้น Cloud (Firebase)
// ==========================================
async function submitOrder() {
    if (cart.length === 0) return;
    const newOrder = {
        table: localStorage.getItem('customerTable') || "ไม่ระบุ", 
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
        status: 'new', 
        time: new Date().toLocaleTimeString('th-TH'),
        timestamp: firebase.firestore.FieldValue.serverTimestamp() 
    };

    try {
        await db.collection("orders").add(newOrder);
        alert("ส่งออเดอร์เข้าครัวเรียบร้อยแล้ว! 🚀");
        cart = []; 
        updateFloatingCart();
        closeCart();
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("❌ การเชื่อมต่อขัดข้อง กรุณาลองส่งออเดอร์ใหม่อีกครั้งครับ");
    }
}

// ==========================================
// 📜 6. ดูประวัติการสั่ง (ดึงจาก Firebase)
// ==========================================
// ==========================================
// 📜 6. ดูประวัติการสั่ง (ดึงเฉพาะบิลรอบปัจจุบันที่ยังไม่เช็คบิล)
// ==========================================
async function showHistory() {
    let myTable = localStorage.getItem('customerTable');
    if (!myTable) return alert("ไม่พบข้อมูลโต๊ะของคุณครับ");

    try {
        // วิ่งไปดึงออเดอร์ของโต๊ะตัวเองจาก Firebase
        const snapshot = await db.collection("orders").where("table", "==", myTable).get();
        
        let activeOrders = [];
        
        // 🌟 กรองเอาเฉพาะบิลที่ "ยังไม่จ่ายเงิน" (ของลูกค้ารอบปัจจุบัน)
        snapshot.forEach(doc => {
            let order = doc.data();
            if (order.status !== 'paid') {
                activeOrders.push(order);
            }
        });

        // ถ้าไม่มีออเดอร์ที่ยังไม่จ่ายเงินเลย แสดงว่าเพิ่งเข้ามานั่งใหม่
        if (activeOrders.length === 0) return alert("ยังไม่มีประวัติการสั่งอาหารสำหรับรอบนี้ครับ");

        let historyText = `--- ประวัติการสั่ง โต๊ะ ${myTable} ---\n`;
        
        // เอามาวาดใส่ข้อความโชว์ลูกค้า
        activeOrders.forEach(order => {
            // แปลงสถานะภาษาอังกฤษให้เป็นภาษาไทยให้ลูกค้าอ่านง่ายๆ
            let statusThai = "รับออเดอร์แล้ว";
            if (order.status === 'cooking') statusThai = "กำลังทำ 👨‍🍳";
            if (order.status === 'served') statusThai = "เสิร์ฟแล้ว ✅";

            historyText += `\nเวลา: ${order.time} | สถานะ: ${statusThai}\n`;
            
            order.items.forEach(i => {
                historyText += `- ${i.name} x${i.qty}`;
                if(i.note) historyText += ` (*${i.note})`;
                historyText += `\n`;
            });
        });
        
        alert(historyText);

    } catch (error) {
        console.error("Error fetching history:", error);
        alert("ดึงประวัติการสั่งไม่สำเร็จครับ");
    }
}

// ==========================================
// 🤖 7. ระบบ AI Waiter (เชื่อมต่อ Google Gemini)
// ==========================================
async function askAI() {
    const inputField = document.getElementById('ai-input-text');
    const responseBox = document.getElementById('ai-response-box');
    const userMessage = inputField.value;

    if (userMessage.trim() === "") return alert("กรุณาพิมพ์บอก AI ก่อนครับว่าอยากทานแนวไหน");

    responseBox.style.display = 'block';
    responseBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> พนักงาน AI กำลังคิดเมนูให้คุณ...';

    const API_KEY = "AIzaSyBOekzsR947obi8IUqFslUO91WMhpIVt1M"; 
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
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        if (data.error) {
            console.error("Google API Error:", data.error.message);
            responseBox.innerHTML = `❌ ระบบ AI ขัดข้อง: <br><span style="color: #dc3545;">${data.error.message}</span>`;
            return;
        }

        const aiReply = data.candidates[0].content.parts[0].text;
        responseBox.innerHTML = `<strong>🤖 AI แนะนำ:</strong><br><br>${aiReply.replace(/\n/g, '<br>')}`;
    } catch (error) {
        console.error("System Error:", error);
        responseBox.innerHTML = '❌ ขออภัยครับ ระบบเครือข่ายขัดข้อง ลองใหม่อีกครั้งนะครับ';
    }
}

// ==========================================
// 🚀 8. เริ่มทำงานเมื่อเปิดหน้าเว็บ
// ==========================================
listenToMenu((data) => {
    renderCategoryButtons(); 
    renderMenu();            
});