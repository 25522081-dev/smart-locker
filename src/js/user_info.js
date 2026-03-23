// File: src/js/user_info.js
import { db } from './firebase-config.js'; 
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

export const handleUserInfo = async () => {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    
    // Các phần tử DOM
    const profileBtn = document.getElementById('profile-dropdown');
    const displayUsername = document.getElementById("displayUsername");
    const displayPoints = document.getElementById("displayPoints");
    const btnLogout = document.getElementById("btnLogout");

    // 1. Xử lý hiển thị thông tin nếu đã đăng nhập
    if (userSession && userSession.user && userSession.user.email) {
        // Ẩn nút đăng nhập/đăng ký, hiện thông tin user
        document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.user-only').forEach(el => el.style.display = 'block');
        
        const userEmail = userSession.user.email;
        
        try {
            // Lấy thông tin user từ Firebase
            const q = query(collection(db, "users"), where("email", "==", userEmail));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                
                // Cập nhật giao diện
                if (profileBtn) {
                    profileBtn.innerHTML = `<i class="fa-solid fa-user me-1"></i> ${userData.username}`;
                }
                if (displayUsername) displayUsername.innerText = userData.username;
                if (displayPoints) displayPoints.innerText = userData.point;
            }
        } catch (error) {
            console.error("Lỗi khi lấy thông tin user từ Firebase: ", error);
        }
    } else {
        // Đảm bảo nếu chưa đăng nhập thì hiện đúng form Khách
        document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.user-only').forEach(el => el.style.display = 'none');
    }

    // 2. Xử lý sự kiện Đăng xuất
    if (btnLogout) {
        btnLogout.addEventListener("click", function(e) {
            e.preventDefault();
            localStorage.removeItem("user_session");
            alert("Đã đăng xuất thành công!");
            window.location.reload(); 
        });
    }
};