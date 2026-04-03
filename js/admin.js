const form = document.getElementById('menu-form');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// ==========================================
// 🍔 1. ระบบจัดการเมนูอาหาร (เชื่อมต่อ Cloud)
// ==========================================
// 🎯 ดักฟังการเปลี่ยนแปลงเมนูจาก Firebase (แทนที่ renderAdminMenu เดิม)
listenToMenu((data) => {
    updateCategoryDatalist();
    const list = document.getElementById('admin-menu-list');
    list.innerHTML = '';
    
    data.forEach(item => {
        // ใช้ item.id เป็น String (เพราะ Firebase Gen ID ให้เป็นตัวหนังสือ)
        list.innerHTML += `
            <div class="admin-menu-row">
                <img src="${item.image}" width="60" height="60" style="border-radius:8px; object-fit:cover;">
                <div style="flex: 1; margin-left: 15px;">
                    <div style="font-weight: bold;">${item.name} <span style="color:#0A66C2;">(฿${item.price})</span></div>
                    <div style="font-size: 0.85rem; color: #777;">หมวด: ${item.category}</div>
                </div>
                <div>
                    <button class="btn-edit" onclick="editMenu('${item.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-delete" onclick="deleteMenu('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
    });
});

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const idInput = document.getElementById('menu-id').value;
    
    // 🌟 กวาดข้อมูลตัวเลือกพิเศษทั้งหมดในฟอร์ม
    let menuOptions = [];
    document.querySelectorAll('.option-row').forEach(row => {
        let optName = row.querySelector('.opt-name').value.trim();
        let optChoices = row.querySelector('.opt-choices').value.trim();
        if (optName && optChoices) {
            // แยกตัวเลือกด้วยลูกน้ำ (,) แล้วลบช่องว่างทิ้ง
            let choiceArray = optChoices.split(',').map(c => c.trim()).filter(c => c !== '');
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

    document.getElementById('options-container').innerHTML = ''; 
    if (item.options && item.options.length > 0) {
        item.options.forEach(opt => {
            addOptionField(opt.name, opt.choices.join(', '));
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
        list.innerHTML += `
            <div class="admin-menu-row" style="background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; flex-wrap: wrap;">
                <div style="flex:1; font-size: 1.2rem; cursor: pointer; padding: 10px 0;" onclick="viewTableDetails('${tableNo}')">
                    <strong>🍽️ โต๊ะ ${tableNo}</strong> <span style="font-size: 0.85rem; color: #0A66C2; text-decoration: underline; margin-left: 10px;">ดูรายการ</span>
                </div>
                <div style="color:#dc3545; font-weight:bold; font-size: 1.2rem; margin-right: 15px;">฿${tables[tableNo].toLocaleString()}</div>
                <button class="confirm-order-btn" style="width:auto; padding:8px 20px; background:#0A66C2;" onclick="checkoutTable('${tableNo}')">เช็คบิล / รับเงิน</button>
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
        <input type="text" class="admin-input opt-choices" placeholder="ตัวเลือก (คั่นด้วย , ) เช่น หั่น,ไม่หั่น" value="${choices}" style="flex: 2; margin: 0;">
        <button type="button" class="btn-delete" onclick="this.parentElement.remove()" style="margin: 0;">ลบ</button>
    `;
    container.appendChild(div);
}