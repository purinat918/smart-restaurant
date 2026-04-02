const form = document.getElementById('menu-form');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// 1. ฟังก์ชันวาดรายการอาหารในหน้า Admin
function renderAdminMenu() {
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
            </div>
        `;
    });
}

// 2. ฟังก์ชันเพิ่ม หรือ อัปเดต เมนู
form.addEventListener('submit', function(e) {
    e.preventDefault(); // ป้องกันเว็บรีเฟรช

    const idInput = document.getElementById('menu-id').value;
    const newName = document.getElementById('menu-name').value;
    const newDesc = document.getElementById('menu-desc').value;
    const newPrice = document.getElementById('menu-price').value;
    const newCategory = document.getElementById('menu-category').value;
    const newImage = document.getElementById('menu-image').value;

    if (idInput) {
        // กรณี: กำลัง "แก้ไข" เมนูเดิม
        const index = menuData.findIndex(item => item.id == idInput);
        menuData[index] = {
            id: Number(idInput),
            name: newName,
            desc: newDesc,
            price: Number(newPrice),
            category: newCategory,
            image: newImage
        };
        alert('อัปเดตเมนูเรียบร้อย!');
    } else {
        // กรณี: "เพิ่ม" เมนูใหม่
        const newId = menuData.length > 0 ? Math.max(...menuData.map(i => i.id)) + 1 : 1; // สร้าง ID รันเลขต่อกัน
        menuData.push({
            id: newId,
            name: newName,
            desc: newDesc,
            price: Number(newPrice),
            category: newCategory,
            image: newImage
        });
        alert('เพิ่มเมนูใหม่เรียบร้อย!');
    }

    saveMenuData(); // เซฟลง LocalStorage
    renderAdminMenu(); // วาดตารางใหม่
    resetForm(); // ล้างฟอร์ม
});

// 3. ฟังก์ชันลบเมนู
function deleteMenu(id) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?')) {
        menuData = menuData.filter(item => item.id !== id);
        saveMenuData();
        renderAdminMenu();
    }
}

// 4. ฟังก์ชันดึงข้อมูลมาแก้ไข
function editMenu(id) {
    const item = menuData.find(i => i.id === id);
    
    // เติมข้อมูลลงในฟอร์ม
    document.getElementById('menu-id').value = item.id;
    document.getElementById('menu-name').value = item.name;
    document.getElementById('menu-desc').value = item.desc;
    document.getElementById('menu-price').value = item.price;
    document.getElementById('menu-category').value = item.category;
    document.getElementById('menu-image').value = item.image;

    // เปลี่ยนหน้าตาปุ่ม
    submitBtn.innerText = 'อัปเดตเมนู';
    submitBtn.style.background = '#ffc107'; // เปลี่ยนปุ่มเป็นสีเหลือง
    submitBtn.style.color = '#000';
    cancelBtn.style.display = 'block';
}

// 5. ล้างฟอร์มให้เป็นเหมือนเดิม
function resetForm() {
    form.reset();
    document.getElementById('menu-id').value = '';
    submitBtn.innerText = 'บันทึกเมนู';
    submitBtn.style.background = '#28a745'; // กลับเป็นสีเขียว
    submitBtn.style.color = '#fff';
    cancelBtn.style.display = 'none';
}

// เปิดหน้ามาปุ๊บ ให้วาดตารางปั๊บ
renderAdminMenu();

// 1. ฟังก์ชันแสดงโต๊ะที่ค้างจ่าย
// ในไฟล์ js/admin.js ค้นหาฟังก์ชันนี้แล้ววางทับครับ
function renderTableManagement() {
    const list = document.getElementById('active-tables-list');
    let orders = JSON.parse(localStorage.getItem('activeOrders')) || [];
    
    let tables = {};
    orders.forEach(o => {
        if(!tables[o.table]) tables[o.table] = 0;
        tables[o.table] += o.total;
    });

    list.innerHTML = '';
    if(Object.keys(tables).length === 0) {
        list.innerHTML = '<p style="color:#777; text-align:center; padding: 20px;">ยังไม่มีลูกค้าสั่งอาหารครับ</p>';
    }

    for (let tableNo in tables) {
        list.innerHTML += `
            <div class="admin-menu-row" style="background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                <div style="flex:1; font-size: 1.2rem;"><strong>🍽️ โต๊ะ ${tableNo}</strong></div>
                <div style="flex:1; color:#dc3545; font-weight:bold; font-size: 1.2rem;">฿${tables[tableNo].toLocaleString()}</div>
                <button class="confirm-order-btn" style="width:auto; padding:8px 20px; background:#0A66C2;" onclick="checkoutTable('${tableNo}')">เช็คบิล / รับเงิน</button>
            </div>`;
    }
    renderDailyIncome();
}

// 2. ฟังก์ชันเช็คบิล (ย้ายข้อมูลจาก active ไปเป็นรายได้)
function checkoutTable(tableNo) {
    if(!confirm(`ยืนยันการชำระเงิน โต๊ะ ${tableNo}?`)) return;

    let orders = JSON.parse(localStorage.getItem('activeOrders')) || [];
    let salesHistory = JSON.parse(localStorage.getItem('dailySales')) || [];

    // ดึงออเดอร์ของโต๊ะนี้ออกมา
    let tableOrders = orders.filter(o => o.table === tableNo);
    let totalIncome = tableOrders.reduce((sum, o) => sum + o.total, 0);

    // บันทึกลงประวัติรายได้
    salesHistory.push({
        date: new Date().toLocaleDateString(),
        income: totalIncome,
        table: tableNo
    });

    // ลบออเดอร์โต๊ะนี้ออกจาก Active (จ่ายเงินแล้วหายไปจากหน้าครัว/หน้าลูกค้า)
    let remainingOrders = orders.filter(o => o.table !== tableNo);
    
    localStorage.setItem('activeOrders', JSON.stringify(remainingOrders));
    localStorage.setItem('dailySales', JSON.stringify(salesHistory));

    alert(`เช็คบิลเรียบร้อย! รายได้เพิ่มขึ้น ฿${totalIncome}`);
    renderTableManagement();
}

// 3. แสดงรายได้รวม
function renderDailyIncome() {
    let salesHistory = JSON.parse(localStorage.getItem('dailySales')) || [];
    let total = salesHistory.reduce((sum, s) => sum + s.income, 0);
    document.getElementById('daily-income-display').innerText = `฿ ${total.toLocaleString()}`;
}

function clearDailySales() {
    if(confirm('ต้องการล้างรายได้ทั้งหมดเพื่อเริ่มวันใหม่ใช่หรือไม่?')) {
        localStorage.removeItem('dailySales');
        renderTableManagement();
    }
}

// เรียกทำงาน
setInterval(renderTableManagement, 3000);
renderTableManagement();