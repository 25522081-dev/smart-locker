const checkSession = function (){
    let userSession = JSON.parse(localStorage.getItem("user_session"));
    if(userSession) {
        const now = new Date().getTime();
        if (now > userSession.expiry) {
            localStorage.removeItem("user_session");
            alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            window.location.href = "login.html";
        }
        else{
            console.log("Phiên đăng nhập còn hiệu lực.");
        }
    }
    else {
        window.location.href = "login.html";
    }
    
    
}

export { checkSession };