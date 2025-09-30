(() => {
    const CATEGORY_API_URL = 'https://localhost:7027/api/Filter/GetListingsByCategory';

    function formatPrice(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    }

    function createCategoryCard(p) {
        const a = document.createElement('a');
        a.href = `property.html?id=${p.id}`;
        a.className = 'category-card block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition';

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

    async function fetchCategoryListings(categoryId) {
        const container = document.getElementById('categoryGrid');
        if (!container) return;

        try {
            // API-yə categoryId göndərilir
            const res = await fetch(`${CATEGORY_API_URL}?categoryId=${categoryId}`);
            if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
            const data = await res.json();

            container.innerHTML = '';
            if (!data.length) {
                container.innerHTML = '<p class="text-gray-500">Heç bir elan tapılmadı.</p>';
                return;
            }

            data.forEach(p => container.appendChild(createCategoryCard(p)));
        } catch (err) {
            console.error('Failed to fetch category listings:', err);
            container.textContent = 'Data yüklənmədi.';
        }
    }

    // URL-dən categoryId götürmək
    function getCategoryIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get("categoryId");
    }

    document.addEventListener("DOMContentLoaded", () => {
        // Əgər Category.html səhifəsindəsə və URL-də categoryId varsa, dərhal API çağır
        const categoryIdFromUrl = getCategoryIdFromUrl();
        if (categoryIdFromUrl) {
            fetchCategoryListings(categoryIdFromUrl);
        }

        // Əsas səhifədə kategoriya kliklənəndə Category.html-ə yönləndir
        const categoryItems = document.querySelectorAll(".flex.items-center[data-id]");
        categoryItems.forEach(item => {
            item.addEventListener("click", () => {
                const categoryId = item.getAttribute("data-id");
                // URL-də categoryId ilə yönləndirmək
                window.location.href = `Category.html?categoryId=${categoryId}`;
            });
        });
    });
})();
