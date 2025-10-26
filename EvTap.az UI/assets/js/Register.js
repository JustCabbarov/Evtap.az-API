document.addEventListener('DOMContentLoaded', function () {
    const optEmail = document.getElementById('optEmail');
    const optPhone = document.getElementById('optPhone');
    const emailForm = document.getElementById('emailForm');
    const phoneForm = document.getElementById('phoneForm');
    const otpForm = document.getElementById('otpForm');
    const tokenBox = document.getElementById('tokenBox');
    const googleBtn = document.getElementById('googleLoginBtn');

    // =====================
    // SWITCH Email / Phone
    // =====================
    optEmail.addEventListener('click', () => {
        optEmail.classList.add('active');
        optPhone.classList.remove('active');
        emailForm.style.display = 'block';
        phoneForm.style.display = 'none';
        otpForm.style.display = 'none';
    });

    optPhone.addEventListener('click', () => {
        optPhone.classList.add('active');
        optEmail.classList.remove('active');
        emailForm.style.display = 'none';
        phoneForm.style.display = 'block';
        otpForm.style.display = 'none';
    });

    // =====================
    // HELPER FUNKSİYALAR
    // =====================
    function showMessage(msg, success = true) {
        if (!tokenBox) return;
        tokenBox.style.display = 'block';
        tokenBox.textContent = msg;
        tokenBox.style.color = success ? 'green' : 'red';
    }

    function clearMessage() {
        if (tokenBox) {
            tokenBox.textContent = '';
            tokenBox.style.display = 'none';
        }
    }

    // =====================
    // E-POÇT QEYDİYYATI
    // =====================
    if (emailForm) {
        emailForm.addEventListener('submit', async e => {
            e.preventDefault();
            clearMessage();

            const email = emailForm.email.value.trim();
            const password = emailForm.password.value.trim();
            const emailError = document.getElementById('emailError');
            const passwordError = document.getElementById('passwordError');

            let hasError = false;

            // Sadə yoxlamalar
            if (!email) {
                emailError.textContent = "E-poçt boş ola bilməz.";
                hasError = true;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                emailError.textContent = "E-poçt formatı düzgün deyil.";
                hasError = true;
            } else {
                emailError.textContent = "";
            }

            if (!password || password.length < 6) {
                passwordError.textContent = "Şifrə ən az 6 simvol olmalıdır.";
                hasError = true;
            } else {
                passwordError.textContent = "";
            }

            if (hasError) return;

            try {
                const resp = await fetch("https://localhost:7027/api/Authorization/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}));
                    showMessage(`❌ Qeydiyyat uğursuz oldu: ${err.message || 'Xəta baş verdi'}`, false);
                    return;
                }

                const data = await resp.json();
                showMessage("✅ Qeydiyyat uğurla tamamlandı!");
                emailForm.reset();

                if (data.token) {
                    localStorage.setItem('jwt', data.token);
                    setTimeout(() => (window.location.href = "index.html"), 1000);
                }

            } catch (err) {
                console.error("Register error:", err);
                showMessage("❌ Server və ya şəbəkə xətası", false);
            }
        });
    }

    // =====================
    // TELEFON ilə OTP GÖNDƏRİLMƏSİ
    // =====================
    let sentPhoneNumber = null;

    if (phoneForm) {
        phoneForm.addEventListener('submit', async e => {
            e.preventDefault();
            clearMessage();

            const name = phoneForm.name.value.trim();
            const surname = phoneForm.surname.value.trim();
            const phone = phoneForm.phone.value.trim();

            const nameError = document.getElementById('nameError');
            const surnameError = document.getElementById('surnameError');
            const phoneError = document.getElementById('phoneError');

            let hasError = false;

            if (!name) { nameError.textContent = "Ad boş ola bilməz."; hasError = true; } else nameError.textContent = "";
            if (!surname) { surnameError.textContent = "Soyad boş ola bilməz."; hasError = true; } else surnameError.textContent = "";
            if (!phone) {
                phoneError.textContent = "Telefon nömrəsi boş ola bilməz.";
                hasError = true;
            } else if (!/^\+?\d{7,15}$/.test(phone)) {
                phoneError.textContent = "Telefon formatı düzgün deyil.";
                hasError = true;
            } else phoneError.textContent = "";

            if (hasError) return;

            try {
                const resp = await fetch("https://localhost:7027/api/Authorization/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phoneNumber: phone, name, surname })
                });

                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}));
                    showMessage(`❌ OTP göndərilmədi: ${err.message || 'Xəta baş verdi'}`, false);
                    return;
                }

                // OTP göndərildi
                showMessage("✅ OTP kodu göndərildi!", true);
                sentPhoneNumber = phone;

                phoneForm.style.display = 'none';
                otpForm.style.display = 'block';
                otpForm.reset();

            } catch (err) {
                console.error("Send OTP error:", err);
                showMessage("❌ Server və ya şəbəkə xətası", false);
            }
        });
    }

    // =====================
    // OTP TƏSDİQİ
    // =====================
    if (otpForm) {
        otpForm.addEventListener('submit', async e => {
            e.preventDefault();
            clearMessage();

            const otpCode = otpForm.otpCode.value.trim();
            const otpError = document.getElementById('otpError');

            if (!otpCode) {
                otpError.textContent = "OTP kodu boş ola bilməz.";
                return;
            }

            if (!sentPhoneNumber) {
                showMessage("❌ Telefon nömrəsi tapılmadı. Yenidən başlayın.", false);
                return;
            }

            try {
                const resp = await fetch(`https://localhost:7027/api/Authorization/verify-otp?code=${encodeURIComponent(otpCode)}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(sentPhoneNumber)
                });

                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}));
                    otpError.textContent = err.message || "OTP kodu düzgün deyil.";
                    return;
                }

                const data = await resp.json();
                if (data.token) {
                    localStorage.setItem("jwt", data.token);
                    showMessage("✅ OTP təsdiqləndi! Daxil olursunuz...", true);
                    otpForm.reset();

                    setTimeout(() => (window.location.href = "index.html"), 1000);
                } else {
                    otpError.textContent = "Token alınmadı.";
                }

            } catch (err) {
                console.error("Verify OTP error:", err);
                otpError.textContent = "Şəbəkə xətası. Yenidən cəhd edin.";
            }
        });
    }

    // =====================
    // GOOGLE ilə giriş
    // =====================
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            window.location.href = "https://localhost:7027/api/Authorization/google-login";
        });
    }
});
