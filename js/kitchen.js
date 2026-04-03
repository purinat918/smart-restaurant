// ==========================================
// 👨‍🍳 ระบบหลังครัว Real-time (Firebase)
// ==========================================
const board = document.getElementById('order-board');

// 🎯 1. ดึงข้อมูลแบบ Real-time ด้วย onSnapshot
function listenToOrders() {
    // ดึงข้อมูลจากคอลเลกชัน orders เรียงตามเวลาที่สั่ง (ใครสั่งก่อน ทำก่อน)
    db.collection("orders").orderBy("timestamp", "asc").onSnapshot((snapshot) => {
        board.innerHTML = ''; // ล้างกระดานก่อนวาดใหม่
        
        let hasActiveOrders = false;

        // วนลูปดูออเดอร์ทั้งหมดที่เด้งเข้ามา
        snapshot.forEach((doc) => {
            const order = doc.data();
            const docId = doc.id; // ใช้ ID อ้างอิงจาก Firebase โดยตรง

            // กรองเอาเฉพาะออเดอร์ที่ "เพิ่งสั่ง" หรือ "กำลังทำ"
            if (order.status === 'new' || order.status === 'cooking') {
                hasActiveOrders = true;
                
                let itemsHtml = '';
                order.items.forEach(item => { 
                    // เช็คว่ามีหมายเหตุไหม ถ้ามีให้โชว์ตัวอักษรสีแดง
                    let noteHtml = item.note ? `<div style="font-size: 0.9rem; color: #dc3545; margin-left: 30px; margin-bottom: 5px;">* ${item.note}</div>` : '';
                    
                    itemsHtml += `
                        <div class="item" style="flex-direction: column; align-items: flex-start;">
                            <div><span class="item-qty">${item.qty}x</span> ${item.name}</div>
                            ${noteHtml}
                        </div>`; 
                });

                // สร้างปุ่มตามสถานะ (สังเกตว่าเราส่ง docId ไปแทน orderId เดิม)
                let buttonHtml = '';
                if (order.status === 'new') {
                    buttonHtml = `<button class="btn-action btn-start" onclick="updateStatus('${docId}', 'cooking')">เริ่มทำอาหาร</button>`;
                } else if (order.status === 'cooking') {
                    buttonHtml = `<button class="btn-action btn-done" onclick="updateStatus('${docId}', 'served')"><i class="fa-solid fa-bell-concierge"></i> ทำเสร็จแล้ว (เสิร์ฟ)</button>`;
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
            }
        });

        // ถ้าไม่มีออเดอร์เลย ให้โชว์ข้อความน่ารักๆ
        if (!hasActiveOrders) {
            board.innerHTML = '<h3 style="color: #888; text-align: center; width: 100%; margin-top: 50px;"><i class="fa-solid fa-mug-hot"></i> ไม่มีออเดอร์ค้างครับ เชฟพักผ่อนได้! 😎</h3>';
        }

    }, (error) => {
        console.error("🔥 เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    });
}

// 🎯 2. ฟังก์ชันอัปเดตสถานะออเดอร์
async function updateStatus(docId, newStatus) {
    try {
        // วิ่งไปอัปเดตสถานะใน Firebase
        await db.collection("orders").doc(docId).update({
            status: newStatus
        });
        
        // 💡 ความเจ๋ง: เราไม่ต้องเรียก renderOrders() หรือเขียนโค้ดโหลดหน้าจอใหม่แล้ว!
        // เพราะ onSnapshot ด้านบนมันจะรู้ตัวอัตโนมัติว่าข้อมูลถูกแก้ แล้วมันจะวาดหน้าจอให้ใหม่ทันที!
        
    } catch (error) {
        console.error("Error updating status: ", error);
        alert("❌ อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่");
    }
}

// 🎯 3. ฟังก์ชันนาฬิกา
function updateClock() {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('th-TH');
}



// ==========================================
// 📜 ระบบดูประวัติการเสิร์ฟของ "วันนี้"
// ==========================================
async function openKitchenHistory() {
    const container = document.getElementById('kitchen-history-container');
    container.innerHTML = '<div style="text-align:center; padding:20px; color:#0A66C2;"><i class="fa-solid fa-spinner fa-spin"></i> กำลังดึงข้อมูลออเดอร์ของวันนี้...</div>';
    document.getElementById('kitchen-history-modal').style.display = 'flex';

    try {
        // 1. หาเวลาเที่ยงคืนของวันนี้ เพื่อใช้เป็นจุดเริ่มต้นการค้นหา
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // 2. ไปดึงบิล "ทั้งหมด" ของวันนี้มาจาก Cloud
        const snapshot = await db.collection("orders")
            .where("timestamp", ">=", startOfToday)
            .get();

        let historyOrders = [];

        // 3. กรองเอาเฉพาะบิลที่ "เสิร์ฟแล้ว (served)" หรือ "แอดมินคิดเงินแล้ว (paid)"
        snapshot.forEach(doc => {
            let order = doc.data();
            if (order.status === 'served' || order.status === 'paid') {
                historyOrders.push({ id: doc.id, ...order });
            }
        });

        // 4. เรียงลำดับเอา "บิลที่เพิ่งเสิร์ฟล่าสุด" ขึ้นก่อน (เรียงตามเวลา)
        historyOrders.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        if (historyOrders.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#777; padding:20px;">ยังไม่มีออเดอร์ที่ทำเสร็จในวันนี้ครับ</p>';
            return;
        }

        // 5. วาดประวัติลงหน้าจอ
        container.innerHTML = '';
        historyOrders.forEach(order => {
            let itemsHtml = '';
            order.items.forEach(item => {
                let noteHtml = item.note ? `<span style="color:#dc3545; font-size:0.85rem;">(*${item.note})</span>` : '';
                itemsHtml += `<div style="margin-bottom: 5px; font-size: 1.05rem;">- <span style="font-weight:bold; color:#0A66C2;">${item.qty}x</span> ${item.name} ${noteHtml}</div>`;
            });

            // ป้ายกำกับสถานะ
            let statusBadge = order.status === 'paid' 
                ? `<span style="background:#28a745; color:white; padding:4px 10px; border-radius:15px; font-size:0.8rem;"><i class="fa-solid fa-check"></i> เช็คบิลแล้ว</span>`
                : `<span style="background:#ffc107; color:#000; padding:4px 10px; border-radius:15px; font-size:0.8rem;"><i class="fa-solid fa-bell-concierge"></i> เสิร์ฟแล้ว</span>`;

            container.innerHTML += `
                <div style="background: #fff; border: 1px solid #ddd; border-left: 5px solid #0A66C2; border-radius: 8px; padding: 15px; margin-bottom: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding-bottom: 10px; margin-bottom: 10px; align-items: center;">
                        <div style="font-weight: bold; font-size: 1.2rem;">โต๊ะ ${order.table} ${statusBadge}</div>
                        <div style="color: #777; font-size: 0.9rem;"><i class="fa-regular fa-clock"></i> สั่งตอน: ${order.time}</div>
                    </div>
                    <div>${itemsHtml}</div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Error fetching kitchen history:", error);
        container.innerHTML = '<p style="text-align:center; color:#dc3545; padding:20px;">❌ เกิดข้อผิดพลาดในการดึงข้อมูล</p>';
    }
}

function closeKitchenHistory() {
    document.getElementById('kitchen-history-modal').style.display = 'none';
}

// สั่งทำงานเมื่อเปิดหน้าเว็บ
setInterval(updateClock, 1000); // นาฬิกาเดินทุก 1 วินาที
updateClock();
listenToOrders(); // เริ่มเปิดเรดาร์ดักฟังออเดอร์