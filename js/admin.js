const form = document.getElementById('menu-form');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// ==========================================
// 1. ระบบจัดการเมนูอาหาร (CRUD)
// ==========================================
function renderAdminMenu() {
    updateCategoryDatalist();
    const list = document.getElementById('admin-menu-list');
    list.innerHTML = '';
    menuData.forEach(item => {
        list.innerHTML += `
            <div class="admin-menu-row">
                <img src="${item.image}" width="60" height="60" style="border-radius:8px; object-fit:cover;">
                <div style="flex: 1; margin-left: 15px;">
                    <div style="font-weight: bold;">${item.name} <span style="color:#0A66C2;">(฿${item.price})</span></div>
                    <div style="font-size: 0.85rem; color: #777;">หมวด: ${item.category}</div>
                </div>
                <div>
                    <button class="btn-edit" onclick="editMenu(${item.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-delete" onclick="deleteMenu(${item.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
    });
}

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const idInput = document.getElementById('menu-id').value;
    const newData = {
        id: idInput ? Number(idInput) : (menuData.length > 0 ? Math.max(...menuData.map(i => i.id)) + 1 : 1),
        name: document.getElementById('menu-name').value,
        desc: document.getElementById('menu-desc').value,
        price: Number(document.getElementById('menu-price').value),
        category: document.getElementById('menu-category').value,
        image: document.getElementById('menu-image').value
    };

    if (idInput) {
        const index = menuData.findIndex(item => item.id == idInput);
        menuData[index] = newData;
    } else {
        menuData.push(newData);
    }
    saveMenuData(); renderAdminMenu(); resetForm();
});

function deleteMenu(id) {
    if (confirm('ลบเมนูนี้?')) { menuData = menuData.filter(item => item.id !== id); saveMenuData(); renderAdminMenu(); }
}

function editMenu(id) {
    const item = menuData.find(i => i.id === id);
    document.getElementById('menu-id').value = item.id;
    document.getElementById('menu-name').value = item.name;
    document.getElementById('menu-desc').value = item.desc;
    document.getElementById('menu-price').value = item.price;
    document.getElementById('menu-category').value = item.category;
    document.getElementById('menu-image').value = item.image;
    submitBtn.innerText = 'อัปเดตเมนู'; submitBtn.style.background = '#ffc107'; submitBtn.style.color = '#000';
    cancelBtn.style.display = 'block';
}

function resetForm() {
    form.reset(); document.getElementById('menu-id').value = '';
    submitBtn.innerText = 'บันทึกเมนู'; submitBtn.style.background = '#28a745'; submitBtn.style.color = '#fff';
    cancelBtn.style.display = 'none';
}
// ดึงรายชื่อหมวดหมู่ทั้งหมดที่มีในร้านมาใส่ในตัวเลือก (Datalist)
function updateCategoryDatalist() {
    const datalist = document.getElementById('category-list');
    if (!datalist) return;
    
    // ค้นหาหมวดหมู่ทั้งหมดแบบไม่ซ้ำกัน
    const categories = [...new Set(menuData.map(item => item.category))];
    
    datalist.innerHTML = '';
    categories.forEach(cat => {
        datalist.innerHTML += `<option value="${cat}">`;
    });
}
// ==========================================
// 2. ระบบจัดการโต๊ะ & รับเงิน (อัปเกรดเก็บประวัติ)
// ==========================================
function renderTableManagement() {
    const list = document.getElementById('active-tables-list');
    let orders = JSON.parse(localStorage.getItem('activeOrders')) || [];
    
    let tables = {};
    orders.forEach(o => {
        if(!tables[o.table]) tables[o.table] = 0;
        tables[o.table] += o.total;
    });

    list.innerHTML = '';
    if(Object.keys(tables).length === 0) list.innerHTML = '<p style="color:#777; text-align:center; padding: 20px;">ยังไม่มีลูกค้าสั่งอาหารครับ</p>';

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
    renderDailyIncome(); // อัปเดตรายได้วันนี้
}

function viewTableDetails(tableNo) {
    let orders = JSON.parse(localStorage.getItem('activeOrders')) || [];
    let tableOrders = orders.filter(o => o.table === tableNo);
    let itemsContainer = document.getElementById('modal-table-items');
    itemsContainer.innerHTML = '';
    let grandTotal = 0;

    tableOrders.forEach(order => {
        let orderBlock = `<div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #ddd;">
            <div style="font-size: 0.85rem; color: #777;">เวลาสั่ง: ${order.time}</div>`;
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

// 🎯 เช็คบิล (บันทึกข้อมูลอย่างละเอียดเพื่อทำ Analytics)
function checkoutTable(tableNo) {
    if(!confirm(`ยืนยันการชำระเงิน โต๊ะ ${tableNo}?`)) return;

    let orders = JSON.parse(localStorage.getItem('activeOrders')) || [];
    let salesHistory = JSON.parse(localStorage.getItem('dailySales')) || [];
    let tableOrders = orders.filter(o => o.table === tableNo);
    let totalIncome = tableOrders.reduce((sum, o) => sum + o.total, 0);

    // ดึงเวลาและแยกเดือน/ปี เพื่อใช้จัดกลุ่ม
    const now = new Date();
    const dateString = now.toLocaleDateString('th-TH'); // เช่น "2/4/2569"
    const monthYearString = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }); // เช่น "เมษายน 2569"
    
    salesHistory.push({
        id: Date.now(),
        date: dateString,
        monthYear: monthYearString,
        time: now.toLocaleTimeString('th-TH'),
        income: totalIncome,
        table: tableNo,
        items: tableOrders.flatMap(o => o.items) // ดึงของกินทั้งหมดมารวมไว้
    });

    let remainingOrders = orders.filter(o => o.table !== tableNo);
    localStorage.setItem('activeOrders', JSON.stringify(remainingOrders));
    localStorage.setItem('dailySales', JSON.stringify(salesHistory));

    alert(`รับเงินเรียบร้อย! ข้อมูลถูกบันทึกลงสถิติรายเดือน`);
    renderTableManagement();
    initSalesHistory(); // อัปเดตตารางสถิติทันที
}

// โชว์รายได้เฉพาะ "วันนี้" เท่านั้น
function renderDailyIncome() {
    let salesHistory = JSON.parse(localStorage.getItem('dailySales')) || [];
    const todayString = new Date().toLocaleDateString('th-TH');
    let todaySales = salesHistory.filter(s => s.date === todayString);
    let total = todaySales.reduce((sum, s) => sum + s.income, 0);
    document.getElementById('daily-income-display').innerText = `฿ ${total.toLocaleString()}`;
}


// ==========================================
// 📈 3. ระบบวิเคราะห์ยอดขายและประวัติ (Analytics)
// ==========================================
function initSalesHistory() {
    let salesHistory = JSON.parse(localStorage.getItem('dailySales')) || [];
    
    // 🛠️ Auto-Patch: ซ่อมบิลเก่าที่ไม่มีชื่อเดือน ให้กลายเป็น "เมษายน 2569" อัตโนมัติ
    let dataFixed = false;
    salesHistory.forEach(s => {
        if (!s.monthYear) {
            s.monthYear = "เมษายน 2569";
            dataFixed = true;
        }
    });
    // ถ้ามีการซ่อมข้อมูล ให้บันทึกทับลงฐานข้อมูลทันที
    if (dataFixed) localStorage.setItem('dailySales', JSON.stringify(salesHistory));

    const selector = document.getElementById('month-selector');
    let months = [...new Set(salesHistory.map(s => s.monthYear))]; 
    
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
    let salesHistory = JSON.parse(localStorage.getItem('dailySales')) || [];
    const selectedMonth = document.getElementById('month-selector').value;
    const list = document.getElementById('sales-history-list');
    
    if (salesHistory.length === 0) {
        document.getElementById('history-total-display').innerText = `฿ 0`;
        list.innerHTML = '<p style="text-align:center; color:#777; padding: 20px;">ยังไม่มีประวัติยอดขายครับ</p>';
        return;
    }

    list.innerHTML = '';

    // 🌟 โหมดที่ 1: ดูทุกเดือน (โชว์เป็นรายเดือน)
    if (selectedMonth === 'all') {
        let monthlyTotals = {};
        salesHistory.forEach(s => {
            if(!monthlyTotals[s.monthYear]) monthlyTotals[s.monthYear] = 0;
            monthlyTotals[s.monthYear] += s.income;
        });

        let grandTotal = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
        document.getElementById('history-total-display').innerText = `฿ ${grandTotal.toLocaleString()}`;

        let months = Object.keys(monthlyTotals).reverse();
        months.forEach(m => {
            list.innerHTML += `
                <div class="admin-menu-row" style="background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #ddd; padding: 15px;">
                    <div style="font-size: 1.2rem; font-weight: bold; color: #121212;">🗓️ เดือน ${m}</div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="color:#0A66C2; font-weight:bold; font-size: 1.3rem;">฿${monthlyTotals[m].toLocaleString()}</div>
                        <button class="add-btn" style="border-radius: 8px; background: #ffc107; color: #000; border: none; padding: 8px 15px;" onclick="expandMonth('${m}')"><i class="fa-solid fa-folder-open"></i> แตกดูรายวัน</button>
                    </div>
                </div>
            `;
        });
    } 
    // 🌟 โหมดที่ 2: ดูเจาะจงเดือน (โชว์เป็นรายวัน)
    else {
        let filteredSales = salesHistory.filter(s => s.monthYear === selectedMonth);
        let dailyTotals = {};
        
        filteredSales.forEach(s => {
            if(!dailyTotals[s.date]) dailyTotals[s.date] = 0;
            dailyTotals[s.date] += s.income;
        });

        let grandTotal = filteredSales.reduce((sum, s) => sum + s.income, 0);
        document.getElementById('history-total-display').innerText = `฿ ${grandTotal.toLocaleString()}`;

        let dates = Object.keys(dailyTotals).reverse();
        dates.forEach(date => {
            list.innerHTML += `
                <div class="admin-menu-row" style="background: white; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px left solid #0A66C2; border-left: 5px solid #00B4D8; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                    <div style="font-size: 1.1rem; font-weight: bold; color: #333; margin-left: 10px;">📅 วันที่ ${date}</div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="color:#28a745; font-weight:bold; font-size: 1.2rem;">฿${dailyTotals[date].toLocaleString()}</div>
                        <button class="add-btn" style="border-radius: 8px; padding: 8px 15px;" onclick="viewDailyDetails('${date}')">ดูบิล</button>
                    </div>
                </div>
            `;
        });
    }
}

function expandMonth(month) {
    document.getElementById('month-selector').value = month;
    renderSalesHistory();
}

function viewDailyDetails(dateString) {
    let salesHistory = JSON.parse(localStorage.getItem('dailySales')) || [];
    let daySales = salesHistory.filter(s => s.date === dateString);
    let container = document.getElementById('modal-daily-items');
    container.innerHTML = '';

    daySales.reverse().forEach((bill) => {
        let itemsHtml = '';
        
        if(bill.items && bill.items.length > 0) {
            bill.items.forEach(item => {
                itemsHtml += `<div style="display:flex; justify-content:space-between; font-size:0.95rem; margin-top:5px; border-bottom: 1px dashed #e0e0e0; padding-bottom: 5px;">
                    <span><span style="color:#0A66C2; font-weight:bold;">${item.qty}x</span> ${item.name}</span>
                    <span>฿${(item.price * item.qty).toLocaleString()}</span>
                </div>`;
            });
        } else {
            itemsHtml = `<div style="color:#aaa; font-size:0.85rem; text-align:center; padding: 10px 0;">(ไม่พบรายละเอียดเมนูในบิลนี้)</div>`;
        }

        let timeString = bill.time ? bill.time : "ไม่ระบุเวลา";

        container.innerHTML += `
            <div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
                    <strong style="color:#00B4D8; font-size: 1.1rem;">โต๊ะ ${bill.table}</strong>
                    <span style="color:#777; font-size:0.9rem;"><i class="fa-regular fa-clock"></i> เวลา: ${timeString}</span>
                </div>
                ${itemsHtml}
                <div style="text-align:right; margin-top:10px; font-weight:bold; color:#dc3545; font-size:1.1rem;">
                    ยอดรวมบิล: ฿${bill.income.toLocaleString()}
                </div>
            </div>
        `;
    });

    document.getElementById('modal-daily-title').innerText = `📅 ยอดขายประจำวันที่ ${dateString}`;
    document.getElementById('daily-detail-modal').style.display = 'flex';
}
function closeDailyModal() { document.getElementById('daily-detail-modal').style.display = 'none'; }

// เริ่มทำงานเมื่อเปิดหน้า Admin
renderAdminMenu();
initSalesHistory();
setInterval(renderTableManagement, 3000);
renderTableManagement();
