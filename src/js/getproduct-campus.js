import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, addDoc, Timestamp, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// 1. Kiểm tra tủ quá hạn (Luôn chạy trước khi lấy data để đảm bảo tính Real-time)
export const checkExpiredOrders = async () => {
    try {
        const now = new Date();
        const qOrders = query(collection(db, "orders"), where("status", "==", "active"));
        const orderSnapshot = await getDocs(qOrders);
        const updatePromises = [];

        orderSnapshot.forEach((docSnap) => {
            const orderData = docSnap.data();
            const endTime = orderData.end_time.toDate(); 

            if (now > endTime) {
                const orderRef = docSnap.ref; 
                const updateOrder = updateDoc(orderRef, { status: "expired" });
                const lockerRef = doc(db, "lockers", orderData.locker_id);
                const updateLocker = updateDoc(lockerRef, { status: "available" });
                updatePromises.push(updateOrder, updateLocker);
            }
        });

        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
        }
    } catch (error) {
        console.error("Lỗi cập nhật tủ quá hạn: ", error);
    }
};

// 2. Lấy danh sách tủ ĐANG THUÊ của User hiện tại
export const getMyActiveLockers = async () => {
    const activeSection = document.getElementById("my-active-lockers-section");
    const activeList = document.getElementById("my-active-lockers-list");

    if (!activeSection || !activeList) return;

    const userSession = JSON.parse(localStorage.getItem("user_session"));
    if (!userSession || !userSession.user || !userSession.user.email) return;

    const userEmail = userSession.user.email;

    try {
        const qActive = query(collection(db, "orders"), where("user_id", "==", userEmail), where("status", "==", "active"));
        const querySnapshot = await getDocs(qActive);

        if (querySnapshot.empty) {
            activeSection.style.display = "none";
            return;
        }

        activeSection.style.display = "block";
        let htmls = "";

        querySnapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const endTimeStr = order.end_time.toDate().toLocaleString('vi-VN');
            
            // Render giao diện thẻ (Card) của tủ đang thuê với biến CSS custom
            htmls += `
            <div class="col-md-6 col-lg-4">
                <div class="card shadow-sm h-100" style="border: 2px solid var(--primary-color);">
                    <div class="card-header text-white d-flex justify-content-between align-items-center py-3" style="background-color: var(--primary-color); border-bottom: none;">
                        <h5 class="mb-0 fw-bold"><i class="fa-solid fa-door-closed me-2"></i>Tủ ${order.locker_id}</h5>
                        <span class="badge bg-white rounded-pill px-3 shadow-sm" style="color: var(--primary-color);">Đang thuê</span>
                    </div>
                    <div class="card-body">
                        <p class="mb-2 text-muted"><i class="fa-regular fa-clock me-2"></i>Hết hạn: <strong style="color: var(--danger-color);">${endTimeStr}</strong></p>
                        
                        <div class="p-3 bg-light rounded-3 text-center mt-3" style="border: 1px dashed var(--primary-color);">
                            <p class="mb-1 text-uppercase fw-bold text-secondary" style="font-size: 0.75rem;">Mã PIN của bạn</p>
                            <h2 class="fw-bolder mb-0" style="color: var(--primary-color); letter-spacing: 5px;">${order.unlock_pin}</h2>
                        </div>
                    </div>
                </div>
            </div>`;
        });

        activeList.innerHTML = htmls;

        


    } catch (error) {
        console.error("Lỗi lấy danh sách tủ active: ", error);
    }
};

// 3. Lấy toàn bộ danh sách tủ hiển thị ra màn hình
export const getCampusProductList = async () => {
    let htmls = "";
    try {
        const q = query(collection(db, 'lockers'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(doc => {
            const locker = doc.data();
            let statusClass = "";
            let statusText = "";

            switch(locker.status) {
                case 'available': case 'avl':
                    statusClass = 'status-available'; statusText = 'Available'; break;
                case 'occupied': case 'occ':
                    statusClass = 'status-occupied'; statusText = 'Occupied'; break;
                case 'maintenance': case 'mai':
                    statusClass = 'status-maintenance'; statusText = 'Maintenance'; break;
                case 'offline': case 'off': default:
                    statusClass = 'status-offline'; statusText = 'Offline'; break;
            }

            htmls += `
            <div class="product-item col-6 col-md-4">
                <div class="text p-2">
                    <button class="btn room-btn ${statusClass} w-100" type="button" data-id="${doc.id}">
                        <h5 class="mb-1 fw-bold">${locker.name}</h5>
                        <div class="status-text">${statusText}</div>
                    </button>
                </div>
            </div>`;
        });

        const productListContainer = document.querySelector('.product-list');
        if (productListContainer) {
            productListContainer.innerHTML = htmls;
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu danh sách tủ: ", error);
    }
};

// 4. Xử lý đặt tủ (chỉ dành cho trang Campus)
export const handleCampusOrder = async (lockerId, durationHours, pointsSpent) => {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    const userEmail = userSession.user.email;

    try {
        const qUser = query(collection(db, "users"), where("email", "==", userEmail));
        const userSnapshot = await getDocs(qUser);
        if (userSnapshot.empty) return alert("Lỗi xác thực tài khoản!");

        const userDoc = userSnapshot.docs[0];
        const currentPoints = userDoc.data().point || 0;

        if (currentPoints < pointsSpent) {
            return alert(`Thanh toán thất bại! Cần ${pointsSpent} point, bạn đang có ${currentPoints} point.`);
        }

        const newPoints = currentPoints - pointsSpent;
        await updateDoc(userDoc.ref, { point: newPoints });

        const now = new Date(); 
        const endTimeDate = new Date(now.getTime() + durationHours * 60 * 60 * 1000); 
        const unlockPin = Math.floor(100000 + Math.random() * 900000).toString();

        const orderData = {
            locker_id: lockerId,
            user_id: userEmail, 
            duration_hours: Number(durationHours),
            points_spent: Number(pointsSpent),
            start_time: Timestamp.fromDate(now),
            end_time: Timestamp.fromDate(endTimeDate),
            unlock_pin: unlockPin,
            status: "active"
        };

        await addDoc(collection(db, "orders"), orderData);
        await updateDoc(doc(db, "lockers", lockerId), { status: "occupied" });

        // Tự động Inject bảng thông báo nếu không có sẵn trong HTML
        const overlay = document.getElementById("orderOverlay");
        if (overlay) overlay.classList.remove("active");

        let modalElem = document.getElementById("successModal");
        if (!modalElem) {
            const modalHTML = `
            <div class="modal fade" id="successModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="modal-header border-0 bg-primary bg-gradient text-white d-flex flex-column align-items-center pt-5 pb-4">
                            <h4 class="modal-title fw-bold">Đặt tủ thành công!</h4>
                        </div>
                        <div class="modal-body text-center p-4">
                            <div class="p-4 mb-4 rounded-4" style="background-color: #f4f8ff; border: 2px dashed #0d6efd;">
                                <p class="text-secondary fw-bold">Mã PIN Mở Khóa</p>
                                <h1 class="display-3 fw-bolder text-primary mb-0" style="letter-spacing: 10px;">${unlockPin}</h1>
                            </div>
                            <p>Số dư: <strong class="text-warning">${newPoints}</strong> Point</p>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-primary px-5 rounded-pill" id="btnConfirmSuccess">Hoàn tất</button>
                        </div>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modalElem = document.getElementById("successModal");
        } else {
            document.getElementById("modalRemainingPoints").innerText = newPoints;
            document.getElementById("modalUnlockPin").innerText = unlockPin;
        }

        const successModal = new window.bootstrap.Modal(modalElem);
        successModal.show();
        document.getElementById("btnConfirmSuccess").addEventListener("click", () => {
            successModal.hide();
            window.location.reload();
        }, { once: true });

    } catch (error) {
        console.error("Lỗi hệ thống khi đặt tủ: ", error);
    }
};