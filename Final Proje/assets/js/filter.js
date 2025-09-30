const FILTER_API = 'https://localhost:7027/api/Filter/GetListingsByFilter';

async function searchFilters() {
    try {
        // Filter məlumatlarını topla
        const filterData = {
            AdvertType: parseInt(document.getElementById('advertType')?.value) || null,
            CategoryIds: document.getElementById('propertyTypeSelect')?.value 
                ? [parseInt(document.getElementById('propertyTypeSelect').value, 10)] 
                : null,
            DistrictIds: document.getElementById('districtSelect')?.value 
                ? [parseInt(document.getElementById('districtSelect').value, 10)] 
                : null,
            Rooms: document.getElementById('roomCount')?.value 
                ? [parseInt(document.getElementById('roomCount').value, 10)] 
                : null,
            PriceMin: document.getElementById('priceMin')?.value 
                ? parseFloat(document.getElementById('priceMin').value) 
                : null,
            PriceMax: document.getElementById('priceMax')?.value 
                ? parseFloat(document.getElementById('priceMax').value) 
                : null,
            AreaMin: document.getElementById('areaMinInput')?.value 
                ? parseFloat(document.getElementById('areaMinInput').value) 
                : null,
            AreaMax: document.getElementById('areaMaxInput')?.value 
                ? parseFloat(document.getElementById('areaMaxInput').value) 
                : null
        };

        // Boş dəyərləri sil
        Object.keys(filterData).forEach(key => {
            if (filterData[key] === null) delete filterData[key];
        });

        // Backend-ə POST sorğusu
        const response = await fetch(FILTER_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filterData)
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const listings = await response.json();

        // Grid-i yenilə
        const container = document.getElementById('featuredGrid');
        container.innerHTML = '';
        if (!listings || listings.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No properties found.</p>';
            return;
        }

        listings.forEach(item => {
            const card = createPropertyCard(item); // Sənin property card funksiyan
            container.appendChild(card);
        });

        // Filter modalını bağla
        closeFilterModal();

    } catch (error) {
        console.error('Filter search error:', error);
        alert('Filter search failed. Please try again.');
    }
}


// Modal elementləri
const filterModal = document.getElementById('filterModalWindow');
const filterOverlay = document.getElementById('filterModalOverlay');
const filterOpenBtn = document.getElementById('filterOpenBtn');
const closeFilterBtn = document.getElementById('resetFilterBtn'); // sıfırlama üçün istifadə olunur
const searchFilterBtn = document.getElementById('searchFilterBtn');

// Filter düyməsinə klikləyən zaman modal açılsın
filterOpenBtn.addEventListener('click', (e) => {
    e.preventDefault(); // form submit-in qarşısını alır
    filterModal.style.display = 'block';
    filterOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
});

// Overlay klikləyən zaman modal bağlansın
filterOverlay.addEventListener('click', () => {
    filterModal.style.display = 'none';
    filterOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Reset düyməsi modaldakı seçimləri sıfırlasın
closeFilterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Bütün input və button seçimlərini sıfırla
    filterModal.querySelectorAll('input[type="number"]').forEach(i => i.value = '');
    filterModal.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
});

// Modaldakı seçimləri seçmək
filterModal.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
    });
});

// Axtar düyməsi: backend-ə POST
searchFilterBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const filterData = {};

    // Alqı-satqı
    const advertBtn = filterModal.querySelector('.btn-option[data-val*="Alis"].active') 
                   || filterModal.querySelector('.btn-option[data-val*="Kiraye"].active');
    if (advertBtn) {
        filterData.AdvertType = advertBtn.dataset.val === 'Alis' ? 1 : 2;
    }

    // Əmlak növü / CategoryIds
    const categoryBtns = Array.from(filterModal.querySelectorAll('.btn-option[data-val]:not([data-val*="Alis"]):not([data-val*="Kiraye"])'));
    const selectedCategories = categoryBtns.filter(b => b.classList.contains('active')).map(b => parseInt(b.dataset.id || b.dataset.val)); 
    if (selectedCategories.length) filterData.CategoryIds = selectedCategories;

    // Qiymət
    const priceMin = filterModal.querySelector('#priceMinInput').value;
    const priceMax = filterModal.querySelector('#priceMaxInput').value;
    if (priceMin) filterData.PriceMin = parseFloat(priceMin);
    if (priceMax) filterData.PriceMax = parseFloat(priceMax);

    // Sahə
    const areaMin = filterModal.querySelector('#areaMinInput').value;
    const areaMax = filterModal.querySelector('#areaMaxInput').value;
    if (areaMin) filterData.AreaMin = parseFloat(areaMin);
    if (areaMax) filterData.AreaMax = parseFloat(areaMax);

    // Otaq sayı
    const roomBtns = filterModal.querySelectorAll('.btn-option[data-val="1"], .btn-option[data-val="2"], .btn-option[data-val="3"], .btn-option[data-val="4"], .btn-option[data-val="5plus"]');
    const rooms = Array.from(roomBtns).filter(b => b.classList.contains('active')).map(b => b.dataset.val === '5plus' ? 5 : parseInt(b.dataset.val));
    if (rooms.length) filterData.Rooms = rooms;

    // Boş dəyərləri sil
    Object.keys(filterData).forEach(key => {
        if (filterData[key] === null || filterData[key].length === 0) delete filterData[key];
    });

    try {
        const response = await fetch(FILTER_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filterData)
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const listings = await response.json();

        // Grid-i yenilə
        const container = document.getElementById('featuredGrid');
        container.innerHTML = '';
        if (!listings || listings.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No properties found.</p>';
            return;
        }
        listings.forEach(item => {
            const card = createPropertyCard(item); // sənin card funksiyan
            container.appendChild(card);
        });

        // Modalı bağla
        filterModal.style.display = 'none';
        filterOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';

    } catch (error) {
        console.error('Filter search error:', error);
        alert('Filter search failed. Please try again.');
    }
});
