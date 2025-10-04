document.addEventListener("DOMContentLoaded", () => {
    const optEmail = document.getElementById("optEmail");
    const optPhone = document.getElementById("optPhone");
    const emailForm = document.getElementById("emailLoginForm");
    const phoneForm = document.getElementById("phoneLoginForm");

    // 🔄 Tab dəyişmə
    optEmail.addEventListener("click", () => {
        optEmail.classList.add("active");
        optPhone.classList.remove("active");
        emailForm.style.display = "block";
        phoneForm.style.display = "none";
    });

    optPhone.addEventListener("click", () => {
        optPhone.classList.add("active");
        optEmail.classList.remove("active");
        emailForm.style.display = "none";
        phoneForm.style.display = "block";
    });

    // 📧 Email ilə login
    emailForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        let valid = true;

        if (!email || !email.includes("@")) {
            document.getElementById("emailError").textContent = "Düzgün e-poçt daxil edin.";
            valid = false;
        } else {
            document.getElementById("emailError").textContent = "";
        }

        if (password.length < 6) {
            document.getElementById("passwordError").textContent = "Şifrə ən az 6 simvol olmalıdır.";
            valid = false;
        } else {
            document.getElementById("passwordError").textContent = "";
        }

        if (!valid) return;

        try {
            const response = await fetch("https://localhost:7027/api/Authorization/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Login uğursuz oldu.");

            localStorage.setItem("jwt", data.token);
            alert("Email ilə uğurla daxil oldunuz ✅");
            window.location.href = "/index.html";
        } catch (err) {
            alert(err.message);
        }
    });

    // 📱 Telefon ilə login
    phoneForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const phone = document.getElementById("phone").value.trim();
        const otp = document.getElementById("otp").value.trim();
        let valid = true;

        if (!/^\+?\d{7,15}$/.test(phone)) {
            document.getElementById("phoneError").textContent = "Düzgün telefon nömrəsi daxil edin.";
            valid = false;
        } else {
            document.getElementById("phoneError").textContent = "";
        }

        if (otp.length < 4) {
            document.getElementById("otpError").textContent = "Düzgün SMS kod daxil edin.";
            valid = false;
        } else {
            document.getElementById("otpError").textContent = "";
        }

        if (!valid) return;

        try {
            const response = await fetch("https://localhost:7027/api/Authorization/login-google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Login uğursuz oldu.");

            localStorage.setItem("jwt", data.token);
            alert("Telefon ilə uğurla daxil oldunuz ✅");
            window.location.href = "index.html";
        } catch (err) {
            alert(err.message);
        }
    });

    // 🔐 Google login (popup + JWT)
    document.getElementById("googleLoginBtn").addEventListener("click", () => {
        const width = 500;
        const height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        const popup = window.open(
            "https://localhost:7027/api/Authorization/login-google",
            "Google Login",
            `width=${width},height=${height},top=${top},left=${left}`
        );

        window.addEventListener("message", (event) => {
            if (event.origin !== "https://localhost:7027") return;

            const { token } = event.data;
            if (token) {
                localStorage.setItem("jwt", token);
                alert("Google ilə uğurla daxil oldunuz ✅");
                window.location.href = "/index.html";
            }
        });
    });
});
