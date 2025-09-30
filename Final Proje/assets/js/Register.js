
const btnEmail = document.getElementById('optEmail');
const btnPhone = document.getElementById('optPhone');
const emailForm = document.getElementById('emailForm');
const phoneForm = document.getElementById('phoneForm');
const RegisterForm = document.getElementById('RegisterForm');


// Tab switch
btnEmail.addEventListener('click', () => {
    btnEmail.classList.add('active');
    btnEmail.setAttribute('aria-selected', 'true');
    btnPhone.classList.remove('active');
    btnPhone.setAttribute('aria-selected', 'false');
    emailForm.style.display = 'block';
    phoneForm.style.display = 'none';
});
btnPhone.addEventListener('click', () => {
    btnPhone.classList.add('active');
    btnPhone.setAttribute('aria-selected', 'true');
    btnEmail.classList.remove('active');
    btnEmail.setAttribute('aria-selected', 'false');
    phoneForm.style.display = 'block';
    emailForm.style.display = 'none';
});


window.addEventListener("message", event => {
    if (!event.origin.startsWith("https://localhost:7027")) return;
    const data = event.data;
    if (data && data.token) {
        localStorage.setItem("jwt", data.token);
        const tokenBox = document.getElementById("tokenBox");
        tokenBox.style.display = "block";
        tokenBox.innerText = "JWT Token: " + data.token;
    }
});

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

// Autofocus
document.getElementById('email').focus();


emailForm.addEventListener('submit', async e => {
    e.preventDefault();
    let hasError = false;
    const emailInput = emailForm.email;
    const passwordInput = emailForm.password;
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    if (!emailInput.value.trim()) {
        emailError.textContent = "E-poçt boş ola bilməz."; hasError = true;
    } else { emailError.textContent = ""; }

    if (!passwordInput.value || passwordInput.value.length < 6) {
        passwordError.textContent = "Şifrə ən az 6 simvol olmalıdır."; hasError = true;
    } else { passwordError.textContent = ""; }

    if (!hasError) {
        try {
            const response = await fetch("https://localhost:7027/api/Authorization/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value
                })
            });

            if (!response.ok) {
                const err = await response.json();
                alert("Xəta: " + (err.message || response.status));
                return;
            }
            tokenBox.style.display = "none";
            tokenBox.className = "";
            const data = await response.json();



            if (data.token) {
                localStorage.setItem("jwt", data.token);
                document.getElementById("tokenBox").style.display = "block";
                document.getElementById("tokenBox").innerText = "JWT Token: " + data.token;
            }
            RegisterForm.style.display = "none"
            tokenBox.style.display = "block";
            tokenBox.className = "success";
            tokenBox.innerText = "✅ Qeydiyyat uğurla oldu. Zəhmət olmasa emailinizi təsdiqləyin.";

        } catch (error) {
            console.error("API xətası:", error);

        }
    }
});

// Telefon formu (hələ backend bağlı deyil)
phoneForm.addEventListener('submit', e => {
    e.preventDefault();
    let hasError = false;
    const nameInput = phoneForm.fullName;
    const phoneInput = phoneForm.phone;
    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');

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

    if (!hasError) {
        // Burada telefon üçün ayrıca API çağırışı əlavə edə bilərsən
        console.log("Telefonla qeydiyyat:", { name: nameInput.value, phone: phoneInput.value });
        alert("Telefonla qeydiyyat uğurla həyata keçirildi!");
    }
});
