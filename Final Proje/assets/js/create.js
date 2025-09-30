document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("wizardForm");
  const nextBtns = document.querySelectorAll(".next-btn");
  const prevBtns = document.querySelectorAll(".prev-btn");
  const steps = document.querySelectorAll(".step");
  const stepContents = document.querySelectorAll(".step-content");

  let currentStep = 1;
  const totalSteps = stepContents.length;

  function showStep(step) {
    stepContents.forEach(sc => {
      if (parseInt(sc.getAttribute("data-step")) === step) {
        sc.style.display = "block";
      } else {
        sc.style.display = "none";
      }
    });
    steps.forEach(s => {
      const sStep = parseInt(s.getAttribute("data-step"));
      if (sStep === step) {
        s.classList.add("active");
      } else {
        s.classList.remove("active");
      }
    });
  }

  nextBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Validasiya: cari stepdə seçilməli radio varsa yoxla
      const currentDiv = document.querySelector(`.step-content[data-step="${currentStep}"]`);
      const requiredInputs = currentDiv.querySelectorAll("input[required], select[required]");
      for (let inp of requiredInputs) {
        if (!inp.value) {
          alert("Zəhmət olmasa doldurun!");
          return;
        }
      }

      if (currentStep < totalSteps) {
        currentStep += 1;
        showStep(currentStep);
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep > 1) {
        currentStep -= 1;
        showStep(currentStep);
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const resp = await fetch("/api/listings", {
        method: "POST",
        body: formData
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err || "Server error");
      }
      const result = await resp.json();
      alert("Elan uğurla yaradıldı!");
      console.log("Cavab:", result);
    } catch (error) {
      console.error("Xəta:", error);
      alert("Xəta baş verdi: " + error.message);
    }
  });

  // İlk addımı göstər
  showStep(currentStep);
});
