// ฟังก์ชันวาดออเดอร์ในครัว
function renderOrders() {
    const board = document.getElementById('order-board');
    let allOrders = JSON.parse(localStorage.getItem('activeOrders')) || [];
    
    // กรองเอาเฉพาะออเดอร์ที่ "เพิ่งสั่ง" หรือ "กำลังทำ" มาโชว์ (ถ้าเสิร์ฟแล้วให้ซ่อน)
    let kitchenOrders = allOrders.filter(o => o.status === 'new' || o.status === 'cooking');
    
    board.innerHTML = ''; 

    kitchenOrders.forEach(order => {
        let itemsHtml = '';
        order.items.forEach(item => { 
            itemsHtml += `<div class="item"><div><span class="item-qty">${item.qty}x</span> ${item.name}</div></div>`; 
        });

        // 🎯 แก้บั๊กปุ่ม: ให้กดได้ 2 สเต็ป
        let buttonHtml = '';
        if (order.status === 'new') {
            buttonHtml = `<button class="btn-action btn-start" onclick="updateStatus(${order.orderId}, 'cooking')">เริ่มทำอาหาร</button>`;
        } else if (order.status === 'cooking') {
            buttonHtml = `<button class="btn-action btn-done" onclick="updateStatus(${order.orderId}, 'served')"><i class="fa-solid fa-bell-concierge"></i> ทำเสร็จแล้ว (เสิร์ฟ)</button>`;
        }

        board.innerHTML += `
            <div class="ticket ${order.status}">
                <div class="ticket-header">
                    <div><div class="table-no">โต๊ะ ${order.table}</div></div>
                    <div style="text-align:right;"><div class="order-time">${order.time}</div></div>
                </div>
                <div class="ticket-items">${itemsHtml}</div>
                <div class="ticket-footer">${buttonHtml}</div>
            </div>`;
    });
}

// ฟังก์ชันอัปเดตสถานะออเดอร์
function updateStatus(id, newStatus) {
    let orders = JSON.parse(localStorage.getItem('activeOrders')) || [];
    let order = orders.find(o => o.orderId === id);
    if(order) order.status = newStatus;
    
    localStorage.setItem('activeOrders', JSON.stringify(orders));
    renderOrders(); // โหลดหน้าจอใหม่ทันที
}

// 🎯 แก้บั๊กเวลา: ฟังก์ชันนาฬิกา
function updateClock() {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('th-TH');
}

// สั่งทำงาน
setInterval(updateClock, 1000); // นาฬิกาเดินทุก 1 วินาที
setInterval(renderOrders, 3000); // เช็คออเดอร์ใหม่ทุก 3 วินาที
updateClock();
renderOrders();