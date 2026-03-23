import { checkExpiredOrders, getMyActiveLockers, getCampusProductList, handleCampusOrder } from "./getproduct-campus.js";
import { handleUserInfo } from "./user_info.js";

document.addEventListener("DOMContentLoaded", async function() {
    
    // 0. Load Header & User Profile
    handleUserInfo();

    // 1. Quét và cập nhật tủ quá hạn trước khi load giao diện
    await checkExpiredOrders();

    // 2. Load các tủ đang thuê và toàn bộ tủ
    await getMyActiveLockers();
    await getCampusProductList();

    // 3. Xử lý logic Form Order Overlay
    const overlay = document.getElementById("orderOverlay");
    const lockerIdInput = document.getElementById("lockerId");
    const productListContainer = document.querySelector('.product-list');

    // Bắt sự kiện Click chọn tủ
    if (productListContainer) {
        productListContainer.addEventListener("click", function(event) {
            const clickedBtn = event.target.closest(".status-available");
            if (clickedBtn) {
                const userSession = JSON.parse(localStorage.getItem("user_session"));
                if (!userSession || !userSession.user || !userSession.user.email) {
                    alert("Vui lòng đăng nhập để đặt tủ.");
                    window.location.href = "login.html";
                    return; 
                }

                const lockerName = clickedBtn.querySelector("h5").innerText;
                if (lockerIdInput) lockerIdInput.value = lockerName;
                if (overlay) overlay.classList.add("active");
            }
        });
    }

    // Đóng Popup
    const btnCancel = document.querySelector(".btn-cancel");
    function closePopup() { if (overlay) overlay.classList.remove("active"); }

    if (btnCancel) btnCancel.addEventListener("click", closePopup);
    if (overlay) {
        overlay.addEventListener("click", function(e) {
            if (e.target === overlay) closePopup();
        });
    }

    // 4. Tính toán điểm khi thay đổi số giờ thuê
    const durationSelect = document.getElementById("rentalDuration");
    const totalPointsDisplay = document.getElementById("totalPoints");
    
    if (durationSelect && totalPointsDisplay) {
        durationSelect.addEventListener("change", function() {
            const hours = this.value;
            const points = hours * 60;
            totalPointsDisplay.innerHTML = `<i class="fa-solid fa-coins me-1"></i> ${points} Point`;
        });
    }

    // 5. Nút Xác nhận Thanh toán
    const btnConfirmOrder = document.querySelector(".order-form button[type='submit']"); 
    if (btnConfirmOrder) {
        btnConfirmOrder.addEventListener("click", function(e) {
            e.preventDefault(); 
            const lockerId = lockerIdInput.value;
            const durationHours = durationSelect.value;
            const pointsSpent = durationHours * 60; 
            
            // Gọi hàm xử lý bên file getproduct-campus.js
            handleCampusOrder(lockerId, durationHours, pointsSpent);
        });
    }
});