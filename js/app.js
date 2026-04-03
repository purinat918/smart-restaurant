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
    
    // 🌟 วาดปุ่มตัวเลือก (พร้อมราคา)
    const optionsBox = document.getElementById('detail-dynamic-options');
    optionsBox.innerHTML = '';
    if (currentSelectedItem.options && currentSelectedItem.options.length > 0) {
        currentSelectedItem.options.forEach((opt, optIndex) => {
            let html = `
                <div style="margin-top: 10px; background: #f8f9fa; padding: 10px; border-radius: 8px;">
                    <strong style="display:block; margin-bottom: 5px; color: #121212;">👉 ${opt.name}</strong>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">`;
            
            opt.choices.forEach((choice, choiceIndex) => {
                let choiceName = typeof choice === 'string' ? choice : choice.name;
                let choicePrice = typeof choice === 'string' ? 0 : (choice.price || 0);
                
                let isChecked = choiceIndex === 0 ? 'checked' : '';
                let priceLabel = choicePrice > 0 ? ` <span style="color:#28a745; font-weight:bold;">(+฿${choicePrice})</span>` : '';
                let valStr = `${choiceName}|${choicePrice}`; // เก็บทั้งชื่อและราคาซ่อนไว้ในปุ่ม
                
                html += `
                    <label style="background: white; padding: 6px 12px; border-radius: 20px; border: 1px solid #00B4D8; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                        <input type="radio" name="option_${optIndex}" value="${valStr}" ${isChecked} onchange="updateModalPrice()"> ${choiceName}${priceLabel}
                    </label>`;
            });
            html += `</div></div>`;
            optionsBox.innerHTML += html;
        });
    }

    document.querySelector('#item-detail-modal .confirm-order-btn').innerText = '+ เพิ่มลงตะกร้า';
    document.getElementById('item-detail-modal').style.display = 'flex';
    updateModalPrice(); // คำนวณราคาครั้งแรก
}

function updateModalPrice() {
    let totalExtra = 0;
    if (currentSelectedItem && currentSelectedItem.options) {
        currentSelectedItem.options.forEach((opt, optIndex) => {
            let selected = document.querySelector(`input[name="option_${optIndex}"]:checked`);
            if (selected) {
                let price = Number(selected.value.split('|')[1]); // แงะราคาออกมาจากปุ่ม
                totalExtra += price;
            }
        });
    }
    let finalPrice = currentSelectedItem.price + totalExtra;
    document.getElementById('detail-price').innerText = `฿ ${finalPrice}`;
}

function editCartItem(index) {
    const item = cart[index];
    currentSelectedItem = menuData.find(i => i.id === item.id); // ดึงข้อมูลต้นฉบับมาวาดปุ่มใหม่
    editingCartIndex = index; 

    document.getElementById('detail-name').innerText = currentSelectedItem.name;
    document.getElementById('detail-desc').innerText = currentSelectedItem.desc || '';
    document.getElementById('detail-img').src = currentSelectedItem.image;
    
    // ดึงเฉพาะข้อความหมายเหตุที่ลูกค้าเคยพิมพ์เองมาโชว์ (ไม่เอาท็อปปิ้งเก่ามาปน)
    document.getElementById('detail-note').value = item.customNote || ''; 

    // วาดปุ่มท็อปปิ้งใหม่ให้ลูกค้ากด (รีเซ็ตกลับเป็นค่าเริ่มต้น)
    openItemDetail(item.id); 
    editingCartIndex = index; // ต้องกำหนดค่าอีกรอบเพราะ openItemDetail มันไปล้างทิ้ง

    document.querySelector('#item-detail-modal .confirm-order-btn').innerText = '💾 บันทึกการแก้ไข (ตัวเลือกถูกรีเซ็ต)';
    closeCart();
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
    let selectedOptions = [];
    let totalExtraPrice = 0;

    // กวาดข้อมูลท็อปปิ้งที่ลูกค้าเลือก
    if (currentSelectedItem.options) {
        currentSelectedItem.options.forEach((opt, optIndex) => {
            let selectedRadio = document.querySelector(`input[name="option_${optIndex}"]:checked`);
            if (selectedRadio) {
                let parts = selectedRadio.value.split('|');
                let name = parts[0];
                let price = Number(parts[1]);
                
                let text = price > 0 ? `${opt.name}: ${name} (+฿${price})` : `${opt.name}: ${name}`;
                selectedOptions.push(text);
                totalExtraPrice += price;
            }
        });
    }

    let finalNoteText = selectedOptions.join(', ');
    if (customNote) finalNoteText += finalNoteText ? ` | ${customNote}` : customNote;
    
    // 🌟 เอาราคาอาหาร + ราคาท็อปปิ้ง
    let finalItemPrice = currentSelectedItem.price + totalExtraPrice;

    if (editingCartIndex !== null) {
        cart[editingCartIndex].note = finalNoteText;
        cart[editingCartIndex].customNote = customNote; // เซฟแยกไว้
        cart[editingCartIndex].price = finalItemPrice;  // อัปเดตราคาใหม่
        editingCartIndex = null;
    } else {
        const existingItem = cart.find(c => c.id === currentSelectedItem.id && c.note === finalNoteText);
        if(existingItem) {
            existingItem.qty += 1;
        } else {
            // ยัดลงตะกร้าพร้อมราคาที่บวกท็อปปิ้งแล้ว!
            cart.push({ ...currentSelectedItem, price: finalItemPrice, qty: 1, note: finalNoteText, customNote: customNote, cartId: Date.now() }); 
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
// ==========================================
// 📜 6. ดูประวัติการสั่งแบบหน้าต่าง Pop-up สวยๆ
// ==========================================
async function showHistory() {
    let myTable = localStorage.getItem('customerTable');
    if (!myTable) return alert("ไม่พบข้อมูลโต๊ะของคุณครับ");

    const container = document.getElementById('customer-history-container');
    container.innerHTML = '<div style="text-align:center; padding:20px; color:#0A66C2;"><i class="fa-solid fa-spinner fa-spin"></i> กำลังดึงข้อมูล...</div>';
    document.getElementById('customer-history-modal').style.display = 'flex';

    try {
        const snapshot = await db.collection("orders").where("table", "==", myTable).get();
        let activeOrders = [];
        
        snapshot.forEach(doc => {
            let order = doc.data();
            if (order.status !== 'paid') activeOrders.push(order);
        });

        // เรียงบิลล่าสุดขึ้นก่อน
        activeOrders.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        if (activeOrders.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#777; padding:20px; font-weight:bold;">ยังไม่มีประวัติการสั่งอาหารสำหรับรอบนี้ครับ</p>';
            return;
        }

        container.innerHTML = '';
        
        activeOrders.forEach(order => {
            // ป้ายกำกับสถานะ
            let statusHtml = "";
            if (order.status === 'new') statusHtml = '<span style="background:#dc3545; color:white; padding:4px 10px; border-radius:15px; font-size:0.8rem;">รับออเดอร์แล้ว 📝</span>';
            else if (order.status === 'cooking') statusHtml = '<span style="background:#ffc107; color:#000; padding:4px 10px; border-radius:15px; font-size:0.8rem;">กำลังทำ 👨‍🍳</span>';
            else if (order.status === 'served') statusHtml = '<span style="background:#28a745; color:white; padding:4px 10px; border-radius:15px; font-size:0.8rem;">เสิร์ฟแล้ว ✅</span>';

            // รายการอาหาร
            let itemsHtml = '';
            order.items.forEach(i => {
                let noteHtml = i.note ? `<div style="font-size:0.85rem; color:#dc3545; margin-left: 20px;">* ${i.note}</div>` : '';
                itemsHtml += `
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <div><span style="color:#0A66C2; font-weight:bold; margin-right:5px;">${i.qty}x</span> ${i.name} ${noteHtml}</div>
                        <div style="color:#555;">฿${(i.price * i.qty).toLocaleString()}</div>
                    </div>`;
            });

            // วาดกล่องบิลแต่ละใบ
            container.innerHTML += `
                <div style="background: white; border: 1px solid #eee; border-left: 4px solid #00B4D8; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">
                    <div style="display:flex; justify-content:space-between; border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; align-items: center;">
                        <div style="color: #777; font-size: 0.9rem;"><i class="fa-regular fa-clock"></i> เวลา: ${order.time}</div>
                        <div>${statusHtml}</div>
                    </div>
                    ${itemsHtml}
                    <div style="text-align:right; font-weight:bold; color:#0A66C2; font-size: 1.1rem; margin-top:10px; border-top: 1px dashed #eee; padding-top: 10px;">
                        ยอดรวม: ฿${order.total.toLocaleString()}
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Error fetching history:", error);
        container.innerHTML = '<p style="text-align:center; color:#dc3545; padding:20px;">❌ ดึงประวัติการสั่งไม่สำเร็จ</p>';
    }
}

function closeCustomerHistory() {
    document.getElementById('customer-history-modal').style.display = 'none';
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