import{auth,db} from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


// Lấy phần tử form và input
const inputEmail = document.querySelector("#email");
const inputPassword = document.querySelector("#password");
const loginForm = document.querySelector("#loginForm");

// Thêm sự kiện submit cho form
const handleLoginForm = function (event) {
    event.preventDefault();

    let email = inputEmail.value;
    let password = inputPassword.value;

    if(email === "" || password === "") {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }
    // Sử dụng Firebase Authentication để đăng nhập
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            // Lưu thông tin người dùng vào sessionStorage hoặc localStorage
            const userSessionData = {
                user: {
                    email: user.email,
                },

                expiry: new Date().getTime() + 3 * 60 * 60 * 1000 // Thời gian hết hạn sau 24 giờ
            };
            localStorage.setItem("user_session", JSON.stringify(userSessionData));
            alert("Đăng nhập thành công!");
            window.location.href = "index.html"; // Chuyển hướng đến trang chính sau khi đăng nhập thành công
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Đăng nhập thất bại: " + errorMessage);
        });

};

// Gắn sự kiện submit cho form
loginForm.addEventListener("submit", handleLoginForm);