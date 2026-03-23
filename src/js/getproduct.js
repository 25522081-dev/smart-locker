import { db } from './firebase-config.js';
// Bạn có thể bỏ import checkSession ở đây nếu không dùng tới trong file này
import { collection, getDocs, query, orderBy, limit , addDoc, Timestamp, where, updateDoc, doc} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

export const getProductList = async () => {
    await checkExpiredOrders();
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
                    statusClass = 'status-available';
                    statusText = 'Available';
                    break;
                case 'occupied': case 'occ':
                    statusClass = 'status-occupied';
                    statusText = 'Occupied';
                    break;
                case 'maintenance': case 'mai':
                    statusClass = 'status-maintenance';
                    statusText = 'Maintenance';
                    break;
                case 'offline': case 'off':
                default:
                    statusClass = 'status-offline';
                    statusText = 'Offline';
                    break;
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
            // Đã xóa phần EventListener ở đây để gom về xử lý chung bên index.js
        }

    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu danh sách tủ: ", error);
    }
}

// Xử lý đơn hàng
export const handleOrder = async (lockerId, durationHours, pointsSpent) => {
    // 1. Kiểm tra phiên đăng nhập
    const userSession = JSON.parse(localStorage.getItem("user_session"));

    if (!userSession || !userSession.user || !userSession.user.email) {
        alert("Vui lòng đăng nhập để đặt tủ.");
        window.location.href = "login.html";
        return;
    }
    
    const userEmail = userSession.user.email;

    try {
        // 2. Truy vấn thông tin user từ Firestore để lấy số Point hiện tại
        const usersRef = collection(db, "users");
        const qUser = query(usersRef, where("email", "==", userEmail));
        const userSnapshot = await getDocs(qUser);

        if (userSnapshot.empty) {
            alert("Không tìm thấy thông tin tài khoản trên hệ thống!");
            return;
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        const currentPoints = userData.point || 0;

        // 3. Kiểm tra đủ điểm hay không
        if (currentPoints < pointsSpent) {
            alert(`Thanh toán thất bại! Bạn cần ${pointsSpent} point, nhưng hiện tại chỉ có ${currentPoints} point. Vui lòng nạp thêm.`);
            return;
        }

        // 4. Tiến hành trừ điểm của khách hàng
        const newPoints = currentPoints - pointsSpent;
        await updateDoc(userDoc.ref, {
            point: newPoints
        });

        // 5. Tính toán thời gian (start_time và end_time)
        const now = new Date(); 
        const endTimeDate = new Date(now.getTime() + durationHours * 60 * 60 * 1000); 

        const startTime = Timestamp.fromDate(now);
        const endTime = Timestamp.fromDate(endTimeDate);

        // 6. Tạo mã PIN ngẫu nhiên (6 số)
        const unlockPin = Math.floor(100000 + Math.random() * 900000).toString();

        // 7. Chuẩn bị dữ liệu để đẩy lên collection 'orders'
        const orderData = {
            locker_id: lockerId,
            user_id: userEmail, 
            duration_hours: Number(durationHours),
            points_spent: Number(pointsSpent),
            start_time: startTime,
            end_time: endTime,
            unlock_pin: unlockPin,
            status: "active"
        };

        // Bắn dữ liệu lên Firebase
        const docOrderRef = await addDoc(collection(db, "orders"), orderData);
        console.log("Đã tạo đơn hàng thành công với ID: ", docOrderRef.id);
        
        // 8. Cập nhật lại trạng thái của tủ thành 'occupied' (Dựa theo ID tủ)
        const lockerRef = doc(db, "lockers", lockerId);
        await updateDoc(lockerRef, {
            status: "occupied"
        });

        // 9. Thông báo cho người dùng
        // Đóng form popup đặt tủ
        const overlay = document.getElementById("orderOverlay");
        if (overlay) overlay.classList.remove("active");

        // Tìm các thẻ HTML của Modal
        const pointsElem = document.getElementById("modalRemainingPoints");
        const pinElem = document.getElementById("modalUnlockPin");
        const modalElem = document.getElementById("successModal");

        // Nếu TÌM THẤY toàn bộ các thẻ HTML của Modal thì chạy Modal
        if (pointsElem && pinElem && modalElem) {
            pointsElem.innerText = newPoints;
            pinElem.innerText = unlockPin;

            // Hiển thị Modal thông báo thành công bằng Bootstrap
            const successModal = new window.bootstrap.Modal(modalElem);
            successModal.show();

            // Lắng nghe sự kiện click nút "Đã hiểu" để reload lại trang
            const btnConfirm = document.getElementById("btnConfirmSuccess");
            if (btnConfirm) {
                btnConfirm.addEventListener("click", () => {
                    successModal.hide();
                    window.location.reload();
                }, { once: true });
            }
        } else {
            // NẾU KHÔNG TÌM THẤY (do thiếu code HTML hoặc đang ở trang khác) -> Dùng Alert dự phòng
            console.warn("Không tìm thấy giao diện Modal, chuyển sang dùng Alert.");
            alert(`Đặt tủ thành công!\nSố điểm còn lại: ${newPoints} point\nMã PIN mở khóa của bạn là: ${unlockPin}\nVui lòng lưu lại mã này.`);
            window.location.reload();
        }

    


    } catch (error) {
        console.error("Lỗi khi tạo đơn hàng: ", error);
        alert("Có lỗi xảy ra khi đặt tủ. Vui lòng thử lại.");
    }
};




// Kiểm tra quá hạn order
export const checkExpiredOrders = async () => {
    try {
        const now = new Date();
        // Lấy các order đang trong trạng thái "active"
        const qOrders = query(collection(db, "orders"), where("status", "==", "active"));
        const orderSnapshot = await getDocs(qOrders);

        const updatePromises = [];

        orderSnapshot.forEach((docSnap) => {
            const orderData = docSnap.data();
            // Chuyển Firebase Timestamp về Date object của JS
            const endTime = orderData.end_time.toDate(); 

            // Nếu thời gian hiện tại lớn hơn thời gian kết thúc -> Quá hạn
            if (now > endTime) {
                console.log(`Đơn hàng ${docSnap.id} đã quá hạn. Đang cập nhật...`);
                
                // 1. Cập nhật trạng thái order thành 'expired'
                const orderRef = docSnap.ref; 
                const updateOrder = updateDoc(orderRef, { status: "expired" });

                // 2. Cập nhật trạng thái locker lại thành 'available'
                // orderData.locker_id đang lưu ID của document tủ (vd: "A101")
                const lockerRef = doc(db, "lockers", orderData.locker_id);
                const updateLocker = updateDoc(lockerRef, { status: "available" });

                updatePromises.push(updateOrder, updateLocker);
            }
        });

        // Chạy tất cả các luồng cập nhật cùng lúc để tăng tốc độ
        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            console.log("Hoàn tất cập nhật các đơn hàng quá hạn.");
        }

    } catch (error) {
        console.error("Lỗi khi kiểm tra đơn hàng quá hạn: ", error);
    }
};