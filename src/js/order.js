import{ handleOrder } from "./getproduct.js";

document.addEventListener("DOMContentLoaded", function() {
    const overlay = document.getElementById("orderOverlay");
    const lockerIdInput = document.getElementById("lockerId");
    const productListContainer = document.querySelector('.product-list'); // Lấy thẻ cha

    // 1. Lắng nghe cú click chuột trên toàn bộ khu vực chứa tủ
    if (productListContainer) {
        productListContainer.addEventListener("click", function(event) {
            
            // Lệnh closest() giúp tìm xem vị trí bạn click chuột có nằm bên trong một nút có class 'status-available' hay không
            const clickedBtn = event.target.closest(".status-available");

            // Nếu click đúng vào tủ đang trống (available)
            if (clickedBtn) {
                // Lấy tên tủ (A101, A105...)
                const lockerName = clickedBtn.querySelector("h5").innerText;
                
                // Điền tên tủ vào Form và mở Form lên
                lockerIdInput.value = lockerName;
                overlay.classList.add("active");
            }
        });
    }

    // 2. Code đóng popup (giữ nguyên logic của bạn)
    const btnCancel = document.querySelector(".btn-cancel");
    function closePopup() {
        overlay.classList.remove("active");
    }

    if (btnCancel) {
        btnCancel.addEventListener("click", closePopup);
    }

    if (overlay) {
        overlay.addEventListener("click", function(e) {
            if (e.target === overlay) {
                closePopup();
            }
        });
    }
});



const btnConfirmOrder = document.querySelector(".order-form button[type='submit']"); 
const lockerIdInput = document.getElementById("lockerId");
const durationSelect = document.getElementById("rentalDuration");

if (btnConfirmOrder) {
    btnConfirmOrder.addEventListener("click", function(e) {
        e.preventDefault(); // Ngăn form reload lại trang

        const lockerId = lockerIdInput.value;
        const durationHours = durationSelect.value;
        const pointsSpent = durationHours * 60; // Tính điểm dựa theo logic 60đ/giờ của bạn

        // Gọi hàm tạo order
        handleOrder(lockerId, durationHours, pointsSpent);
    });
}