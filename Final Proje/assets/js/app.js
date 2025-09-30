// API Configuration
const API_URL = 'https://localhost:7027/api/Listing/GetAllListings';
const FILTER_API = 'https://localhost:7027/api/Filter/GetListingsByFilter';
const CATEGORY_API = 'https://localhost:7027/api/Filter/GetListingsByCategory';
const PROPERTY_API = 'https://localhost:7027/api/Category/GetAll';
const DISTRICT_API = 'https://localhost:7027/api/Dictrict/GetAll';
const METRO_API = 'https://localhost:7027/api/MetroStation/GetAll';

let selectedCategories = [];
let selectedRooms = [];
let selectedRenovations = []; // Changed to array for multiple selections
let selectedCreatorTypes = [];
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
    console.log('Creating property card for:', property); // Debug log
    const card = document.createElement('a');
    card.href = `./Property-Detail.html?id=${property.id}`;
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

    // Apply client-side location filtering if needed
    let filteredProperties = properties;
    if (selectedLocations.length > 0) {
        filteredProperties = properties.filter(property => {
            // Check if property matches any selected location
            return selectedLocations.some(location => {
                if (location.type === 'district') {
                    return property.districtId === location.id ||
                        property.location?.district?.toLowerCase().includes(location.name.toLowerCase());
                } else if (location.type === 'metro') {
                    return property.metroStationId === location.id ||
                        property.location?.metro?.toLowerCase().includes(location.name.toLowerCase());
                }
                return false;
            });
        });
        console.log(`Client-side location filtering: ${properties.length} -> ${filteredProperties.length} properties`);
    }

    // Separate VIP and regular properties
    const vipProperties = filteredProperties.filter(property => property.isPremium === true);
    const regularProperties = filteredProperties.filter(property => property.isPremium !== true);

    console.log(`Total properties: ${properties.length}, VIP: ${vipProperties.length}, Regular: ${regularProperties.length}`);

    // Debug: Show all properties with location info
    console.log('All properties with location info:', properties.map(p => ({
        id: p.id,
        title: p.title,
        isPremium: p.isPremium,
        district: p.location?.district,
        city: p.location?.city,
        districtId: p.districtId,
        metroStationId: p.metroStationId
    })));

    // Debug: Show filtered properties
    if (filteredProperties.length !== properties.length) {
        console.log('Filtered properties with location info:', filteredProperties.map(p => ({
            id: p.id,
            title: p.title,
            isPremium: p.isPremium,
            district: p.location?.district,
            city: p.location?.city,
            districtId: p.districtId,
            metroStationId: p.metroStationId
        })));
    }

    if (vipProperties.length > 0) {
        console.log('VIP properties found:', vipProperties.map(p => ({
            id: p.id,
            category: p.categoryId,
            title: p.title,
            isPremium: p.isPremium,
            district: p.location?.district,
            districtId: p.districtId,
            metroStationId: p.metroStationId
        })));
    } else {
        console.log('No VIP properties found in current filter results');
    }

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
            console.log('Using FILTER_API with filters:', filters);
            console.log('API URL:', FILTER_API);
            response = await fetch(FILTER_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
        } else {
            console.log('Using API_URL (no filters)');
            console.log('API URL:', API_URL);
            response = await fetch(API_URL);
        }

        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);

        if (!response.ok) {
            throw new Error(`HTTP error! ${response.status}`);
        }

        const data = await response.json();
        const properties = Array.isArray(data) ? data : [];
        console.log('API Response data:', properties);
        renderGrid(properties);

    } catch (error) {
        console.error('Failed to fetch properties:', error);
        showError('Elanları yükləməkdə xəta baş verdi. Lütfən yenidən cəhd edin.');
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

        console.log(`Category ${categoryId} listings:`, properties);
        renderGrid(properties);

    } catch (error) {
        console.error('Failed to fetch category listings:', error);
        showError('Kateqoriya elanları yükləməkdə xəta baş verdi. Lütfən yenidən cəhd edin.');
    }
};

// Initialize DOM elements
const initializeDOMElements = () => {
    vipGrid = document.getElementById('vipGrid');
    regularGrid = document.getElementById('regularGrid');
    vipCount = document.getElementById('vipCount');
    regularCount = document.getElementById('regularCount');

    // Initialize VIP slider elements
    vipSlider.container = document.getElementById('vipContainer');
    vipSlider.controls = document.getElementById('vipSliderControls');
    vipSlider.prevBtn = document.getElementById('vipPrevBtn');
    vipSlider.nextBtn = document.getElementById('vipNextBtn');
    vipSlider.info = document.getElementById('vipSliderInfo');

    if (!vipGrid || !regularGrid || !vipCount || !regularCount) {
        console.error('Required DOM elements not found');
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
            // Clear existing options except the first one
            propertyTypeSelect.innerHTML = '<option value="">Hamısı</option>';

            // Add property types from API
            data.forEach(propertyType => {
                const option = document.createElement('option');
                option.value = propertyType.id;
                option.textContent = propertyType.name;
                propertyTypeSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load property types:', error);
    }
};

// Initialize application
const initializeApp = async () => {
    try {
        if (!initializeDOMElements()) {
            console.error('Failed to initialize DOM elements');
            return;
        }

        // Load property types and listings in parallel
        await Promise.all([
            loadPropertyTypes(),
            fetchListings()
        ]);
    } catch (error) {
        console.error('Application initialization failed:', error);
        showError('Tətbiq başlatılmadı. Zəhmət olmamasa səhifəni yeniləyin.');
    }
};

// Test card click functionality
const testCardClick = () => {
    console.log('Testing card click functionality...');
    const testCard = document.createElement('a');
    testCard.href = './Property-Detail.html?id=1';
    testCard.className = 'property-card block bg-white rounded-xl shadow-md overflow-hidden cursor-pointer no-underline';
    testCard.style.margin = '10px';
    testCard.innerHTML = '<div class="p-4"><h3>Test Card</h3><p>Click me to go to Property Detail</p></div>';

    // Add to page for testing
    document.body.appendChild(testCard);
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

    // Category buttons
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all categories
            document.querySelectorAll('.category-item').forEach(cat => cat.classList.remove('active'));
            // Add active class to clicked category
            item.classList.add('active');

            const categoryId = item.getAttribute('data-id');
            const categoryName = item.textContent.trim();
            console.log('Category clicked:', categoryId, 'Name:', categoryName);

            if (categorySelect) {
                categorySelect.value = categoryId;
            }

            // If "Hamısı" (All) is selected, fetch all listings without filters
            if (categoryId === '' || categoryId === null) {
                console.log('Showing all properties (no category filter)');
                fetchListings();
            } else {
                // Use the category-specific API endpoint
                console.log(`Fetching listings for category: ${categoryName} (ID: ${categoryId})`);
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
            console.log('Tab clicked:', tabType);
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
            console.log('Searching in tab:', tabType, 'Term:', searchTerm);
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
                console.log('Clearing locations for tab:', tabType);
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

// Apply filters and search
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

    console.log('Search filters applied:', filters);
    console.log('Selected locations:', selectedLocations);

    // Debug location filtering
    if (selectedLocations.length > 0) {
        console.log('Location filter details:');
        selectedLocations.forEach(loc => {
            console.log(`- ${loc.type}: ${loc.name} (ID: ${loc.id})`);
        });
    } else {
        console.log('No location filters applied');
    }

    // Always use filter API if any filters are applied, including location filters
    if (Object.keys(filters).length > 0) {
        fetchListings(filters);
    } else {
        // If no filters at all, fetch all listings
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
        console.error(`Failed to load ${type} data:`, error);
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
        console.error(`Error filtering ${type} data:`, error);
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

    console.log('Location selections applied:', selectedLocations);
    console.log('Modal closed. User needs to click search button to apply filters.');
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    initializeApp();
    initializeModalEvents();
    console.log('App initialized successfully');
    // Uncomment next line for testing
    // testCardClick();
});
