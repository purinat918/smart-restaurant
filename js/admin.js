const form = document.getElementById('menu-form');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// ==========================================
// 🍔 1. ระบบจัดการเมนูอาหาร (เชื่อมต่อ Cloud)
// ==========================================
// 🎯 ดักฟังการเปลี่ยนแปลงเมนูจาก Firebase (แทนที่ renderAdminMenu เดิม)
let adminMenuData = []; // เก็บข้อมูลเมนูไว้กรอง

listenToMenu((data) => {
    adminMenuData = data;
    updateCategoryDatalist();
    updateAdminCategoryFilter(); // อัปเดต Dropdown
    renderAdminMenu();
});

// ฟังก์ชันอัปเดต Dropdown หมวดหมู่
function updateAdminCategoryFilter() {
    const filter = document.getElementById('admin-category-filter');
    if(!filter) return;
    const currentVal = filter.value;
    const categories = [...new Set(adminMenuData.map(item => item.category))];
    
    let html = '<option value="all">ทุกหมวดหมู่</option>';
    categories.forEach(cat => {
        if(cat) html += `<option value="${cat}">${cat}</option>`;
    });
    filter.innerHTML = html;
    
    // พยายามจำค่าเดิมที่เลือกไว้
    if(categories.includes(currentVal) || currentVal === 'all') filter.value = currentVal;
}

// ฟังก์ชันวาดเมนู (เพิ่มระบบกรอง)
// ฟังก์ชันวาดเมนู (เพิ่มระบบกรอง และแก้รูปล้นจอแล้ว)
function renderAdminMenu() {
    const list = document.getElementById('admin-menu-list');
    const filterVal = document.getElementById('admin-category-filter') ? document.getElementById('admin-category-filter').value : 'all';
    
    list.innerHTML = '';
    
    // กรองข้อมูลตามที่เลือกใน Dropdown
    let filteredData = filterVal === 'all' ? adminMenuData : adminMenuData.filter(i => i.category === filterVal);

    if(filteredData.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#777; padding:20px;">ไม่พบเมนูในหมวดหมู่นี้</p>';
        return;
    }

    filteredData.forEach(item => {
        list.innerHTML += `
            <div class="admin-menu-row">
                <img src="${item.image}" width="60" height="60" style="border-radius:8px; object-fit:cover; flex-shrink:0;" onerror="this.src='https://via.placeholder.com/60?text=IMG'">
                
                <div class="menu-details" style="flex: 1; margin-left: 15px;">
                    <div style="font-weight: bold;">${item.name} <span style="color:#0A66C2;">(฿${item.price})</span></div>
                    <div style="font-size: 0.85rem; color: #777;">หมวด: ${item.category}</div>
                </div>
                
                <div class="menu-actions">
                    <button class="btn-edit" onclick="editMenu('${item.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-delete" onclick="deleteMenu('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
    });
}

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const idInput = document.getElementById('menu-id').value;
    
    // 🌟 กวาดข้อมูลตัวเลือกพิเศษทั้งหมดในฟอร์ม
    let menuOptions = [];
    document.querySelectorAll('.option-row').forEach(row => {
        let optName = row.querySelector('.opt-name').value.trim();
        let optChoices = row.querySelector('.opt-choices').value.trim();
        if (optName && optChoices) {
            // แยกด้วยลูกน้ำ แล้วเช็คว่ามีเครื่องหมาย + ไหม
            let choiceArray = optChoices.split(',').map(c => {
                let parts = c.split('+');
                let choiceName = parts[0].trim();
                let choicePrice = parts.length > 1 ? Number(parts[1].trim()) : 0;
                return { name: choiceName, price: choicePrice }; // เก็บเป็นก้อนชื่อและราคา
            }).filter(c => c.name !== '');
            menuOptions.push({ name: optName, choices: choiceArray });
        }
    });

    const newData = {
        name: document.getElementById('menu-name').value,
        desc: document.getElementById('menu-desc').value,
        price: Number(document.getElementById('menu-price').value),
        category: document.getElementById('menu-category').value,
        image: document.getElementById('menu-image').value,
        options: menuOptions // 🌟 ยัดตัวเลือกลงไปในฐานข้อมูลด้วย
    };

    if (idInput) newData.id = idInput; 

    submitBtn.innerText = 'กำลังบันทึก...';
    await saveMenuToCloud(newData);
    resetForm();
});

function deleteMenu(id) {
    if (confirm('ยืนยันการลบเมนูนี้ออกจากระบบ?')) { 
        deleteMenuFromCloud(id); // เรียกใช้ฟังก์ชันจาก data.js
    }
}

function editMenu(id) {
    const item = menuData.find(i => i.id === id);
    if(!item) return;

    document.getElementById('menu-id').value = item.id;
    document.getElementById('menu-name').value = item.name;
    document.getElementById('menu-desc').value = item.desc;
    document.getElementById('menu-price').value = item.price;
    document.getElementById('menu-category').value = item.category;
    document.getElementById('menu-image').value = item.image;

    // 🌟 ดึง Option กลับมาโชว์ตอนกดแก้ไข (เวอร์ชันอัปเกรด)
    document.getElementById('options-container').innerHTML = ''; 
    if (item.options && item.options.length > 0) {
        item.options.forEach(opt => {
            // ดึงชื่อและราคามาต่อกันด้วย + เหมือนเดิม
            let choiceString = opt.choices.map(c => {
                let cName = typeof c === 'string' ? c : c.name; // ดักข้อมูลเก่า
                let cPrice = typeof c === 'string' ? 0 : (c.price || 0);
                return cPrice > 0 ? `${cName}+${cPrice}` : cName;
            }).join(', ');
            addOptionField(opt.name, choiceString);
        });
    }
    
    submitBtn.innerText = 'อัปเดตเมนู'; 
    submitBtn.style.background = '#ffc107'; 
    submitBtn.style.color = '#000';
    cancelBtn.style.display = 'block';
}

function resetForm() {
    form.reset(); 
    document.getElementById('menu-id').value = '';
    document.getElementById('options-container').innerHTML = '';
    submitBtn.innerText = 'บันทึกเมนู'; 
    submitBtn.style.background = '#28a745'; 
    submitBtn.style.color = '#fff';
    cancelBtn.style.display = 'none';
}

function updateCategoryDatalist() {
    const datalist = document.getElementById('category-list');
    if (!datalist) return;
    const categories = [...new Set(menuData.map(item => item.category))];
    datalist.innerHTML = '';
    categories.forEach(cat => { datalist.innerHTML += `<option value="${cat}">`; });
}


// ==========================================
// 🍽️ 2. ระบบจัดการโต๊ะ & รับเงิน (Real-time)
// ==========================================
let activeOrdersData = [];

// 🎯 ดักฟังออเดอร์ที่ยังไม่จ่ายเงินจาก Firebase
function listenToActiveOrders() {
    db.collection("orders").onSnapshot((snapshot) => {
        activeOrdersData = [];
        snapshot.forEach(doc => {
            let data = doc.data();
            // เก็บเฉพาะบิลที่ยังไม่ถูกจ่าย (สถานะ new, cooking, served)
            if(data.status !== 'paid') {
                activeOrdersData.push({ docId: doc.id, ...data });
            }
        });
        renderTableManagement();
    });
}

function renderTableManagement() {
    const list = document.getElementById('active-tables-list');
    let tables = {};
    
    // รวมยอดเงินแยกตามโต๊ะ
    activeOrdersData.forEach(o => {
        if(!tables[o.table]) tables[o.table] = 0;
        tables[o.table] += o.total;
    });

    list.innerHTML = '';
    if(Object.keys(tables).length === 0) {
        list.innerHTML = '<p style="color:#777; text-align:center; padding: 20px;">ยังไม่มีลูกค้าทานอาหารครับ</p>';
    }

    for (let tableNo in tables) {
        // 🌟 โครงสร้างการ์ดบิลโต๊ะแบบใหม่ (แนวตั้ง สวยเป๊ะบนมือถือ)
        list.innerHTML += `
            <div style="background: #ffffff; border: 1px solid #eaeaea; border-left: 5px solid #0A66C2; border-radius: 12px; padding: 15px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #ddd; padding-bottom: 10px;">
                    <div style="font-size: 1.3rem; font-weight: bold; color: #121212;">
                        🍽️ โต๊ะ ${tableNo} 
                    </div>
                    <div style="font-size: 0.9rem; color: #0A66C2; cursor: pointer; text-decoration: underline; font-weight: 600;" onclick="viewTableDetails('${tableNo}')">
                        <i class="fa-solid fa-magnifying-glass"></i> ดูรายการ
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #777; font-size: 0.95rem; font-weight: 600;">ยอดที่ต้องชำระ:</span>
                    <span style="font-size: 1.6rem; font-weight: bold; color: #dc3545;">฿${tables[tableNo].toLocaleString()}</span>
                </div>

                <button onclick="checkoutTable('${tableNo}')" style="width: 100%; background: #0A66C2; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 1.1rem; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 5px rgba(10, 102, 194, 0.3);">
                    💰 เช็คบิล / รับเงิน
                </button>
                
            </div>`;
    }
}

function viewTableDetails(tableNo) {
    let tableOrders = activeOrdersData.filter(o => o.table === tableNo);
    let itemsContainer = document.getElementById('modal-table-items');
    itemsContainer.innerHTML = '';
    let grandTotal = 0;

    tableOrders.forEach(order => {
        let orderBlock = `<div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #ddd;">
            <div style="font-size: 0.85rem; color: #777;">เวลาสั่ง: ${order.time} | สถานะ: ${order.status}</div>`;
        order.items.forEach(item => {
            orderBlock += `<div style="display: flex; justify-content: space-between; margin-top: 8px;">
                    <div><span style="font-weight:bold; color:#0A66C2;">${item.qty}x</span> ${item.name}</div>
                    <div>฿${(item.price * item.qty).toLocaleString()}</div>
                </div>`;
        });
        orderBlock += `</div>`;
        itemsContainer.innerHTML += orderBlock;
        grandTotal += order.total;
    });

    itemsContainer.innerHTML += `<div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold; margin-top: 10px;"><span>ยอดรวมทั้งสิ้น:</span><span style="color: #dc3545;">฿${grandTotal.toLocaleString()}</span></div>`;
    document.getElementById('modal-table-title').innerText = `🍽️ รายการอาหาร โต๊ะ ${tableNo}`;
    
    document.getElementById('modal-checkout-btn').onclick = function() { closeTableModal(); checkoutTable(tableNo); };
    document.getElementById('table-detail-modal').style.display = 'flex';
}
function closeTableModal() { document.getElementById('table-detail-modal').style.display = 'none'; }

// 🎯 เช็คบิล (อัปเดตสถานะเป็น paid และบันทึกยอดขายขึ้น Cloud)
async function checkoutTable(tableNo) {
    if(!confirm(`ยืนยันการชำระเงิน โต๊ะ ${tableNo} ใช่หรือไม่?`)) return;

    let tableOrders = activeOrdersData.filter(o => o.table === tableNo);
    let totalIncome = tableOrders.reduce((sum, o) => sum + o.total, 0);

    const now = new Date();
    const dateString = now.toLocaleDateString('th-TH'); 
    const monthYearString = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }); 
    
    const newSale = {
        date: dateString,
        monthYear: monthYearString,
        time: now.toLocaleTimeString('th-TH'),
        income: totalIncome,
        table: tableNo,
        items: tableOrders.flatMap(o => o.items), 
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // เวลาเป๊ะๆ จากเซิร์ฟเวอร์
    };

    try {
        // 1. สร้างบิลยอดขายลงคอลเลกชัน "sales"
        await db.collection("sales").add(newSale);

        // 2. ใช้ "Batch" เพื่ออัปเดตสถานะออเดอร์หลายๆ อันเป็น "paid" พร้อมกัน
        let batch = db.batch();
        tableOrders.forEach(order => {
            let orderRef = db.collection("orders").doc(order.docId);
            batch.update(orderRef, { status: 'paid' });
        });
        await batch.commit();

        alert(`รับเงินเรียบร้อย! ข้อมูลวิ่งขึ้นคลาวด์แล้ว 🚀`);
    } catch (error) {
        console.error("Checkout Error:", error);
        alert("เกิดข้อผิดพลาดในการเช็คบิลครับ");
    }
}


// ==========================================
// 📈 3. ระบบวิเคราะห์ยอดขายและประวัติ (Analytics)
// ==========================================
let salesHistoryData = [];

// 🎯 ดักฟังประวัติการขายจาก Cloud
function listenToSales() {
    db.collection("sales").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        salesHistoryData = [];
        snapshot.forEach(doc => {
            salesHistoryData.push({ id: doc.id, ...doc.data() });
        });
        initSalesHistory();
        renderDailyIncome();
    });
}

function renderDailyIncome() {
    const todayString = new Date().toLocaleDateString('th-TH');
    let todaySales = salesHistoryData.filter(s => s.date === todayString);
    let total = todaySales.reduce((sum, s) => sum + s.income, 0);
    document.getElementById('daily-income-display').innerText = `฿ ${total.toLocaleString()}`;
}

function initSalesHistory() {
    const selector = document.getElementById('month-selector');
    let months = [...new Set(salesHistoryData.map(s => s.monthYear))]; 
    
    let options = '<option value="all">ดูทุกเดือนรวมกัน</option>';
    months.forEach(m => {
        options += `<option value="${m}">${m}</option>`;
    });
    
    let currentValue = selector.value;
    selector.innerHTML = options;
    
    if(months.includes(currentValue) || currentValue === 'all') {
        selector.value = currentValue;
    } else {
        selector.value = 'all'; 
    }
    renderSalesHistory();
}

function renderSalesHistory() {
    const selectedMonth = document.getElementById('month-selector').value;
    const list = document.getElementById('sales-history-list');
    
    if (salesHistoryData.length === 0) {
        document.getElementById('history-total-display').innerText = `฿ 0`;
        list.innerHTML = '<p style="text-align:center; color:#777; padding: 20px;">ยังไม่มีประวัติยอดขายครับ</p>';
        return;
    }

    list.innerHTML = '';

    if (selectedMonth === 'all') {
        let monthlyTotals = {};
        salesHistoryData.forEach(s => {
            if(!monthlyTotals[s.monthYear]) monthlyTotals[s.monthYear] = 0;
            monthlyTotals[s.monthYear] += s.income;
        });

        let grandTotal = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
        document.getElementById('history-total-display').innerText = `฿ ${grandTotal.toLocaleString()}`;

        let months = Object.keys(monthlyTotals);
        months.forEach(m => {
            list.innerHTML += `
                <div class="admin-menu-row" style="background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #ddd; padding: 15px;">
                    <div style="font-size: 1.2rem; font-weight: bold; color: #121212;">🗓️ เดือน ${m}</div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="color:#0A66C2; font-weight:bold; font-size: 1.3rem;">฿${monthlyTotals[m].toLocaleString()}</div>
                        <button class="add-btn" style="border-radius: 8px; background: #ffc107; color: #000; border: none; padding: 8px 15px;" onclick="expandMonth('${m}')">แตกดูรายวัน</button>
                    </div>
                </div>`;
        });
    } else {
        let filteredSales = salesHistoryData.filter(s => s.monthYear === selectedMonth);
        let dailyTotals = {};
        
        filteredSales.forEach(s => {
            if(!dailyTotals[s.date]) dailyTotals[s.date] = 0;
            dailyTotals[s.date] += s.income;
        });

        let grandTotal = filteredSales.reduce((sum, s) => sum + s.income, 0);
        document.getElementById('history-total-display').innerText = `฿ ${grandTotal.toLocaleString()}`;

        let dates = Object.keys(dailyTotals);
        dates.forEach(date => {
            list.innerHTML += `
                <div class="admin-menu-row" style="background: white; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px left solid #0A66C2; border-left: 5px solid #00B4D8;">
                    <div style="font-size: 1.1rem; font-weight: bold; color: #333; margin-left: 10px;">📅 วันที่ ${date}</div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="color:#28a745; font-weight:bold; font-size: 1.2rem;">฿${dailyTotals[date].toLocaleString()}</div>
                        <button class="add-btn" style="border-radius: 8px; padding: 8px 15px;" onclick="viewDailyDetails('${date}')">ดูบิล</button>
                    </div>
                </div>`;
        });
    }
}

function expandMonth(month) { document.getElementById('month-selector').value = month; renderSalesHistory(); }

function viewDailyDetails(dateString) {
    let daySales = salesHistoryData.filter(s => s.date === dateString);
    let container = document.getElementById('modal-daily-items');
    container.innerHTML = '';

    daySales.forEach((bill) => {
        let itemsHtml = '';
        if(bill.items && bill.items.length > 0) {
            bill.items.forEach(item => {
                itemsHtml += `<div style="display:flex; justify-content:space-between; font-size:0.95rem; margin-top:5px; border-bottom: 1px dashed #e0e0e0; padding-bottom: 5px;">
                    <span><span style="color:#0A66C2; font-weight:bold;">${item.qty}x</span> ${item.name}</span>
                    <span>฿${(item.price * item.qty).toLocaleString()}</span>
                </div>`;
            });
        }

        container.innerHTML += `
            <div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
                    <strong style="color:#00B4D8; font-size: 1.1rem;">โต๊ะ ${bill.table}</strong>
                    <span style="color:#777; font-size:0.9rem;">เวลา: ${bill.time}</span>
                </div>
                ${itemsHtml}
                <div style="text-align:right; margin-top:10px; font-weight:bold; color:#dc3545; font-size:1.1rem;">
                    ยอดรวมบิล: ฿${bill.income.toLocaleString()}
                </div>
            </div>`;
    });

    document.getElementById('modal-daily-title').innerText = `📅 ยอดขายประจำวันที่ ${dateString}`;
    document.getElementById('daily-detail-modal').style.display = 'flex';
}
function closeDailyModal() { document.getElementById('daily-detail-modal').style.display = 'none'; }


// ==========================================
// 🚀 เริ่มต้นทำงานเปิดเรดาร์รับข้อมูล
// ==========================================
listenToActiveOrders(); // เรดาร์ดักจับออเดอร์โต๊ะ
listenToSales();        // เรดาร์ดักจับยอดขาย



// ==========================================
// ⚙️ ฟังก์ชันจัดการ "ตัวเลือกพิเศษ" (Options)
// ==========================================
function addOptionField(name = '', choices = '') {
    const container = document.getElementById('options-container');
    const div = document.createElement('div');
    div.className = 'option-row';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    
    div.innerHTML = `
        <input type="text" class="admin-input opt-name" placeholder="ชื่อหัวข้อ เช่น หั่นไหม?" value="${name}" style="flex: 1; margin: 0;">
        <input type="text" class="admin-input opt-choices" placeholder="เช่น ไม่รับ, ไข่ดาว+10, ไส้กรอก+15" value="${choices}" style="flex: 2; margin: 0;">
        <button type="button" class="btn-delete" onclick="this.parentElement.remove()" style="margin: 0;">ลบ</button>
    `;
    container.appendChild(div);
}