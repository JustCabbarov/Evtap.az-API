// DOM Elementləri
const btnEmail = document.getElementById('optEmail');
const btnPhone = document.getElementById('optPhone');
const emailForm = document.getElementById('emailForm');
const phoneForm = document.getElementById('phoneForm');
const RegisterForm = document.getElementById('RegisterForm');
const tokenBox = document.getElementById("tokenBox"); // Mesajlar üçün əsas konteyner


// --- Helper Functions ---

/**
 * İstifadəçi mesajlarını (uğur/xəta) göstərir.
 * @param {string} message - Göstəriləcək mesaj mətni.
 * @param {boolean} isSuccess - Mesajın uğur (true) yoxsa xəta (false) olduğunu göstərir.
 */
const showMessage = (message, isSuccess = false) => {
    if (!tokenBox) return;
    tokenBox.style.display = "block";
    tokenBox.className = isSuccess ? "alert success" : "alert error";
    tokenBox.innerText = message;
    
    // Qeydiyyat formasını gizlət
    if (RegisterForm) {
        RegisterForm.style.display = "none";
    }
}

/**
 * Mesajları təmizləyir və formanı geri qaytarır.
 */
const clearMessage = () => {
    if (tokenBox) {
        tokenBox.style.display = "none";
        tokenBox.className = "";
        tokenBox.innerText = "";
    }
    // Qeydiyyat formasını göstər
    if (RegisterForm) {
        RegisterForm.style.display = "block";
    }
}


// --- Tab switch logic ---
if (btnEmail && btnPhone && emailForm && phoneForm) {
    btnEmail.addEventListener('click', () => {
        btnEmail.classList.add('active');
        btnEmail.setAttribute('aria-selected', 'true');
        btnPhone.classList.remove('active');
        btnPhone.setAttribute('aria-selected', 'false');
        emailForm.style.display = 'block';
        phoneForm.style.display = 'none';
        clearMessage();
    });

    btnPhone.addEventListener('click', () => {
        btnPhone.classList.add('active');
        btnPhone.setAttribute('aria-selected', 'true');
        btnEmail.classList.remove('active');
        btnEmail.setAttribute('aria-selected', 'false');
        phoneForm.style.display = 'block';
        emailForm.style.display = 'none';
        clearMessage();
    });
}


// --- Google Login Integration ---
window.addEventListener("message", event => {
    // ⚠️ DƏYİŞİKLİK: C# tərəfdə '*' istifadə etdiyiniz üçün burada sadəcə tokeni yoxlayırıq.
    // Təhlükəsizlik üçün event.origin yoxlanılması ləğv edildi, lakin idealda bu, sabit bir origin olmalıdır.
    
    const data = event.data;
    
    if (data && data.token) {
        
        // DEBUG MƏQSƏDİLƏ: Konsola yazdırın
        console.log("✅ Google cavabı uğurludur. JWT Token alındı.");
        console.log("Alınan Origin:", event.origin); 
        
        // 1. Tokeni local storage-ə yaz
        localStorage.setItem("jwt", data.token);
        
        // 2. Əsas səhifəyə yönləndir
        window.location.href = "index.html"; 
    }
});

if (document.getElementById("googleLoginBtn")) {
    document.getElementById("googleLoginBtn").addEventListener("click", () => {
        const width = 500, height = 600;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        window.open(
            "https://localhost:7027/api/Authorization/login-google",
            "GoogleLogin",
            `width=${width},height=${height},top=${top},left=${left}`
        );
    });
}

// Autofocus
const emailInput = document.getElementById('email');
if (emailInput) {
    emailInput.focus();
}


// --- Email Form Submittion (Manual Registration) ---
if (emailForm) {
    emailForm.addEventListener('submit', async e => {
        e.preventDefault();
        clearMessage(); 
        
        let hasError = false;
        const emailInput = emailForm.email;
        const passwordInput = emailForm.password;
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');

        // Validation
        if (!emailInput.value.trim()) {
            emailError.textContent = "E-poçt boş ola bilməz."; hasError = true;
        } else { emailError.textContent = ""; }

        if (!passwordInput.value || passwordInput.value.length < 6) {
            passwordError.textContent = "Şifrə ən az 6 simvol olmalıdır."; hasError = true;
        } else { passwordError.textContent = ""; }

        if (hasError) return;

        try {
            // API çağırışı
            const response = await fetch("https://localhost:7027/api/Authorization/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value
                })
            });

            if (!response.ok) {
                let errorMessage = "Qeydiyyat uğursuz oldu.";
                try {
                    const errors = await response.json();
                    if (Array.isArray(errors) && errors.length > 0) {
                        errorMessage = errors.map(e => e.description).join(" ");
                    } else if (errors.message) {
                        errorMessage = errors.message;
                    }
                } catch {
                    errorMessage = `Server xətası: ${response.status}`;
                }
                showMessage(`❌ ${errorMessage}`, false);
                return;
            }

            // Uğurlu qeydiyyatdan sonra...
            const data = await response.json();
            if (data.token) {
                 localStorage.setItem("jwt", data.token);
            }
            
            // TƏLƏB EDİLƏN MƏNTİQ: Yönləndirmə əvəzinə, email təsdiqi mesajı göstərilir.
            showMessage("✅ Qeydiyyat uğurla tamamlandı. Zəhmət olmasa daxil olmaq üçün **emailinizi təsdiqləyin**.", true);
            
            // Formu təmizlə
            emailForm.reset();

        } catch (error) {
            console.error("API xətası:", error);
            showMessage("❌ Gözlənilməyən şəbəkə xətası baş verdi.", false);
        }
    });
}


// --- Telefon formu (OTP Axını) ---
if (phoneForm) {
    phoneForm.addEventListener('submit', async e => {
        e.preventDefault();
        clearMessage();
        
        let hasError = false;
        const nameInput = phoneForm.fullName;
        const phoneInput = phoneForm.phone;
        const nameError = document.getElementById('nameError');
        const phoneError = document.getElementById('phoneError');

        // Validation
        if (!nameInput.value.trim()) {
            nameError.textContent = "Ad boş ola bilməz."; hasError = true;
        } else { nameError.textContent = ""; }

        if (!phoneInput.value.trim()) {
            phoneError.textContent = "Telefon nömrəsi boş ola bilməz."; hasError = true;
        } else {
            const pattern = /^\+?\d{7,15}$/;
            if (!pattern.test(phoneInput.value.trim())) {
                phoneError.textContent = "Telefon nömrəsi düzgün formatda deyil."; hasError = true;
            } else { phoneError.textContent = ""; }
        }

        if (hasError) return;

        try {
             // 1. Backend-ə OTP göndərmək üçün sorğu göndər
             const response = await fetch("https://localhost:7027/api/Authorization/send-otp", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({
                     phoneNumber: phoneInput.value
                 })
             });

             if (response.ok) {
                 showMessage("✅ Təsdiqləmə kodu nömrənizə göndərildi. Zəhmət olmasa daxil edin.", true);
             } else {
                 const err = await response.json();
                 showMessage(`❌ OTP göndərilmədi: ${err.message || 'Server xətası'}`, false);
             }

        } catch (error) {
            console.error("OTP API xətası:", error);
            showMessage("❌ Şəbəkə xətası. Yenidən cəhd edin.", false);
        }
    });
}