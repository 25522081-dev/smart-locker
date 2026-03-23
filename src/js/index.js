// File: src/js/index.js
import { getProductList, handleOrder } from "./getproduct.js";
import { handleUserInfo } from "./user_info.js";


// CHỈ DÙNG 1 LẦN DOMContentLoaded ĐỂ BỌC TẤT CẢ LOGIC LẠI
document.addEventListener("DOMContentLoaded", function() {
    
    // 0. Khởi tạo thông tin User trên Navbar & Check Đăng xuất
    handleUserInfo();

    // 1. Render danh sách tủ
    const productListContainer = document.querySelector('.product-list');
    getProductList(productListContainer);

    // 2. Logic xử lý Popup Order
    const overlay = document.getElementById("orderOverlay");
    const lockerIdInput = document.getElementById("lockerId");
    
    // Mở popup khi click vào tủ
    if (productListContainer) {
        productListContainer.addEventListener("click", function(event) {
            const clickedBtn = event.target.closest(".status-available");
            if (clickedBtn) {
                // Kiểm tra đăng nhập trước khi mở Popup
                const userSession = JSON.parse(localStorage.getItem("user_session"));
                if (!userSession || !userSession.user || !userSession.user.email) {
                    alert("Vui lòng đăng nhập để đặt tủ.");
                    window.location.href = "login.html";
                    return; // Dừng hàm lại, không mở popup
                }

                // Nếu đã đăng nhập thì mở Popup và gán tên tủ
                const lockerName = clickedBtn.querySelector("h5").innerText;
                lockerIdInput.value = lockerName;
                overlay.classList.add("active");
            }
        });
    }

    // Đóng popup
    const btnCancel = document.querySelector(".btn-cancel");
    function closePopup() {
        overlay.classList.remove("active");
    }

    if (btnCancel) {
        btnCancel.addEventListener("click", closePopup);
    }

    if (overlay) {
        overlay.addEventListener("click", function(e) {
            // Chỉ đóng khi click ra ngoài vùng form
            if (e.target === overlay) {
                closePopup();
            }
        });
    }

    // 3. Logic Xác nhận đặt tủ (Gửi dữ liệu lên Firebase)
    const btnConfirmOrder = document.querySelector(".order-form button[type='submit']"); 
    const durationSelect = document.getElementById("rentalDuration");
    const totalPointsDisplay = document.getElementById("totalPoints");

    // Lắng nghe sự kiện thay đổi thời gian thuê để tự động tính điểm
    if (durationSelect && totalPointsDisplay) {
        durationSelect.addEventListener("change", function() {
            const hours = this.value;
            const points = hours * 60;
            totalPointsDisplay.innerHTML = `<i class="fa-solid fa-coins me-1"></i> ${points} Point`;
        });
    }

    // Bấm nút Xác nhận đặt tủ
    if (btnConfirmOrder) {
        btnConfirmOrder.addEventListener("click", function(e) {
            e.preventDefault(); 
            
            const lockerId = lockerIdInput.value;
            const durationHours = durationSelect.value;
            const pointsSpent = durationHours * 60; // Tính điểm 60đ/giờ

            // Gọi hàm xử lý bên getproduct.js
            handleOrder(lockerId, durationHours, pointsSpent);
        });
    }
});