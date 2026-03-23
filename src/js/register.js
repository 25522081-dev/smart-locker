import {auth, db} from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const inputUsername = document.querySelector("#username");
const inputEmail = document.querySelector("#email");
const inputPassword = document.querySelector("#password");
const inputConfirmPassword = document.querySelector("#confirmPassword");
const registerForm = document.querySelector("#registerForm");

const handleregisterForm = function (event) {
    event.preventDefault();
    let username = inputUsername.value;
    let email = inputEmail.value;
    let password = inputPassword.value;
    let confirmPassword = inputConfirmPassword.value;

    let role_id = 2; // default role_id for regular users

    if(username === "" || email === "" || password === "" || confirmPassword === "") {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }   
    if(password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
    }


    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;

        const userData = {
            username,
            email,
            password,
            role_id,
            point: 0
        };


        return addDoc(collection(db, "users"),userData);

    })
    .then(() => {
        alert("Đăng ký thành công!");
        window.location.href = "login.html";
    })
    
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert("Đăng ký thất bại: " + errorMessage);
    });





}

registerForm.addEventListener("submit", handleregisterForm);


