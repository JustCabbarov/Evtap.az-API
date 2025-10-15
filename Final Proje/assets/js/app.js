// API Configuration
const API_URL = 'https://localhost:7027/api/Filter/GetListingsByAdvertType?type=1';
const FILTER_API = 'https://localhost:7027/api/Filter/GetListingsByFilter';
const CATEGORY_API = 'https://localhost:7027/api/Filter/GetListingsByCategory';
const GET_ALL_API = 'https://localhost:7027/api/Filter/GetListingsByAdvertType?type='; // Unused, replaced by more robust fetchAllListings logic
const PROPERTY_API = 'https://localhost:7027/api/Category/GetAll';
const DISTRICT_API = 'https://localhost:7027/api/Dictrict/GetAll';
const METRO_API = 'https://localhost:7027/api/MetroStation/GetAll';

let selectedCategories = []; // Unused in current filter logic, kept for reference
let selectedRooms = []; // Unused in current filter logic, kept for reference
let selectedRenovations = []; // Unused in current filter logic, kept for reference
let selectedCreatorTypes = []; // Unused in current filter logic, kept for reference
let selectedLocations = [];

// DOM Elementləri
let vipGrid, regularGrid, vipCount, regularCount;

// VIP Slider variables
let vipSlider = {
    currentSlide: 0,
    totalSlides: 0,
    itemsPerSlide: 3,
    container: null,
    controls: null,
    prevBtn: null,
    nextBtn: null,
    info: null
};

// Helper Functions
const formatPrice = (amount) => {
    if (!amount) return 'Qiymət yoxdur';
    return new Intl.NumberFormat('az-AZ', {
        style: 'currency',
        currency: 'AZN',
        minimumFractionDigits: 0
    }).format(amount);
};

const createPropertyCard = (property, isVip = false) => {
    const card = document.createElement('a');
    card.href = `property.html?id=${property.id}`;
    card.className = 'property-card block bg-white rounded-xl shadow-md overflow-hidden cursor-pointer no-underline relative';

    const imageUrl = property.images?.[0]?.url || 'https://via.placeholder.com/400x250?text=Emlak';

    // Add VIP badge if it's a VIP property
    const vipBadge = isVip ? `
        <div class="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <i class="fa-solid fa-crown"></i>
            VIP
        </div>
    ` : '';

    card.innerHTML = `
        <div class="relative">
            <img src="${imageUrl}" alt="${property.title || 'Əmlak'}" class="w-full h-48 object-cover">
            ${vipBadge}
        </div>
        <div class="p-4">
            <div class="text-lg font-bold text-blue-600 mb-2">${formatPrice(property.price)}</div>
            <div class="font-medium mb-2 text-gray-800">${property.title || 'Başlıq yoxdur'}</div>
            <div class="text-gray-500 text-sm mb-2 space-y-1">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-door-open"></i>
                    <span>${property.rooms || '-'} otaq</span>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-vector-square"></i>
                    <span>${property.area || '-'} m²</span>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${property.location?.district || '-'}, ${property.location?.city || '-'}</span>
                </div>
            </div>
            <div class="text-xs text-gray-400 mt-3">
                ${property.createdAt ? new Date(property.createdAt).toLocaleDateString('az-AZ') : ''}
            </div>
        </div>
    `;

    return card;
};

// Loading and error states
const showLoading = (gridId = 'both') => {
    const loadingHtml = `
        <div class="col-span-full flex justify-center items-center py-16">
            <div class="text-center">
                <div class="loading-spinner"></div>
                <p class="mt-4 text-gray-500">Elanlar yüklənir...</p>
            </div>
        </div>
    `;

    if (gridId === 'both' || gridId === 'vip') {
        vipGrid.innerHTML = loadingHtml;
    }
    if (gridId === 'both' || gridId === 'regular') {
        regularGrid.innerHTML = loadingHtml;
    }
};

const showError = (message, gridId = 'both') => {
    const errorHtml = `
        <div class="col-span-full text-center py-16">
            <div class="text-red-500 mb-4">
                <i class="fa-solid fa-exclamation-triangle text-4xl"></i>
            </div>
            <p class="text-gray-600">${message}</p>
            <button onclick="fetchListings()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Yenidən yoxla
            </button>
        </div>
    `;

    if (gridId === 'both' || gridId === 'vip') {
        vipGrid.innerHTML = errorHtml;
    }
    if (gridId === 'both' || gridId === 'regular') {
        regularGrid.innerHTML = errorHtml;
    }
};

// Grid rendering
const renderGrid = (properties) => {
    vipGrid.innerHTML = '';
    regularGrid.innerHTML = '';

    if (!properties || properties.length === 0) {
        const noResultsHtml = `
            <div class="col-span-full text-center py-16">
                <div class="text-gray-500 mb-4">
                    <i class="fa-solid fa-search text-4xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-600 mb-2">Elan tapılmadı</h3>
                <p class="text-gray-600 mb-4">Axtarış nəticələrinizə uyğun elan tapılmadı.</p>
                <button onclick="fetchListings()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Bütün elanları göstər
                </button>
            </div>
        `;
        vipGrid.innerHTML = noResultsHtml;
        regularGrid.innerHTML = noResultsHtml;
        vipCount.textContent = '0 VIP elan';
        regularCount.textContent = '0 adi elan';
        return;
    }

    // Use properties directly from API (no client-side filtering)
    let filteredProperties = properties;

    // Separate VIP and regular properties
    const vipProperties = filteredProperties.filter(property => property.isPremium === true);
    const regularProperties = filteredProperties.filter(property => property.isPremium !== true);


    // Render VIP properties
    if (vipProperties.length === 0) {
        const activeCategory = document.querySelector('.category-item.active');
        const categoryName = activeCategory ? activeCategory.textContent.trim() : '';

        vipGrid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="text-gray-400 mb-2">
                    <i class="fa-solid fa-crown text-3xl"></i>
                </div>
                <p class="text-gray-600 font-medium">VIP elan tapılmadı</p>
                <p class="text-gray-500 text-sm">${categoryName !== 'Hamısı' ? `${categoryName} kateqoriyasında` : 'Hazırda'} VIP elan yoxdur</p>
            </div>
        `;
        // Hide slider controls when no VIP properties
        if (vipSlider.controls) {
            vipSlider.controls.classList.add('hidden');
        }
    } else {
        vipProperties.forEach(property => {
            vipGrid.appendChild(createPropertyCard(property, true));
        });

        // Initialize VIP slider if more than 3 properties
        initializeVipSlider(vipProperties.length);
    }

    // Render regular properties
    if (regularProperties.length === 0) {
        const activeCategory = document.querySelector('.category-item.active');
        const categoryName = activeCategory ? activeCategory.textContent.trim() : '';

        regularGrid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="text-gray-400 mb-2">
                    <i class="fa-solid fa-home text-3xl"></i>
                </div>
                <p class="text-gray-600 font-medium">Adi elan tapılmadı</p>
                <p class="text-gray-500 text-sm">${categoryName !== 'Hamısı' ? `${categoryName} kateqoriyasında` : 'Hazırda'} adi elan yoxdur</p>
            </div>
        `;
    } else {
        regularProperties.forEach(property => {
            regularGrid.appendChild(createPropertyCard(property, false));
        });
    }

    // Update counters
    vipCount.textContent = `${vipProperties.length} VIP elan`;
    regularCount.textContent = `${regularProperties.length} adi elan`;
};

// API Functions
const fetchListings = async (filters = {}) => {
    try {
        showLoading('both');

        let response;
        if (Object.keys(filters).length > 0) {
            response = await fetch(FILTER_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
        } else {
            response = await fetch(API_URL);
        }

        if (!response.ok) {
            throw new Error(`HTTP error! ${response.status}`);
        }

        const data = await response.json();
        const properties = Array.isArray(data) ? data : [];
        renderGrid(properties);

    } catch (error) {
        showError('Elanları yükləməkdə xəta baş verdi. Lütfən yenidən cəhd edin.');
    }
};

// Fetch all listings (no filters)
const fetchAllListings = async () => {
    try {
        showLoading('both');

        // Try multiple endpoints to get all listings
        const endpoints = [
            'https://localhost:7027/api/Property/GetAllListings',
            'https://localhost:7027/api/Listing/GetAllListings',
            'https://localhost:7027/api/Filter/GetListingsByAdvertType?type=1',
            'https://localhost:7027/api/Filter/GetListingsByAdvertType?type=2'
        ];

        let allProperties = [];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        allProperties = [...allProperties, ...data];
                    }
                }
            } catch (e) {
                // Continue with next endpoint
            }
        }

        if (allProperties.length > 0) {
            // Remove duplicates based on ID
            const uniqueProperties = allProperties.filter((property, index, self) =>
                index === self.findIndex(p => p.id === property.id)
            );
            renderGrid(uniqueProperties);
        } else {
            // Fallback to original API
            await fetchListings();
        }

    } catch (error) {
        // Final fallback
        try {
            await fetchListings();
        } catch (fallbackError) {
            showError('Elanları yükləməkdə xəta baş verdi.');
        }
    }
};

// Fetch listings by category
const fetchListingsByCategory = async (categoryId) => {
    try {
        showLoading('both');
        const response = await fetch(`${CATEGORY_API}?categoryId=${categoryId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! ${response.status}`);
        }

        const data = await response.json();
        const properties = Array.isArray(data) ? data : [];
        renderGrid(properties);

    } catch (error) {
        showError('Kateqoriya elanları yükləməkdə xəta baş verdi.');
    }
};

// Initialize DOM elements
const initializeDOMElements = () => {
    vipGrid = document.getElementById('vipGrid');
    regularGrid = document.getElementById('regularGrid');
    vipCount = document.getElementById('vipCount');
    regularCount = document.getElementById('regularCount');

    vipSlider.container = document.getElementById('vipContainer');
    vipSlider.controls = document.getElementById('vipSliderControls');
    vipSlider.prevBtn = document.getElementById('vipPrevBtn');
    vipSlider.nextBtn = document.getElementById('vipNextBtn');
    vipSlider.info = document.getElementById('vipSliderInfo');

    if (!vipGrid || !regularGrid || !vipCount || !regularCount) {
        return false;
    }

    return true;
};

// Load property types from API
const loadPropertyTypes = async () => {
    try {
        const response = await fetch(PROPERTY_API);
        if (!response.ok) {
            throw new Error(`HTTP error! ${response.status}`);
        }

        const data = await response.json();
        const propertyTypeSelect = document.getElementById('propertyTypeSelect');

        if (propertyTypeSelect && Array.isArray(data)) {
            propertyTypeSelect.innerHTML = '<option value="">Hamısı</option>';

            data.forEach(propertyType => {
                const option = document.createElement('option');
                option.value = propertyType.id;
                option.textContent = propertyType.name;
                propertyTypeSelect.appendChild(option);
            });
        }
    } catch (error) {
        // Silently handle error
    }
};

// Initialize application
const initializeApp = async () => {
    try {
        if (!initializeDOMElements()) {
            showError('Tətbiq başlatılmadı.');
            return;
        }

        await Promise.all([
            loadPropertyTypes(),
            fetchAllListings()
        ]);
    } catch (error) {
        showError('Tətbiq başlatılmadı.');
    }
};


// Filter and Modal related functionality
const initializeModalEvents = () => {
    // Filter modal events
    const filterModal = document.getElementById('filterModalWindow');
    const filterOverlay = document.getElementById('filterModalOverlay');
    const filterOpenBtn = document.getElementById('filterOpenBtn');
    const searchFilterBtn = document.getElementById('searchFilterBtn');
    const resetFilterBtn = document.getElementById('resetFilterBtn');

    // Location modal events
    const locationModal = document.getElementById('locationModalWindow');
    const locationOverlay = document.getElementById('locationModalOverlay');
    const locationInput = document.getElementById('mainLocationInput');
    const closeLocationBtn = document.getElementById('closeLocationModalBtn');
    const applyLocationBtn = document.getElementById('applyLocationBtn');
    const locationSearchInput = document.getElementById('locationSearchInput');
    const locationTabs = document.querySelectorAll('.location-tab-btn');

    // Category selection events
    const categorySelect = document.getElementById('propertyTypeSelect');

    // Open filter modal
    if (filterOpenBtn && filterModal && filterOverlay) {
        filterOpenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            filterModal.style.display = 'block';
            filterOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    // Close filter modal
    if (filterOverlay) {
        filterOverlay.addEventListener('click', () => {
            filterModal.style.display = 'none';
            filterOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    // Reset filter button
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            resetFilters();
        });
    }

    // Search filter button
    if (searchFilterBtn) {
        searchFilterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            applyFilters();
        });
    }

    // Category functionality 
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all category items
            categoryItems.forEach(cat => cat.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');

            const categoryId = item.getAttribute('data-id');

            if (categoryId === '' || categoryId === null) {
                // Show all listings using GetAllListings API
                fetchAllListings();
            } else {
                // Fetch listings by category
                fetchListingsByCategory(categoryId);
            }
        });
    });

    // Filter option buttons
    document.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });

    // Location modal events
    if (locationInput && locationModal && locationOverlay) {
        locationInput.addEventListener('click', (e) => {
            e.preventDefault();
            locationModal.style.display = 'block';
            locationOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden';

            // Switch to District tab by default
            locationTabs.forEach(t => t.classList.remove('active-tab'));
            locationTabs[0]?.classList.add('active-tab');
            loadLocationData('District');

            // Scroll to top when opening modal
            const listWrapper = document.querySelector('.location-list-wrapper');
            if (listWrapper) {
                listWrapper.scrollTop = 0;
            }
        });
    }

    // Close location modal
    if (locationOverlay) {
        locationOverlay.addEventListener('click', () => {
            locationModal.style.display = 'none';
            locationOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    if (closeLocationBtn) {
        closeLocationBtn.addEventListener('click', () => {
            locationModal.style.display = 'none';
            locationOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    // Location tabs
    locationTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            locationTabs.forEach(t => t.classList.remove('active-tab'));
            // Add active class to clicked tab
            tab.classList.add('active-tab');

            const tabType = tab.getAttribute('data-tab');
            loadLocationData(tabType === 'rayon' ? 'District' : 'Metro');

            // Scroll to top when switching tabs
            const listWrapper = document.querySelector('.location-list-wrapper');
            if (listWrapper) {
                listWrapper.scrollTop = 0;
            }
        });
    });

    // Location search
    if (locationSearchInput) {
        locationSearchInput.addEventListener('input', debounce(() => {
            const activeTab = document.querySelector('.location-tab-btn.active-tab');
            const tabType = activeTab?.getAttribute('data-tab');
            const searchTerm = locationSearchInput.value.toLowerCase();
            filterLocationList(tabType === 'rayon' ? 'District' : 'Metro', searchTerm);
        }, 300));
    }

    // Apply location
    if (applyLocationBtn) {
        applyLocationBtn.addEventListener('click', () => {
            applyLocationSelection();
        });
    }

    // Clear locations button
    const clearLocationsBtn = document.getElementById('clearLocationsBtn');
    if (clearLocationsBtn) {
        clearLocationsBtn.addEventListener('click', () => {
            selectedLocations = [];
            updateLocationDisplay();
            // Refresh the location list to show all items as unselected
            const activeTab = document.querySelector('.location-tab-btn.active-tab');
            const tabType = activeTab?.getAttribute('data-tab');
            if (tabType) {
                loadLocationData(tabType === 'rayon' ? 'District' : 'Metro');
            }
        });
    }

    // Main search form
    const searchForm = document.getElementById('home-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            searchListings();
        });
    }

    // Price dropdown events
    const priceBtn = document.getElementById('priceBtn');
    const priceDropdown = document.getElementById('priceDropdown');
    const applyPriceBtn = document.getElementById('applyPriceBtn');

    if (priceBtn && priceDropdown) {
        priceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            priceDropdown.classList.toggle('show');
        });
    }

    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', () => {
            const priceMin = document.getElementById('priceMin')?.value;
            const priceMax = document.getElementById('priceMax')?.value;

            if (priceDropdown) priceDropdown.classList.remove('show');

            // Trigger search with new price values
            searchListings();
        });
    }

    // Click outside to close price dropdown
    document.addEventListener('click', (e) => {
        if (priceBtn && priceDropdown &&
            !priceBtn.contains(e.target) &&
            !priceDropdown.contains(e.target)) {
            priceDropdown.classList.remove('show');
        }
    });
};

// Reset all filters
const resetFilters = () => {
    // Reset all option buttons
    document.querySelectorAll('.btn-option.active').forEach(btn => {
        btn.classList.remove('active');
    });

    // Reset input fields
    const inputs = [
        'priceMinInput', 'priceMaxInput', 'areaMinInput', 'areaMaxInput',
        'floorMinInput', 'floorMaxInput'
    ];

    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });

    // Reset location
    selectedLocations = [];
    const locationInput = document.getElementById('mainLocationInput');
    if (locationInput) locationInput.textContent = 'Rayon / Metro';

    // Reset category select
    const categorySelect = document.getElementById('propertyTypeSelect');
    if (categorySelect) categorySelect.value = '';

    // Fetch listings without filters
    fetchListings();
};

// Apply filters and search (from modal)
const applyFilters = () => {
    const filters = {};

    // Advert type - use filtering approach like other options
    const selectedAdvertTypes = Array.from(document.querySelectorAll('.btn-option[data-val="1"], .btn-option[data-val="2"]'))
        .filter(btn => btn.classList.contains('active'));
    if (selectedAdvertTypes.length > 0) {
        const val = selectedAdvertTypes[0].getAttribute('data-val');
        filters.AdvertType = parseInt(val);
    }

    // Categories
    const selectedCategories = Array.from(document.querySelectorAll('.btn-option[data-category].active'))
        .map(btn => parseInt(btn.getAttribute('data-category')));
    if (selectedCategories.length > 0) {
        filters.CategoryIds = selectedCategories;
    }

    // Rooms
    const selectedRooms = Array.from(document.querySelectorAll('.btn-option[data-room].active'))
        .map(btn => {
            const val = btn.getAttribute('data-room');
            return val === '5' ? 5 : parseInt(val);
        });
    if (selectedRooms.length > 0) {
        filters.Rooms = selectedRooms;
    }

    // Creator types
    const selectedCreatorTypes = Array.from(document.querySelectorAll('.btn-option[data-creator-type].active'))
        .map(btn => parseInt(btn.getAttribute('data-creator-type')));
    if (selectedCreatorTypes.length > 0) {
        filters.CreatorType = selectedCreatorTypes[0]; // Backend expects single value
    }

    // Renovations
    const selectedRenovations = Array.from(document.querySelectorAll('.btn-option[data-renovation].active'))
        .map(btn => parseInt(btn.getAttribute('data-renovation')));
    if (selectedRenovations.length > 0) {
        filters.Renovation = selectedRenovations[0]; // Backend expects single value
    }

    // Floor filters
    const selectedFloorFilters = Array.from(document.querySelectorAll('.btn-option[data-floor-filter].active'))
        .map(btn => parseInt(btn.getAttribute('data-floor-filter')));
    if (selectedFloorFilters.length > 0) {
        filters.FloorFilterType = selectedFloorFilters[0]; // Backend expects single value
    }

    // Price range
    const priceMin = document.getElementById('priceMinInput')?.value;
    const priceMax = document.getElementById('priceMaxInput')?.value;
    if (priceMin) filters.PriceMin = parseFloat(priceMin);
    if (priceMax) filters.PriceMax = parseFloat(priceMax);

    // Area range
    const areaMin = document.getElementById('areaMinInput')?.value;
    const areaMax = document.getElementById('areaMaxInput')?.value;
    if (areaMin) filters.AreaMin = parseFloat(areaMin);
    if (areaMax) filters.AreaMax = parseFloat(areaMax);

    // Floor range
    const floorMin = document.getElementById('floorMinInput')?.value;
    const floorMax = document.getElementById('floorMaxInput')?.value;
    if (floorMin) filters.FloorMin = parseInt(floorMin);
    if (floorMax) filters.FloorMax = parseInt(floorMax);

    // District IDs
    const selectedDistrictIds = selectedLocations.filter(loc => loc.type === 'district').map(loc => loc.id);
    if (selectedDistrictIds.length > 0) {
        filters.DistrictIds = selectedDistrictIds;
    }

    // Metro station IDs
    const selectedMetroIds = selectedLocations.filter(loc => loc.type === 'metro').map(loc => loc.id);
    if (selectedMetroIds.length > 0) {
        filters.MetroStationIds = selectedMetroIds;
    }

    // Close modal
    const filterModal = document.getElementById('filterModalWindow');
    const filterOverlay = document.getElementById('filterModalOverlay');
    if (filterModal && filterOverlay) {
        filterModal.style.display = 'none';
        filterOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Apply filters
    fetchListings(filters);
};

// Search listings (from main form)
const searchListings = () => {
    const filters = {};

    // Advert type from main form
    const advertType = document.getElementById('advertType')?.value;
    if (advertType) filters.AdvertType = parseInt(advertType);

    // Property type from main form
    const propertyType = document.getElementById('propertyTypeSelect')?.value;
    if (propertyType) filters.CategoryIds = [parseInt(propertyType)];

    // Rooms from main form
    const rooms = document.getElementById('roomCount')?.value;
    if (rooms) filters.Rooms = [parseInt(rooms)];

    // Price from main form
    const priceMin = document.getElementById('priceMin')?.value;
    const priceMax = document.getElementById('priceMax')?.value;
    if (priceMin) filters.PriceMin = parseFloat(priceMin);
    if (priceMax) filters.PriceMax = parseFloat(priceMax);

    // Districts
    const selectedDistrictIds = selectedLocations.filter(loc => loc.type === 'district').map(loc => loc.id);
    if (selectedDistrictIds.length > 0) {
        filters.DistrictIds = selectedDistrictIds;
    }

    // Metro stations
    const selectedMetroIds = selectedLocations.filter(loc => loc.type === 'metro').map(loc => loc.id);
    if (selectedMetroIds.length > 0) {
        filters.MetroStationIds = selectedMetroIds;
    }


    // Always use filter API if any filters are applied, including location filters
    if (Object.keys(filters).length > 0) {
        fetchListings(filters);
    } else {
        fetchListings();
    }
};

// Debounce utility function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Location modal functions
const loadLocationData = async (type) => {
    const container = document.getElementById('locationListContainer');
    const loadingEl = document.getElementById('locationLoading');

    if (!container) return;

    // Show loading
    if (loadingEl) loadingEl.style.display = 'block';
    container.innerHTML = '';

    try {
        const apiUrl = type === 'District' ? DISTRICT_API : METRO_API;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! ${response.status}`);
        }

        const data = await response.json();

        // Hide loading
        if (loadingEl) loadingEl.style.display = 'none';

        renderLocationList(data, type);
    } catch (error) {
        if (loadingEl) loadingEl.style.display = 'none';
        container.innerHTML = `<div class="text-red-500 text-center py-4">${type} məlumatları yüklənmədi</div>`;
    }
};

const renderLocationList = (data, type) => {
    const container = document.getElementById('locationListContainer');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-gray-400 mb-2">
                    <i class="fa-solid fa-search text-3xl"></i>
                </div>
                <p class="text-gray-600">Məlumat tapılmadı</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'location-list-item';

        // Check if this item is selected
        const isSelected = selectedLocations.some(loc =>
            loc.id === item.id && loc.type === type.toLowerCase()
        );

        if (isSelected) {
            div.classList.add('selected');
        }

        div.innerHTML = `
            <span>${item.name}</span>
            <i class="fa-solid ${isSelected ? 'fa-check text-green-600' : 'fa-plus text-blue-600'}"></i>
        `;

        div.addEventListener('click', () => {
            toggleLocationSelection(item, type, div);
        });

        container.appendChild(div);
    });

    // Update selected count
    updateSelectedCount();
};

const updateSelectedCount = () => {
    const selectedCountEl = document.getElementById('selectedCount');
    if (selectedCountEl) {
        selectedCountEl.textContent = `Seçim: ${selectedLocations.length}`;
    }
};

const toggleLocationSelection = (item, type, element) => {
    const isSelected = selectedLocations.some(loc =>
        loc.id === item.id && loc.type === type.toLowerCase()
    );

    if (isSelected) {
        // Remove from selection
        selectedLocations = selectedLocations.filter(loc =>
            !(loc.id === item.id && loc.type === type.toLowerCase())
        );
        element.querySelector('i').className = 'fa-solid fa-plus text-blue-600';
        element.classList.remove('selected');
    } else {
        // Add to selection
        selectedLocations.push({
            id: item.id,
            name: item.name,
            type: type.toLowerCase()
        });
        element.querySelector('i').className = 'fa-solid fa-check text-green-600';
        element.classList.add('selected');
    }

    updateLocationDisplay();
    updateSelectedCount();
};

const updateLocationDisplay = () => {
    const locationInput = document.getElementById('mainLocationInput');
    if (!locationInput) return;

    if (selectedLocations.length === 0) {
        locationInput.textContent = 'Rayon / Metro';
    } else if (selectedLocations.length === 1) {
        locationInput.textContent = selectedLocations[0].name;
    } else {
        locationInput.textContent = `${selectedLocations.length} yerləşmə seçildi`;
    }
};

const filterLocationList = async (type, searchTerm) => {
    if (searchTerm.trim() === '') {
        loadLocationData(type);
        return;
    }

    try {
        const apiUrl = type === 'District' ? DISTRICT_API : METRO_API;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! ${response.status}`);
        }

        const data = await response.json();
        const filtered = data.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        renderLocationList(filtered, type);
    } catch (error) {
    }
};

const applyLocationSelection = () => {
    // Close location modal
    const locationModal = document.getElementById('locationModalWindow');
    const locationOverlay = document.getElementById('locationModalOverlay');

    if (locationModal && locationOverlay) {
        locationModal.style.display = 'none';
        locationOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Clear search input
    const searchInput = document.getElementById('locationSearchInput');
    if (searchInput) searchInput.value = '';

};

// VIP Slider Functions
const initializeVipSlider = (totalItems) => {
    if (totalItems <= 3) {
        // Hide slider controls if 3 or fewer items
        if (vipSlider.controls) {
            vipSlider.controls.classList.add('hidden');
        }
        return;
    }

    // Show slider controls
    if (vipSlider.controls) {
        vipSlider.controls.classList.remove('hidden');
    }

    // Calculate total slides needed
    vipSlider.totalSlides = Math.ceil(totalItems / vipSlider.itemsPerSlide);
    vipSlider.currentSlide = 0;

    // Update slider info
    updateVipSliderInfo();

    // Add event listeners for slider buttons
    if (vipSlider.prevBtn) {
        vipSlider.prevBtn.addEventListener('click', () => {
            if (vipSlider.currentSlide > 0) {
                vipSlider.currentSlide--;
                updateVipSliderPosition();
                updateVipSliderInfo();
            }
        });
    }

    if (vipSlider.nextBtn) {
        vipSlider.nextBtn.addEventListener('click', () => {
            if (vipSlider.currentSlide < vipSlider.totalSlides - 1) {
                vipSlider.currentSlide++;
                updateVipSliderPosition();
                updateVipSliderInfo();
            }
        });
    }

    // Update button states
    updateVipSliderButtons();
};

const updateVipSliderPosition = () => {
    if (!vipSlider.container || !vipGrid) return;

    const slideWidth = 100 / vipSlider.totalSlides;
    const translateX = -vipSlider.currentSlide * slideWidth;

    vipGrid.style.transform = `translateX(${translateX}%)`;
    vipGrid.style.display = 'flex';
    vipGrid.style.flexWrap = 'nowrap';

    // Update individual item widths
    const items = vipGrid.children;
    for (let i = 0; i < items.length; i++) {
        items[i].style.flex = `0 0 ${slideWidth}%`;
        items[i].style.maxWidth = `${slideWidth}%`;
    }
};

const updateVipSliderInfo = () => {
    if (vipSlider.info) {
        vipSlider.info.textContent = `${vipSlider.currentSlide + 1} / ${vipSlider.totalSlides}`;
    }
};

const updateVipSliderButtons = () => {
    if (vipSlider.prevBtn) {
        vipSlider.prevBtn.disabled = vipSlider.currentSlide === 0;
    }
    if (vipSlider.nextBtn) {
        vipSlider.nextBtn.disabled = vipSlider.currentSlide >= vipSlider.totalSlides - 1;
    }
};


// API Configuration
const LOGOUT_API = 'https://localhost:7027/api/Authorization/LogOut';

// =================================================================
// AUTHENTICATION & UI MANAGEMENT (Giriş/Çıxış İdarəetməsi)
// =================================================================

const handleLogout = async () => {
    try {
        const token = localStorage.getItem('jwt');

        const response = await fetch(LOGOUT_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        // Clear localStorage
        localStorage.removeItem('jwt');

        // Update UI and redirect
        updateAuthUI();
        window.location.href = './index.html';

    } catch (error) {
        localStorage.removeItem('jwt');
        updateAuthUI();
        console.error('Çıxış zamanı xəta:', error);
    }
};

const updateAuthUI = () => {
    const newListingBtn = document.getElementById('newListing');
    const loginLink = document.getElementById('loginLink');
    const userDropdown = document.getElementById('userDropdown');

    const token = localStorage.getItem('jwt');

    if (!newListingBtn) return;

    if (token) {
        // User is logged in
        // Hide login button
        if (loginLink) {
            loginLink.classList.add('hidden');
        }

        // Show user dropdown
        if (userDropdown) {
            userDropdown.classList.remove('hidden');
        }

        // Enable "Yeni elan" button
        newListingBtn.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
        newListingBtn.classList.add('cursor-pointer');
        newListingBtn.href = './Create.html';

    } else {
        // User is NOT logged in
        // Show login button
        if (loginLink) {
            loginLink.classList.remove('hidden');
        }

        // Hide user dropdown
        if (userDropdown) {
            userDropdown.classList.add('hidden');
        }

        // Disable "Yeni elan" button (make it look inactive)
        newListingBtn.classList.add('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
        newListingBtn.classList.remove('cursor-pointer');
        newListingBtn.href = '#';
    }
};

// Initialize dropdown toggle functionality
const initializeDropdown = () => {
    const userDropdownBtn = document.getElementById('userDropdownBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const exitBtn = document.getElementById('exitBtn');

    // Toggle dropdown on button click
    if (userDropdownBtn && userDropdownMenu) {
        userDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdownBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.add('hidden');
            }
        });
    }

    // Handle exit button
    if (exitBtn) {
        exitBtn.addEventListener('click', handleLogout);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeModalEvents();
    updateAuthUI();
    initializeDropdown();
});