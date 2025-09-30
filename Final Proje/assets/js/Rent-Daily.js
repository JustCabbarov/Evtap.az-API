    (() => {
        const API_URL = 'https://localhost:7027/api/Filter/GetListingsByAdvertType?type=3';
        const CITY_API = 'https://localhost:7027/api/City/GetAll';
        const DISTRICT_API = 'https://localhost:7027/api/Dictrict/GetAll';
        const METRO_API = 'https://localhost:7027/api/MetroStation/GetAll';
        const PROPERTY_API = "https://localhost:7027/api/Category/GetAll";

        function formatPrice(amount) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
        }

        function createPropertyCard(p) {
            const a = document.createElement('a');
            a.href = `property.html?id=${p.id}`;
            a.className = 'block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition';

            const imageUrl = p.images?.[0]?.url || 'https://via.placeholder.com/400x250';
            a.innerHTML = `
                <img src="${imageUrl}" alt="${p.title}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <div class="text-lg font-bold text-blue-600 mb-1">${formatPrice(p.price)}</div>
                    <div class="font-medium mb-2">${p.title}</div>
                    <div class="text-gray-500 text-sm mb-1">🛏 ${p.rooms} • 📐 ${p.area} m²</div>
                    <div class="text-gray-500 text-sm flex items-center gap-1">
                        <i class="fa-solid fa-location-dot"></i> ${p.location?.district || "—"}, ${p.location?.city || "—"}
                    </div>
                </div>
            `;
            return a;
        }

        function renderGrid(container, items) {
            container.innerHTML = '';
            if (!items.length) {
                container.innerHTML = '<p class="text-gray-500">No properties found.</p>';
                return;
            }
            items.forEach(p => container.appendChild(createPropertyCard(p)));
        }

        async function fetchListings(filters = {}) {
            const container = document.getElementById('featuredGrid');
            if (!container) return;

            try {
                const query = new URLSearchParams(filters).toString();
                const url = query ? `${API_URL}?${query}` : API_URL;

                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
                const data = await res.json();
                renderGrid(container, Array.isArray(data) ? data : [data]);
            } catch (err) {
                console.error('Failed to fetch properties:', err);
                container.textContent = 'Failed to load properties.';
            }
        }

        async function loadOptions(apiUrl, selectId, defaultText = "Any") {
            try {
                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                const select = document.getElementById(selectId);
                select.innerHTML = `<option value="">${defaultText}</option>`; // reset

                data.forEach(item => {
                    const opt = document.createElement("option");
                    opt.value = item.id;
                    opt.textContent = item.name;
                    select.appendChild(opt);
                });
            } catch (err) {
                console.error(`Failed to load ${selectId}:`, err);
            }
        }

        async function loadPropertyTypes() {
            await loadOptions(PROPERTY_API, "propertyTypeSelect", "Bütün əmlaklar");
        }

        async function initHome() {
            await loadOptions(CITY_API, "citySelect", "Any City");
            await loadOptions(DISTRICT_API, "districtSelect", "Any District");
            await loadOptions(METRO_API, "metroSelect", "Any Metro");
            await loadPropertyTypes();
            fetchListings();

            const form = document.getElementById('home-search-form');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const filters = {};
                const city = document.getElementById('citySelect').value;
                const district = document.getElementById('districtSelect').value;
                const metro = document.getElementById('metroSelect').value;
                const priceMin = document.getElementById('priceMin').value;
                const priceMax = document.getElementById('priceMax').value;

                if (city) filters.cityId = city;
                if (district) filters.districtId = district;
                if (metro) filters.metroId = metro;
                if (priceMin) filters.priceMin = priceMin;
                if (priceMax) filters.priceMax = priceMax;

                fetchListings(filters);
            });
        }

        function init() {
            const page = document.body.getAttribute('data-page');
            if (page === 'home') initHome();

            // --- Hamburger ---
            const hamburger = document.getElementById("hamburger");
            const mobileMenu = document.getElementById("mobileMenu");
            if (hamburger && mobileMenu) {
                hamburger.addEventListener("click", () => {
                    mobileMenu.classList.toggle("hidden");
                    mobileMenu.classList.toggle("flex");
                });
            }

            // --- Category yönləndirməsi ---
            const categoryItems = document.querySelectorAll(".category-item");
            categoryItems.forEach(item => {
                item.addEventListener("click", () => {
                    const categoryId = item.getAttribute("data-id");
                    window.location.href = `Category.html?categoryId=${categoryId}`;
                });
            });

            // --- Filter modal ---
            const openFilter = document.getElementById("openFilter");
            const filterModal = document.getElementById("searchModal");
            const filterOverlay = document.getElementById("modalOverlay");
            openFilter?.addEventListener("click", () => {
                filterModal.style.display = "block";
                filterOverlay.style.display = "block";
            });
            filterOverlay?.addEventListener("click", () => {
                filterModal.style.display = "none";
                filterOverlay.style.display = "none";
            });

            // --- Location modal ---
            const locationInput = document.getElementById("location");
            const locationModal = document.getElementById("locationModal");
            const locationOverlay = document.getElementById("locationModalOverlay");
            const closeLocationBtn = document.getElementById("closeLocationModal");
            const applyLocationsBtn = document.getElementById("applyLocations");
            const locationList = document.getElementById("locationList");
            const searchInput = document.getElementById("locationSearch");
            const tabs = document.querySelectorAll(".tab-btn");

            function renderLocations(data){
                locationList.innerHTML = "";
                data.forEach(loc => {
                    const item = document.createElement("label");
                    item.className = "flex items-center gap-2 border p-2 rounded-lg cursor-pointer hover:bg-gray-50";
                    item.innerHTML = `<input type="checkbox" value="${loc.id}" class="location-checkbox"><span>${loc.name}</span>`;
                    locationList.appendChild(item);
                });
            }

            async function loadLocations(type = "rayon") {
                let url;
                switch(type){
                    case "rayon": url = CITY_API; break;
                    case "metro": url = METRO_API; break;
                }
                try {
                    const res = await fetch(url);
                    if(!res.ok) throw new Error(res.statusText);
                    const data = await res.json();
                    renderLocations(data);
                } catch(err){
                    console.error("API error:", err);
                    locationList.innerHTML = "<p style='color:red;padding:5px'>Xəta baş verdi</p>";
                }
            }

            loadLocations("rayon");

            locationInput?.addEventListener("click", () => {
                locationModal.style.display = "block";
                locationOverlay.style.display = "block";
            });
            closeLocationBtn?.addEventListener("click", () => {
                locationModal.style.display = "none";
                locationOverlay.style.display = "none";
            });
            locationOverlay?.addEventListener("click", () => {
                locationModal.style.display = "none";
                locationOverlay.style.display = "none";
            });
            applyLocationsBtn?.addEventListener("click", () => {
                const selected = Array.from(locationList.querySelectorAll("input[type=checkbox]:checked"))
                                    .map(input => input.nextElementSibling.innerText);
                locationInput.value = selected.join(", ");
                locationModal.style.display = "none";
                locationOverlay.style.display = "none";
            });
            searchInput?.addEventListener("input", e => {
                const term = e.target.value.toLowerCase();
                locationList.querySelectorAll("label").forEach(label => {
                    label.style.display = label.innerText.toLowerCase().includes(term) ? "flex" : "none";
                });
            });
            tabs.forEach(tab => {
                tab.addEventListener("click", async () => {
                    tabs.forEach(t => {
                        t.classList.remove("text-blue-600");
                        t.classList.add("text-gray-600");
                    });
                    tab.classList.add("text-blue-600");
                    tab.classList.remove("text-gray-600");
                    await loadLocations(tab.dataset.type);
                });
            });

            // --- Price Dropdown ---
            const priceBtn = document.getElementById("priceBtn");
            const priceDropdown = document.getElementById("priceDropdown");
            priceBtn?.addEventListener("click", () => priceDropdown.classList.toggle("hidden"));
            document.addEventListener("click", (e) => {
                if (!priceBtn.contains(e.target) && !priceDropdown.contains(e.target)) priceDropdown.classList.add("hidden");
            });

            // --- Filter modal search ---
            const searchBtn = document.getElementById("searchBtn");
            searchBtn?.addEventListener("click", () => {
                const data = {
                    location: locationInput.value,
                    saleType: Array.from(document.querySelectorAll("#searchModal .button.active")).map(b => b.dataset.value),
                    priceMin: document.getElementById("priceMin").value,
                    priceMax: document.getElementById("priceMax").value,
                    areaMin: document.getElementById("areaMin").value,
                    areaMax: document.getElementById("areaMax").value
                };
                fetch("https://localhost:7027/api/listings/search", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                })
                .then(res => res.json())
                .then(res => console.log("Search result:", res))
                .catch(err => console.error(err));
            });

            // --- Reset filter modal ---
            const resetBtn = document.getElementById("resetBtn");
            resetBtn?.addEventListener("click", () => {
                document.querySelectorAll("#searchModal input").forEach(i => i.value = "");
                document.querySelectorAll("#searchModal .button").forEach(b => b.classList.remove("active"));
            });
        }

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            init();
        } else {
            document.addEventListener('DOMContentLoaded', init);
        }
    })();
