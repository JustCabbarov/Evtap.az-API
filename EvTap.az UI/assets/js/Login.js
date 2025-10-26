document.addEventListener("DOMContentLoaded", () => {
  const optEmail = document.getElementById("optEmail");
  const optPhone = document.getElementById("optPhone");
  const emailForm = document.getElementById("emailLoginForm");
  const phoneForm = document.getElementById("phoneLoginForm");
  const googleBtn = document.getElementById("googleLoginBtn");

  const phoneInput = document.getElementById("phone");
  const otpInput = document.getElementById("otp");
  const otpGroup = document.getElementById("otpGroup");
  const phoneError = document.getElementById("phoneError");
  const otpError = document.getElementById("otpError");
  const submitBtn = document.getElementById("submitBtn");
  const tokenBox = document.getElementById("tokenBox");

  let sentPhoneNumber = null;
  let otpSent = false;

  function showMessage(msg, success = true) {
    tokenBox.style.display = "block";
    tokenBox.textContent = msg;
    tokenBox.style.color = success ? "green" : "red";
  }

  function clearMessage() {
    tokenBox.textContent = "";
    tokenBox.style.display = "none";
  }

  // =====================
  // 🔄 TAB DƏYİŞMƏ (Email <-> Phone)
  // =====================
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

  // =====================
  // 📧 EMAIL LOGIN
  // =====================
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
      showMessage("✅ Email ilə uğurla daxil oldunuz!");
      setTimeout(() => (window.location.href = "/index.html"), 1000);
    } catch (err) {
      showMessage(err.message, false);
    }
  });

  // =====================
  // 📱 TELEFON LOGIN (2 mərhələli)
  // =====================
  phoneForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const phone = phoneInput.value.trim();
    const otp = otpInput.value.trim();

    phoneError.textContent = "";
    otpError.textContent = "";

    // 1️⃣ OTP göndərilməyibsə
    if (!otpSent) {
      if (!/^\+?\d{7,15}$/.test(phone)) {
        phoneError.textContent = "Düzgün telefon nömrəsi daxil edin.";
        return;
      }

      try {
        const resp = await fetch("https://localhost:7027/api/Authorization/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: phone, name: "User", surname: "Login" })
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          showMessage(`❌ OTP göndərilmədi: ${err.message || "Xəta"}`, false);
          return;
        }

        showMessage("✅ OTP kodu göndərildi. Zəhmət olmasa SMS kodunu daxil edin.");
        sentPhoneNumber = phone;
        otpSent = true;

        // UI dəyişiklikləri
        phoneInput.disabled = true;
        otpGroup.style.display = "block";
        submitBtn.textContent = "Təsdiqlə";

      } catch (err) {
        showMessage("❌ Server və ya şəbəkə xətası", false);
      }
      return;
    }

    // 2️⃣ OTP artıq göndərilibsə → təsdiqlə
    if (!otp || otp.length < 4) {
      otpError.textContent = "Düzgün SMS kod daxil edin.";
      return;
    }

    try {
      const resp = await fetch(`https://localhost:7027/api/Authorization/verify-otp?code=${encodeURIComponent(otp)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sentPhoneNumber)
      });

      const data = await resp.json();

      if (!resp.ok) {
        otpError.textContent = data.message || "OTP kodu düzgün deyil.";
        return;
      }

      if (data.token) {
        localStorage.setItem("jwt", data.token);
        showMessage("📱 OTP təsdiqləndi! Uğurla daxil oldunuz ✅");
        setTimeout(() => (window.location.href = "index.html"), 700);
      } else {
        otpError.textContent = "Token alınmadı.";
      }
    } catch (err) {
      otpError.textContent = "Şəbəkə xətası. Yenidən cəhd edin.";
    }
  });

  // 🔐 GOOGLE LOGIN
  googleBtn.addEventListener("click", () => {
    window.location.href = "https://localhost:7027/api/Authorization/login-google";
  });
});
